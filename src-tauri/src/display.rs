// ============================================================
// LEXORA — Multi-monitor geometry (logical pixels)
// Popup и стикеры позиционируются в work area монитора под
// курсором: разные scale_factor на соседних экранах не должны
// уносить окно на primary.
// ============================================================

use tauri::Monitor;

/// Прямоугольник в логических пикселях (как LogicalPosition / inner_size).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LogicalBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl LogicalBounds {
    pub fn from_physical(x: i32, y: i32, width: u32, height: u32, scale: f64) -> Self {
        let scale = if scale <= 0.0 { 1.0 } else { scale };
        Self {
            x: f64::from(x) / scale,
            y: f64::from(y) / scale,
            width: f64::from(width) / scale,
            height: f64::from(height) / scale,
        }
    }

    /// Work area (без dock/taskbar/menu bar) в логических пикселях.
    pub fn from_monitor(monitor: &Monitor) -> Self {
        let area = monitor.work_area();
        Self::from_physical(
            area.position.x,
            area.position.y,
            area.size.width,
            area.size.height,
            monitor.scale_factor(),
        )
    }
}

/// Прижать окно к границам монитора. Если окно больше work area —
/// закрепить в верхнем-левом углу с отступом (без panic на clamp).
pub fn clamp_to_bounds(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    bounds: &LogicalBounds,
    margin: f64,
) -> (f64, f64) {
    let min_x = bounds.x + margin;
    let min_y = bounds.y + margin;
    let max_x = bounds.x + bounds.width - width - margin;
    let max_y = bounds.y + bounds.height - height - margin;
    (
        if max_x < min_x {
            min_x
        } else {
            x.clamp(min_x, max_x)
        },
        if max_y < min_y {
            min_y
        } else {
            y.clamp(min_y, max_y)
        },
    )
}

/// Cocoa-координаты: origin внизу-слева, Y растёт вверх (как у NSEvent.mouseLocation).
/// Ставит окно чуть ниже-правее курсора, как системное контекстное меню;
/// у правого края — слева от курсора, чтобы не закрыть выделенный текст.
/// Возвращает origin окна (нижний-левый угол) в тех же Cocoa-пунктах.
pub fn anchor_popup_cocoa(
    cursor_x: f64,
    cursor_y: f64,
    width: f64,
    height: f64,
    visible: &LogicalBounds,
    margin: f64,
) -> (f64, f64) {
    let mut x = cursor_x + margin;
    if x + width > visible.x + visible.width - margin {
        x = cursor_x - width - margin;
    }
    // Ниже курсора: в Cocoa меньший Y — это ниже на экране. Origin — нижний край окна.
    let mut y = cursor_y - height - margin;
    if y < visible.y + margin {
        // Не влезает снизу — ставим над курсором.
        y = cursor_y + margin;
    }

    let min_x = visible.x + margin;
    let min_y = visible.y + margin;
    let max_x = visible.x + visible.width - width - margin;
    let max_y = visible.y + visible.height - height - margin;
    (
        if max_x < min_x {
            min_x
        } else {
            x.clamp(min_x, max_x)
        },
        if max_y < min_y {
            min_y
        } else {
            y.clamp(min_y, max_y)
        },
    )
}

/// Курсор в физических пикселях → физическая позиция окна рядом с ним.
/// Используем physical end-to-end: LogicalPosition + деление на scale на
/// мульти-мониторе macOS иногда оставляло окно на прошлом месте.
pub fn anchor_near_cursor_physical(
    cursor_physical_x: f64,
    cursor_physical_y: f64,
    width_logical: f64,
    height_logical: f64,
    work: &LogicalBounds,
    margin_logical: f64,
    scale: f64,
) -> (i32, i32) {
    let scale = if scale <= 0.0 { 1.0 } else { scale };
    let margin = margin_logical * scale;
    let width = width_logical * scale;
    let height = height_logical * scale;
    // Y растёт вниз. Не влезает справа/снизу — слева/над курсором,
    // чтобы окно не закрывало выделенный текст.
    let mut x = cursor_physical_x + margin;
    if x + width > work.x + work.width - margin {
        x = cursor_physical_x - width - margin;
    }
    let mut y = cursor_physical_y + margin;
    if y + height > work.y + work.height - margin {
        y = cursor_physical_y - height - margin;
    }

    // `work` here is already in physical pixels (monitor work_area).
    let min_x = work.x + margin;
    let min_y = work.y + margin;
    let max_x = work.x + work.width - width - margin;
    let max_y = work.y + work.height - height - margin;

    let clamped_x = if max_x < min_x {
        min_x
    } else {
        x.clamp(min_x, max_x)
    };
    let clamped_y = if max_y < min_y {
        min_y
    } else {
        y.clamp(min_y, max_y)
    };
    (clamped_x.round() as i32, clamped_y.round() as i32)
}

/// Курсор в физических пикселях → логическая позиция окна рядом с ним.
pub fn anchor_near_cursor(
    cursor_physical_x: f64,
    cursor_physical_y: f64,
    width: f64,
    height: f64,
    bounds: &LogicalBounds,
    margin: f64,
    scale: f64,
) -> (f64, f64) {
    let scale = if scale <= 0.0 { 1.0 } else { scale };
    let x = cursor_physical_x / scale + margin;
    let y = cursor_physical_y / scale + margin;
    clamp_to_bounds(x, y, width, height, bounds, margin)
}

/// CGEventGetLocation → Cocoa: origin снизу-слева у primary, Y вверх.
/// Высота primary — в **пунктах** (`NSScreen.frame`), не в `CGDisplayPixelsHigh()`.
/// На Retina pixels_high ≈ 2× пунктов: тот перевод «поднимает» курсор на монитор выше.
pub fn cocoa_from_cg_flipped(cg_x: f64, cg_y: f64, primary: &LogicalBounds) -> (f64, f64) {
    (cg_x, primary.y + primary.height - cg_y)
}

/// Точка внутри bounds (как hit-test курсора: min включительно, max исключительно).
pub fn point_in_bounds(x: f64, y: f64, bounds: &LogicalBounds) -> bool {
    x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height
}

/// Квадрат расстояния от точки до ближайшей точки прямоугольника (0, если внутри).
pub fn distance_sq_to_bounds(x: f64, y: f64, bounds: &LogicalBounds) -> f64 {
    let nearest_x = x.clamp(bounds.x, bounds.x + bounds.width);
    let nearest_y = y.clamp(bounds.y, bounds.y + bounds.height);
    let dx = x - nearest_x;
    let dy = y - nearest_y;
    dx * dx + dy * dy
}

/// Экран, на котором курсор; если в зазоре между мониторами — ближайший.
/// Нельзя подменять primary: иначе popup уезжает на другой дисплей.
pub fn pick_bounds_for_point(x: f64, y: f64, screens: &[LogicalBounds]) -> Option<LogicalBounds> {
    screens
        .iter()
        .copied()
        .find(|bounds| point_in_bounds(x, y, bounds))
        .or_else(|| {
            screens.iter().copied().min_by(|a, b| {
                distance_sq_to_bounds(x, y, a)
                    .partial_cmp(&distance_sq_to_bounds(x, y, b))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
        })
}

/// Стек стикеров у правого края work area сверху вниз.
pub fn sticker_stack_positions(
    count: u32,
    width: f64,
    height: f64,
    gap: f64,
    margin: f64,
    bounds: &LogicalBounds,
) -> Vec<(f64, f64)> {
    let x = bounds.x + bounds.width - width - margin;
    (0..count)
        .map(|i| {
            let y = bounds.y + margin + f64::from(i) * (height + gap);
            clamp_to_bounds(x, y, width, height, bounds, margin)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn secondary_2x() -> LogicalBounds {
        // Второй монитор справа от primary 1920×1080 @1x; сам 2560×1440 @2x.
        LogicalBounds::from_physical(1920, 0, 2560, 1440, 2.0)
    }

    #[test]
    fn physical_to_logical_uses_that_monitor_scale() {
        let bounds = secondary_2x();
        assert_eq!(bounds.x, 960.0);
        assert_eq!(bounds.y, 0.0);
        assert_eq!(bounds.width, 1280.0);
        assert_eq!(bounds.height, 720.0);
    }

    #[test]
    fn popup_stays_on_cursor_monitor() {
        let bounds = secondary_2x();
        // Курсор в центре второго монитора (физические пиксели).
        let (x, y) = anchor_near_cursor(1920.0 + 1280.0, 720.0, 460.0, 560.0, &bounds, 12.0, 2.0);
        assert!(x >= bounds.x);
        assert!(x + 460.0 <= bounds.x + bounds.width);
        assert!(y >= bounds.y);
        assert!(y + 560.0 <= bounds.y + bounds.height);
        // Не на primary (x >= 0..1920 logical @1x would be < 960).
        assert!(x >= 960.0);
    }

    #[test]
    fn physical_anchor_matches_cursor_monitor() {
        // Second monitor: physical origin 1920,0 size 2560×1440 @2x
        let work = LogicalBounds {
            x: 1920.0,
            y: 0.0,
            width: 2560.0,
            height: 1440.0,
        };
        let (x, y) =
            anchor_near_cursor_physical(1920.0 + 1280.0, 720.0, 460.0, 560.0, &work, 12.0, 2.0);
        assert!(x >= 1920);
        assert!(x + (460.0 * 2.0) as i32 <= 1920 + 2560);
        assert!(y >= 0);
        assert!(y + (560.0 * 2.0) as i32 <= 1440);
        // Near cursor (cursor phys x = 3200, + margin 24)
        assert!((x as f64 - (3200.0 + 24.0)).abs() < 1.0);
    }

    #[test]
    fn popup_clamps_when_cursor_is_at_bottom_right() {
        let bounds = secondary_2x();
        let (x, y) = anchor_near_cursor(
            1920.0 + 2560.0 - 1.0,
            1440.0 - 1.0,
            460.0,
            560.0,
            &bounds,
            12.0,
            2.0,
        );
        assert!((x - (bounds.x + bounds.width - 460.0 - 12.0)).abs() < 0.01);
        assert!((y - (bounds.y + bounds.height - 560.0 - 12.0)).abs() < 0.01);
    }

    #[test]
    fn clamp_does_not_panic_when_window_exceeds_monitor() {
        let tiny = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 400.0,
            height: 300.0,
        };
        let (x, y) = clamp_to_bounds(999.0, 999.0, 460.0, 560.0, &tiny, 12.0);
        assert_eq!((x, y), (12.0, 12.0));
    }

    #[test]
    fn stickers_stack_on_secondary_right_edge() {
        let bounds = secondary_2x();
        let positions = sticker_stack_positions(3, 380.0, 150.0, 16.0, 24.0, &bounds);
        assert_eq!(positions.len(), 3);
        let expected_x = bounds.x + bounds.width - 380.0 - 24.0;
        for (i, (x, y)) in positions.iter().enumerate() {
            assert!((x - expected_x).abs() < 0.01);
            assert!(*y >= bounds.y);
            assert!(*y + 150.0 <= bounds.y + bounds.height + 0.01);
            if i > 0 {
                assert!(*y > positions[i - 1].1);
            }
        }
    }

    #[test]
    fn cocoa_popup_sits_below_right_of_cursor() {
        let visible = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        };
        let (x, y) = anchor_popup_cocoa(200.0, 600.0, 460.0, 320.0, &visible, 12.0);
        assert!((x - 212.0).abs() < 0.01);
        // origin.y = cursor.y - height - margin = 600 - 320 - 12 = 268
        assert!((y - 268.0).abs() < 0.01);
    }

    #[test]
    fn cocoa_popup_flips_above_when_cursor_is_near_bottom() {
        let visible = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        };
        let (x, y) = anchor_popup_cocoa(100.0, 40.0, 460.0, 320.0, &visible, 12.0);
        assert!(x >= 12.0);
        // Below would be y = 40 - 320 - 12 = -292; flip above: y = 40 + 12 = 52
        assert!((y - 52.0).abs() < 0.01);
    }

    #[test]
    fn cocoa_popup_flips_left_instead_of_covering_the_cursor() {
        let visible = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        };
        // Cursor near the right edge: the popup must open to its left.
        let (x, _) = anchor_popup_cocoa(1300.0, 600.0, 460.0, 320.0, &visible, 12.0);
        assert!((x - (1300.0 - 460.0 - 12.0)).abs() < 0.01);
        assert!(x + 460.0 <= 1300.0);
    }

    #[test]
    fn physical_popup_flips_left_near_the_right_edge() {
        let work = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 2880.0,
            height: 1800.0,
        };
        // 2× scale: popup 460 pt = 920 px, margin 24 px.
        let (x, y) = anchor_near_cursor_physical(2700.0, 400.0, 460.0, 320.0, &work, 12.0, 2.0);
        assert_eq!(x, (2700.0 - 920.0 - 24.0) as i32);
        assert_eq!(y, 424);
    }

    #[test]
    fn cocoa_popup_clamps_to_visible_frame() {
        let visible = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 800.0,
            height: 600.0,
        };
        let (x, y) = anchor_popup_cocoa(790.0, 590.0, 460.0, 320.0, &visible, 12.0);
        // Too close to the right edge → opens left of the cursor.
        assert!((x - (790.0 - 460.0 - 12.0)).abs() < 0.01);
        assert!(y >= 12.0);
        assert!(y + 320.0 <= 600.0 - 12.0 + 0.01);
    }

    #[test]
    fn cocoa_popup_stays_on_left_secondary() {
        // Внешний монитор слева от primary: Cocoa X отрицательный.
        let visible = LogicalBounds {
            x: -1920.0,
            y: 0.0,
            width: 1920.0,
            height: 1080.0,
        };
        let (x, y) = anchor_popup_cocoa(-800.0, 700.0, 460.0, 320.0, &visible, 12.0);
        assert!(x >= visible.x);
        assert!(x + 460.0 <= 0.0);
        assert!((x - (-800.0 + 12.0)).abs() < 0.01);
        assert!((y - (700.0 - 320.0 - 12.0)).abs() < 0.01);
    }

    #[test]
    fn cg_to_cocoa_keeps_cursor_on_primary() {
        let primary = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1512.0,
            height: 982.0,
        };
        // Центр primary. CG Y — от верхнего края.
        let (x, y) = cocoa_from_cg_flipped(756.0, 491.0, &primary);
        assert!((x - 756.0).abs() < 0.01);
        assert!((y - 491.0).abs() < 0.01);
        assert!(point_in_bounds(x, y, &primary));
    }

    #[test]
    fn pixels_high_unflip_teleports_cursor_to_monitor_above() {
        // Retina MacBook 1512×982 @2x: pixels_high = 1964, пункты = 982.
        // CGEventGetUnflippedLocation / tao делают y = pixels_high - cg_y.
        let primary = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1512.0,
            height: 982.0,
        };
        let above = LogicalBounds {
            x: 0.0,
            y: 982.0,
            width: 1920.0,
            height: 1080.0,
        };
        let cg_y = 491.0;
        let wrong_y = 1964.0 - cg_y;
        assert!(
            !point_in_bounds(756.0, wrong_y, &primary),
            "pixels_high unflip must leave the laptop screen"
        );
        assert!(
            point_in_bounds(756.0, wrong_y, &above),
            "and land on the monitor stacked above"
        );
        let (_, y) = cocoa_from_cg_flipped(756.0, cg_y, &primary);
        assert!(point_in_bounds(756.0, y, &primary));
    }

    #[test]
    fn cg_to_cocoa_keeps_cursor_on_right_secondary() {
        let primary = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1512.0,
            height: 982.0,
        };
        let secondary = LogicalBounds {
            x: 1512.0,
            y: 0.0,
            width: 1920.0,
            height: 1080.0,
        };
        // Cocoa (2000, 400) на втором мониторе → CG y = 982 - 400 = 582.
        let (x, y) = cocoa_from_cg_flipped(2000.0, 582.0, &primary);
        assert!(point_in_bounds(x, y, &secondary));
        assert!(!point_in_bounds(x, y, &primary));
    }

    #[test]
    fn pick_bounds_prefers_containing_screen_not_primary() {
        let primary = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        };
        let secondary = LogicalBounds {
            x: 1440.0,
            y: -180.0,
            width: 1920.0,
            height: 1080.0,
        };
        let picked = pick_bounds_for_point(2000.0, 200.0, &[primary, secondary]).unwrap();
        assert_eq!(picked, secondary);
    }

    #[test]
    fn pick_bounds_closest_when_outside_all_screens() {
        let primary = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        };
        let secondary = LogicalBounds {
            x: 1440.0,
            y: -540.0,
            width: 2560.0,
            height: 1440.0,
        };
        let picked = pick_bounds_for_point(2000.0, -600.0, &[primary, secondary]).unwrap();
        assert_eq!(picked, secondary);
    }

    #[test]
    fn stickers_do_not_overflow_short_monitor() {
        let short = LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 400.0,
        };
        let positions = sticker_stack_positions(3, 380.0, 150.0, 16.0, 24.0, &short);
        for (x, y) in positions {
            assert!(x >= 0.0);
            assert!(y >= 24.0);
            assert!(y + 150.0 <= short.height + 0.01);
        }
    }
}
