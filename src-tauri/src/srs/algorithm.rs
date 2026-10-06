// ============================================================
// LEXORA — SM-2 Algorithm (pure function, deterministic)
// ============================================================

/// Grade: 0=blackout, 1=wrong, 2=hard, 3=good, 4=easy
pub type Grade = u8;

#[derive(Debug, Clone)]
pub struct ReviewState {
    pub ease: f64,
    pub interval: i64, // days
    pub repetitions: i64,
    pub lapses: i64,
}

impl Default for ReviewState {
    fn default() -> Self {
        Self {
            ease: 2.5,
            interval: 0,
            repetitions: 0,
            lapses: 0,
        }
    }
}

/// Calculate next review state. Pure function — no side effects.
/// Same inputs always produce same outputs (deterministic SRS).
pub fn calculate_next_review(state: &ReviewState, grade: Grade) -> (ReviewState, i64) {
    let mut new = state.clone();

    match grade {
        0 => {
            // Blackout — reset to beginning
            new.interval = 1;
            new.repetitions = 0;
            new.lapses += 1;
            new.ease = (state.ease - 0.2).max(1.3);
        }
        1 => {
            // Wrong — back to learning
            new.interval = 1;
            new.repetitions = 0;
            new.lapses += 1;
            new.ease = (state.ease - 0.15).max(1.3);
        }
        2 => {
            // Hard — slight ease decrease, short interval
            new.interval = (state.interval as f64 * 1.2).max(1.0) as i64;
            new.repetitions += 1;
            new.ease = (state.ease - 0.15).max(1.3);
        }
        3 => {
            // Good — standard SM-2 progression
            new.interval = match state.repetitions {
                0 => 1,
                1 => 4,
                _ => (state.interval as f64 * state.ease).round() as i64,
            };
            new.repetitions += 1;
        }
        _ => {
            // Easy (grade 4) — bonus interval + ease bump
            new.interval = match state.repetitions {
                0 => 1,
                1 => 4,
                _ => (state.interval as f64 * state.ease * 1.3).round() as i64,
            };
            new.repetitions += 1;
            new.ease = (state.ease + 0.1).min(3.0);
        }
    }

    // Minimum interval: 1 day
    new.interval = new.interval.max(1);

    let days_until_next = new.interval;
    (new, days_until_next)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_correct_answer_gives_1_day() {
        let state = ReviewState::default();
        let (next, days) = calculate_next_review(&state, 3);
        assert_eq!(days, 1);
        assert_eq!(next.repetitions, 1);
    }

    #[test]
    fn second_correct_gives_4_days() {
        let state = ReviewState {
            repetitions: 1,
            interval: 1,
            ..Default::default()
        };
        let (next, days) = calculate_next_review(&state, 3);
        assert_eq!(days, 4);
        assert_eq!(next.repetitions, 2);
    }

    #[test]
    fn blackout_resets_to_1_day() {
        let state = ReviewState {
            repetitions: 5,
            interval: 30,
            ease: 2.5,
            lapses: 0,
        };
        let (next, days) = calculate_next_review(&state, 0);
        assert_eq!(days, 1);
        assert_eq!(next.repetitions, 0);
        assert_eq!(next.lapses, 1);
    }

    #[test]
    fn ease_never_goes_below_1_3() {
        let state = ReviewState {
            ease: 1.31,
            interval: 1,
            repetitions: 1,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 0);
        assert!(next.ease >= 1.3);
    }

    #[test]
    fn easy_increases_ease() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 3,
            interval: 10,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 4);
        assert!(next.ease > 2.5);
    }

    // ── Grade 0 (blackout) ──────────────────────────────────

    #[test]
    fn blackout_decreases_ease_by_0_2_when_above_floor() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 4,
            interval: 20,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 0);
        assert!((next.ease - 2.3).abs() < f64::EPSILON);
        assert_eq!(next.interval, 1);
        assert_eq!(next.repetitions, 0);
        assert_eq!(next.lapses, 1);
    }

    // ── Grade 1 (wrong) ─────────────────────────────────────

    #[test]
    fn wrong_resets_progress_and_decreases_ease_by_0_15() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 6,
            interval: 45,
            lapses: 2,
        };
        let (next, days) = calculate_next_review(&state, 1);
        assert_eq!(days, 1);
        assert_eq!(next.repetitions, 0);
        assert_eq!(next.lapses, 3);
        assert!((next.ease - 2.35).abs() < f64::EPSILON);
    }

    #[test]
    fn wrong_ease_never_below_1_3() {
        let state = ReviewState {
            ease: 1.4,
            repetitions: 2,
            interval: 4,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 1);
        assert_eq!(next.ease, 1.3);
    }

    // ── Grade 2 (hard) ──────────────────────────────────────

    #[test]
    fn hard_first_repetition_gives_minimum_interval() {
        // interval 0 * 1.2 = 0 → clamped to 1
        let state = ReviewState::default();
        let (next, days) = calculate_next_review(&state, 2);
        assert_eq!(days, 1);
        assert_eq!(
            next.repetitions, 1,
            "hard grade must still advance repetitions"
        );
        assert_eq!(next.lapses, 0, "hard grade must not count as a lapse");
    }

    #[test]
    fn hard_grows_interval_by_1_2_and_lowers_ease() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 3,
            interval: 10,
            lapses: 0,
        };
        let (next, days) = calculate_next_review(&state, 2);
        assert_eq!(days, 12);
        assert_eq!(next.repetitions, 4);
        assert!((next.ease - 2.35).abs() < f64::EPSILON);
    }

    #[test]
    fn hard_ease_never_below_1_3() {
        let state = ReviewState {
            ease: 1.35,
            repetitions: 2,
            interval: 5,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 2);
        assert_eq!(next.ease, 1.3);
    }

    // ── Grade 3 (good) ──────────────────────────────────────

    #[test]
    fn good_mature_word_multiplies_interval_by_ease() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 2,
            interval: 6,
            lapses: 0,
        };
        let (next, days) = calculate_next_review(&state, 3);
        assert_eq!(days, 15); // 6 * 2.5
        assert_eq!(next.repetitions, 3);
        assert_eq!(next.ease, 2.5, "good grade must not change ease");
        assert_eq!(next.lapses, 0);
    }

    // ── Grade 4 (easy) ──────────────────────────────────────

    #[test]
    fn easy_first_repetition_gives_1_day() {
        let state = ReviewState::default();
        let (next, days) = calculate_next_review(&state, 4);
        assert_eq!(days, 1);
        assert_eq!(next.repetitions, 1);
        assert!((next.ease - 2.6).abs() < f64::EPSILON);
    }

    #[test]
    fn easy_second_repetition_gives_4_days() {
        let state = ReviewState {
            repetitions: 1,
            interval: 1,
            ..Default::default()
        };
        let (next, days) = calculate_next_review(&state, 4);
        assert_eq!(days, 4);
        assert_eq!(next.repetitions, 2);
    }

    #[test]
    fn easy_mature_word_gets_bonus_multiplier() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 3,
            interval: 10,
            lapses: 0,
        };
        let (next, days) = calculate_next_review(&state, 4);
        // 10 * 2.5 * 1.3 = 32.5 → round = 33
        assert_eq!(days, 33);
        assert_eq!(next.repetitions, 4);
    }

    #[test]
    fn easy_ease_capped_at_3_0() {
        let state = ReviewState {
            ease: 2.95,
            repetitions: 5,
            interval: 30,
            lapses: 0,
        };
        let (next, _) = calculate_next_review(&state, 4);
        assert_eq!(next.ease, 3.0);
    }

    // ── Out-of-range grades ─────────────────────────────────

    #[test]
    fn grade_above_4_behaves_like_easy() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 3,
            interval: 10,
            lapses: 0,
        };
        let (easy, easy_days) = calculate_next_review(&state, 4);
        let (wild, wild_days) = calculate_next_review(&state, 99);
        assert_eq!(wild_days, easy_days);
        assert_eq!(wild.interval, easy.interval);
        assert_eq!(wild.ease, easy.ease);
        assert_eq!(wild.repetitions, easy.repetitions);
        assert_eq!(wild.lapses, easy.lapses);
    }

    #[test]
    fn deterministic_same_input_same_output() {
        let state = ReviewState {
            ease: 2.5,
            repetitions: 3,
            interval: 10,
            lapses: 0,
        };
        let (r1, d1) = calculate_next_review(&state, 3);
        let (r2, d2) = calculate_next_review(&state, 3);
        assert_eq!(d1, d2);
        assert_eq!(r1.interval, r2.interval);
        assert_eq!(r1.ease, r2.ease);
    }
}
