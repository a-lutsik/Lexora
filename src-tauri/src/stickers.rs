// ============================================================
// LEXORA — Desktop Stickers
// Маленькие always-on-top окна со словами для повторения.
// Количество/прозрачность/тихие часы — из настроек пользователя.
// Позиция: правый край work area монитора под курсором (multi-monitor).
// ============================================================

use crate::commands::study::StudyQueueFilters;
use crate::commands::vocabulary::VocabularyEntryDto;
use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::sticker_window::{StickerWindowRect, StickerWindowRepo};
use crate::db::DbPool;
use crate::display::{point_in_bounds, sticker_stack_positions, LogicalBounds};
use crate::error::AppError;
use crate::srs::queue::QueueBuilder;
use chrono::{Local, Timelike};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;
use tauri::{
    AppHandle, Emitter, LogicalPosition, Manager, PhysicalPosition, State, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

const STICKER_WIDTH: f64 = 380.0;
const STICKER_HEIGHT: f64 = 150.0;
/// Вертикальный шаг между стикерами и отступ от краёв монитора.
const STICKER_GAP: f64 = 16.0;
const STICKER_MARGIN: f64 = 24.0;
const MAX_STICKERS: i64 = 3;
const MAX_STICKER_SLOTS: usize = MAX_STICKERS as usize;
/// Очередь стикеров длиннее числа окон: после dismiss слот берёт новое
/// свободное слово, не залезая на карточки соседей.
const STICKER_QUEUE_LIMIT: i64 = 50;
/// На сколько закрытое/отложенное/оценённое слово уходит со стикеров.
const STICKER_DISMISS_COOLDOWN_SECS: i64 = 10 * 60;
/// Пауза после последнего перемещения окна перед записью позиции в БД:
/// перетаскивание шлёт Moved на каждый кадр.
const RECT_SAVE_DELAY_MS: u64 = 500;
/// Как часто сверять тихие часы, пока приложение запущено.
const QUIET_HOURS_POLL_SECS: u64 = 30;
/// Фронтенд показывает окно только если для слота есть карточка.
const STICKER_SYNC_VISIBILITY_EVENT: &str = "stickers://sync-visibility";
/// Фильтр стикеров (источники или изучаемый язык) изменился — окна перечитывают
/// настройки и карточку.
pub const STICKER_FILTER_CHANGED_EVENT: &str = "stickers://filter-changed";
/// Токены `settings.sticker_sources` (см. src/lib/stickerSources.ts).
const STICKER_SOURCE_ALL: &str = "all";
const STICKER_SOURCE_MINE: &str = "mine";
const STICKER_SOURCE_COLLECTION_PREFIX: &str = "c:";

/// In-process owner of which vocabulary entry each sticker window shows.
/// Frontend event sync raced and let closed words jump onto the next card.
pub struct StickerRoster {
    assignments: [Option<i64>; MAX_STICKER_SLOTS],
    had_card: [bool; MAX_STICKER_SLOTS],
    /// entry_id → unix-секунды, до которых слово не показывается ни на одном стикере.
    dismissed: HashMap<i64, i64>,
    filter_key: Option<String>,
}

impl Default for StickerRoster {
    fn default() -> Self {
        Self {
            assignments: [None; MAX_STICKER_SLOTS],
            had_card: [false; MAX_STICKER_SLOTS],
            dismissed: HashMap::new(),
            filter_key: None,
        }
    }
}

impl StickerRoster {
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    pub fn release_from(&mut self, from_slot: usize) {
        for slot in from_slot..MAX_STICKER_SLOTS {
            self.assignments[slot] = None;
            self.had_card[slot] = false;
        }
    }

    fn ensure_filter(&mut self, key: String) {
        if self.filter_key.as_ref() != Some(&key) {
            self.reset();
            self.filter_key = Some(key);
        }
    }

    /// Истёкшие dismiss снова допускают слово на стикеры.
    fn expire_dismissed(&mut self, now: i64) {
        self.dismissed.retain(|_, until| now < *until);
    }

    fn claimed_except(&self, slot: usize) -> HashSet<i64> {
        self.assignments
            .iter()
            .enumerate()
            .filter(|(index, id)| *index != slot && id.is_some())
            .filter_map(|(_, id)| *id)
            .collect()
    }

    /// Карточки на позициях очереди, которые ждут ещё не получившие карточку слоты.
    fn reserved_except(&self, slot: usize, queue_ids: &[i64]) -> HashSet<i64> {
        (0..MAX_STICKER_SLOTS)
            .filter(|&other| other != slot && !self.had_card[other])
            .filter_map(|other| queue_ids.get(other).copied())
            .collect()
    }

    fn free_ids(&self, slot: usize, queue_ids: &[i64]) -> Vec<i64> {
        let claimed = self.claimed_except(slot);
        queue_ids
            .iter()
            .copied()
            .filter(|id| !self.dismissed.contains_key(id) && !claimed.contains(id))
            .collect()
    }

    fn current_if_valid(&self, slot: usize, queue_ids: &[i64]) -> Option<i64> {
        let current = self.assignments.get(slot).copied().flatten()?;
        let claimed = self.claimed_except(slot);
        if queue_ids.contains(&current)
            && !self.dismissed.contains_key(&current)
            && !claimed.contains(&current)
        {
            Some(current)
        } else {
            None
        }
    }

    /// Keep this slot's card, or assign a unique one that no other slot owns.
    /// `now` — unix-секунды, по ним истекает dismiss.
    pub fn card_for_slot(&mut self, slot: usize, queue_ids: &[i64], now: i64) -> Option<i64> {
        if slot >= MAX_STICKER_SLOTS {
            return None;
        }
        self.expire_dismissed(now);
        if let Some(current) = self.current_if_valid(slot, queue_ids) {
            self.assignments[slot] = Some(current);
            self.had_card[slot] = true;
            return Some(current);
        }
        self.assignments[slot] = None;

        let free = self.free_ids(slot, queue_ids);
        let next = if self.had_card[slot] {
            free.first().copied()
        } else {
            // Первая карточка слота — его позиция в очереди. Если её уже занял
            // сосед (например, после dismiss), берём свободную, не отнимая
            // позиции у слотов, которые ещё не получили карточку.
            queue_ids
                .get(slot)
                .copied()
                .filter(|id| free.contains(id))
                .or_else(|| {
                    let reserved = self.reserved_except(slot, queue_ids);
                    free.iter().copied().find(|id| !reserved.contains(id))
                })
        };
        self.assignments[slot] = next;
        if next.is_some() {
            self.had_card[slot] = true;
        }
        next
    }

    /// Retire this word from every sticker for a cooldown and give *this* slot
    /// a new unique card. После cooldown отложенное слово возвращается, а
    /// оценённое — когда SRS снова поставит его в очередь.
    pub fn dismiss(
        &mut self,
        slot: usize,
        entry_id: i64,
        queue_ids: &[i64],
        now: i64,
    ) -> Option<i64> {
        if slot >= MAX_STICKER_SLOTS {
            return None;
        }
        self.dismissed
            .insert(entry_id, now.saturating_add(STICKER_DISMISS_COOLDOWN_SECS));
        if self.assignments[slot] == Some(entry_id) {
            self.assignments[slot] = None;
        }
        self.had_card[slot] = true;
        self.card_for_slot(slot, queue_ids, now)
    }
}

/// Состояние окон стикеров, которым владеет бэкенд.
#[derive(Default)]
pub struct StickerWindows {
    /// Хоткей/трей скрыли стикеры. Пока флаг стоит, фронтенд не может показать
    /// окно сам (обновление карточки, backfill перевода) — только следующий toggle.
    user_hidden: AtomicBool,
    /// Где окна стоят или стояли перед закрытием (тихие часы, меньше стикеров,
    /// перезапуск), чтобы пересозданное окно вернулось туда, куда его перетащил
    /// пользователь. Прямоугольники в физических пикселях; копия — в БД (V026).
    last_rects: Mutex<[Option<LogicalBounds>; MAX_STICKER_SLOTS]>,
    /// Поколение отложенной записи позиций: пишет только последний запрос.
    save_generation: AtomicU64,
}

impl StickerWindows {
    fn set_user_hidden(&self, hidden: bool) {
        self.user_hidden.store(hidden, Ordering::Relaxed);
    }

    fn may_show(&self) -> bool {
        !self.user_hidden.load(Ordering::Relaxed)
    }

    fn remember_rect(&self, slot: usize, rect: LogicalBounds) {
        if let Ok(mut rects) = self.last_rects.lock() {
            if let Some(saved) = rects.get_mut(slot) {
                *saved = Some(rect);
            }
        }
    }

    fn last_rect(&self, slot: usize) -> Option<LogicalBounds> {
        self.last_rects.lock().ok()?.get(slot).copied().flatten()
    }

    /// Строки для БД из всех известных позиций.
    fn rect_rows(&self) -> Vec<StickerWindowRect> {
        let Ok(rects) = self.last_rects.lock() else {
            return Vec::new();
        };
        rects
            .iter()
            .enumerate()
            .filter_map(|(slot, rect)| rect.map(|rect| rect_to_row(slot, &rect)))
            .collect()
    }

    /// Загрузить позиции из БД; строки с чужими слотами пропускаются.
    fn restore_rows(&self, rows: &[StickerWindowRect]) {
        for row in rows {
            if let Some(slot) = usize::try_from(row.slot)
                .ok()
                .filter(|&slot| slot < MAX_STICKER_SLOTS)
            {
                self.remember_rect(slot, row_to_rect(row));
            }
        }
    }
}

fn rect_to_row(slot: usize, rect: &LogicalBounds) -> StickerWindowRect {
    StickerWindowRect {
        // slot < MAX_STICKER_SLOTS, в i64 помещается всегда.
        slot: i64::try_from(slot).unwrap_or(i64::MAX),
        x: rect.x.round() as i32,
        y: rect.y.round() as i32,
        width: rect.width.max(0.0).round() as u32,
        height: rect.height.max(0.0).round() as u32,
    }
}

fn row_to_rect(row: &StickerWindowRect) -> LogicalBounds {
    LogicalBounds::from_physical(row.x, row.y, row.width, row.height, 1.0)
}

/// Перед созданием окон: вернуть позиции, сохранённые в прошлом запуске.
pub fn restore_window_rects(app: &AppHandle) {
    let Some(windows) = app.try_state::<StickerWindows>() else {
        return;
    };
    let pool = app.state::<Arc<DbPool>>();
    let rows = pool
        .get()
        .map_err(AppError::from)
        .and_then(|conn| StickerWindowRepo::list(&conn));
    match rows {
        Ok(rows) => windows.restore_rows(&rows),
        Err(e) => log::warn!("Failed to load sticker window positions: {e}"),
    }
}

/// Пользователь перетащил стикер: запомнить позицию и сохранить её в БД.
pub fn on_window_event(window: &tauri::Window, event: &WindowEvent) {
    if !matches!(event, WindowEvent::Moved(_)) {
        return;
    }
    let Some(slot) = sticker_slot_from_label(window.label()) else {
        return;
    };
    let (Ok(position), Ok(size)) = (window.outer_position(), window.outer_size()) else {
        return;
    };
    let app = window.app_handle();
    if let Some(windows) = app.try_state::<StickerWindows>() {
        windows.remember_rect(
            slot,
            LogicalBounds::from_physical(position.x, position.y, size.width, size.height, 1.0),
        );
    }
    schedule_rect_save(app);
}

/// Отложенная запись позиций: перетаскивание шлёт Moved на каждый кадр,
/// в БД попадает только позиция после паузы.
fn schedule_rect_save(app: &AppHandle) {
    let Some(windows) = app.try_state::<StickerWindows>() else {
        return;
    };
    let generation = windows.save_generation.fetch_add(1, Ordering::Relaxed) + 1;
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(RECT_SAVE_DELAY_MS)).await;
        let Some(windows) = app.try_state::<StickerWindows>() else {
            return;
        };
        if windows.save_generation.load(Ordering::Relaxed) != generation {
            return;
        }
        let rows = windows.rect_rows();
        let pool = app.state::<Arc<DbPool>>().inner().clone();
        let saved = run_blocking(move || {
            let conn = pool.get()?;
            StickerWindowRepo::save_all(&conn, &rows)
        })
        .await;
        if let Err(e) = saved {
            log::warn!("Failed to save sticker window positions: {e}");
        }
    });
}

/// Окно считается видимым, если его центр лежит на одном из мониторов.
/// Иначе (монитор отключили) стикер остался бы за пределами экранов.
fn rect_on_screens(rect: &LogicalBounds, screens: &[LogicalBounds]) -> bool {
    let center_x = rect.x + rect.width / 2.0;
    let center_y = rect.y + rect.height / 2.0;
    screens
        .iter()
        .any(|screen| point_in_bounds(center_x, center_y, screen))
}

/// Границы подключённых мониторов в физических пикселях.
fn physical_screens(app: &AppHandle) -> Vec<LogicalBounds> {
    app.available_monitors()
        .map(|monitors| {
            monitors
                .iter()
                .map(|monitor| {
                    let position = monitor.position();
                    let size = monitor.size();
                    LogicalBounds::from_physical(position.x, position.y, size.width, size.height, 1.0)
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Внешний прямоугольник окна в физических пикселях.
fn physical_rect(window: &WebviewWindow) -> Option<LogicalBounds> {
    let position = window.outer_position().ok()?;
    let size = window.outer_size().ok()?;
    Some(LogicalBounds::from_physical(
        position.x,
        position.y,
        size.width,
        size.height,
        1.0,
    ))
}

fn may_show_stickers(app: &AppHandle) -> bool {
    app.try_state::<StickerWindows>()
        .is_none_or(|windows| windows.may_show())
}

fn set_stickers_user_hidden(app: &AppHandle, hidden: bool) {
    if let Some(windows) = app.try_state::<StickerWindows>() {
        windows.set_user_hidden(hidden);
    }
}

/// Закрыть окно слота, запомнив, где оно стояло.
fn close_sticker_window(app: &AppHandle, slot: usize, window: &WebviewWindow) -> Result<(), AppError> {
    if let (Some(windows), Some(rect)) = (app.try_state::<StickerWindows>(), physical_rect(window)) {
        windows.remember_rect(slot, rect);
        schedule_rect_save(app);
    }
    window.close()?;
    Ok(())
}

/// Фильтр очереди стикеров строится только из настроек: все окна получают один
/// и тот же фильтр, и окно с устаревшими настройками не сбрасывает ростер.
fn sticker_queue_filters(sources: &[String], language_id: i64) -> StudyQueueFilters {
    let restrict = !sources.iter().any(|s| s == STICKER_SOURCE_ALL);
    let (include_mine, collection_ids) = if restrict {
        let collection_ids = sources
            .iter()
            .filter_map(|token| token.strip_prefix(STICKER_SOURCE_COLLECTION_PREFIX))
            .filter(|id| !id.is_empty() && id.bytes().all(|b| b.is_ascii_digit()))
            .filter_map(|id| id.parse().ok())
            .collect();
        (
            Some(sources.iter().any(|s| s == STICKER_SOURCE_MINE)),
            collection_ids,
        )
    } else {
        (None, Vec::new())
    };
    let category_ids = if restrict {
        sources.iter().filter_map(|token| token.strip_prefix("cat:"))
            .filter(|id| !id.is_empty() && id.bytes().all(|b| b.is_ascii_digit()))
            .filter_map(|id| id.parse::<i64>().ok()).filter(|id| *id > 0).collect()
    } else { Vec::new() };
    StudyQueueFilters {
        category_ids,
        collocations_only: false,
        language_id,
        limit: STICKER_QUEUE_LIMIT,
        include_new: true,
        include_mature_refresh: true,
        include_mine,
        collection_ids,
    }
}

fn filter_fingerprint(filters: &StudyQueueFilters) -> String {
    let mut cols = filters.collection_ids.clone();
    cols.sort_unstable();
    let mut categories = filters.category_ids.clone();
    categories.sort_unstable();
    format!(
        "{}|{:?}|{:?}|{:?}|{}",
        filters.language_id, filters.include_mine, cols, categories, filters.include_new
    )
}

fn sticker_slot_from_label(label: &str) -> Option<usize> {
    let rest = label.strip_prefix("sticker-")?;
    let slot: usize = rest.parse().ok()?;
    (slot < MAX_STICKER_SLOTS).then_some(slot)
}

fn slot_from_window(window: &WebviewWindow) -> Result<usize, AppError> {
    sticker_slot_from_label(window.label()).ok_or_else(|| {
        AppError::Validation("Sticker card commands are only valid for sticker windows".into())
    })
}

fn lock_roster(roster: &Mutex<StickerRoster>) -> Result<MutexGuard<'_, StickerRoster>, AppError> {
    roster
        .lock()
        .map_err(|_| AppError::Io("Sticker roster lock poisoned".into()))
}

/// Shared roster for sticker windows. Created in lib.rs setup.
pub fn new_roster_state() -> Arc<Mutex<StickerRoster>> {
    Arc::new(Mutex::new(StickerRoster::default()))
}

/// Shared window state for sticker windows. Created in lib.rs setup.
pub fn new_windows_state() -> StickerWindows {
    StickerWindows::default()
}

pub fn reset_roster(app: &AppHandle) {
    if let Some(roster) = app.try_state::<Arc<Mutex<StickerRoster>>>() {
        if let Ok(mut guard) = roster.lock() {
            guard.reset();
        }
    }
}

fn release_unused_slots(app: &AppHandle, count: usize) {
    if let Some(roster) = app.try_state::<Arc<Mutex<StickerRoster>>>() {
        if let Ok(mut guard) = roster.lock() {
            guard.release_from(count);
        }
    }
}

fn sticker_label(index: i64) -> String {
    format!("sticker-{index}")
}

/// Парсинг 'HH:MM' в минуты от полуночи.
pub(crate) fn parse_hhmm(s: &str) -> Option<u32> {
    let mut parts = s.split(':');
    let hours: u32 = parts.next()?.parse().ok()?;
    let minutes: u32 = parts.next()?.parse().ok()?;
    if hours > 23 || minutes > 59 || parts.next().is_some() {
        return None;
    }
    Some(hours * 60 + minutes)
}

/// Валидация пары тихих часов: оба None, либо оба валидных HH:MM.
pub fn validate_quiet_hours(start: Option<&str>, end: Option<&str>) -> Result<(), AppError> {
    match (start, end) {
        (None, None) => Ok(()),
        (Some(start), Some(end)) => {
            if parse_hhmm(start).is_none() || parse_hhmm(end).is_none() {
                return Err(AppError::Validation(
                    "Quiet hours must be HH:MM (00:00–23:59)".into(),
                ));
            }
            Ok(())
        }
        _ => Err(AppError::Validation(
            "Both quiet hours start and end are required".into(),
        )),
    }
}

/// Сейчас тихие часы? `current` — минуты от полуночи. Диапазон может
/// пересекать полночь (22:00–07:00).
pub(crate) fn is_quiet_hours_at(
    start: Option<&str>,
    end: Option<&str>,
    current_minutes: u32,
) -> bool {
    let (Some(start), Some(end)) = (start, end) else {
        return false;
    };
    let (Some(start), Some(end)) = (parse_hhmm(start), parse_hhmm(end)) else {
        return false;
    };

    if start <= end {
        current_minutes >= start && current_minutes < end
    } else {
        current_minutes >= start || current_minutes < end
    }
}

fn minutes_now() -> u32 {
    let now = Local::now();
    now.hour() * 60 + now.minute()
}

fn is_quiet_hours(start: Option<&str>, end: Option<&str>) -> bool {
    is_quiet_hours_at(start, end, minutes_now())
}

fn load_settings(app: &AppHandle) -> Result<crate::commands::settings::AppSettings, AppError> {
    let pool = app.state::<Arc<DbPool>>();
    let conn = pool.get()?;
    SettingsRepo::get(&conn)
}

fn close_all_stickers(app: &AppHandle) -> Result<(), AppError> {
    for i in 0..MAX_STICKERS {
        if let Some(window) = app.get_webview_window(&sticker_label(i)) {
            close_sticker_window(app, i as usize, &window)?;
        }
    }
    Ok(())
}

fn hide_all_stickers(app: &AppHandle) -> Result<(), AppError> {
    for i in 0..MAX_STICKERS {
        if let Some(window) = app.get_webview_window(&sticker_label(i)) {
            window.hide()?;
        }
    }
    Ok(())
}

fn target_monitor(app: &AppHandle) -> Option<tauri::Monitor> {
    if let Ok(cursor) = app.cursor_position() {
        if let Ok(Some(monitor)) = app.monitor_from_point(cursor.x, cursor.y) {
            return Some(monitor);
        }
    }
    app.primary_monitor().ok().flatten()
}

fn sticker_bounds(app: &AppHandle) -> LogicalBounds {
    match target_monitor(app) {
        Some(monitor) => LogicalBounds::from_monitor(&monitor),
        None => LogicalBounds {
            x: 0.0,
            y: 0.0,
            width: 1440.0,
            height: 900.0,
        },
    }
}

/// Создать / подогнать окна стикеров по настройкам.
/// В тихие часы существующие окна закрываются, новые не создаются.
pub fn apply_sticker_policy(app: &AppHandle) -> Result<(), AppError> {
    let settings = load_settings(app)?;

    if is_quiet_hours(
        settings.quiet_hours_start.as_deref(),
        settings.quiet_hours_end.as_deref(),
    ) {
        log::info!("Quiet hours active — stickers closed");
        close_all_stickers(app)?;
        return Ok(());
    }

    let count = settings.sticker_count.clamp(1, MAX_STICKERS);
    release_unused_slots(app, count as usize);
    // NOTE: sticker_opacity применяется на фронтенде через CSS —
    // в Tauri 2 нет window.set_opacity(). Настройка доступна через get_settings.

    let bounds = sticker_bounds(app);
    let positions = sticker_stack_positions(
        count as u32,
        STICKER_WIDTH,
        STICKER_HEIGHT,
        STICKER_GAP,
        STICKER_MARGIN,
        &bounds,
    );

    let screens = physical_screens(app);
    for i in 0..count {
        let label = sticker_label(i);
        let stack_position = positions.get(i as usize).copied();
        if let Some(window) = app.get_webview_window(&label) {
            // Уже есть — позицию не трогаем (пользователь мог перетащить окно),
            // кроме случая, когда его монитор отключили и окно за экранами.
            let off_screen = !screens.is_empty()
                && physical_rect(&window).is_some_and(|rect| !rect_on_screens(&rect, &screens));
            if let (true, Some((x, y))) = (off_screen, stack_position) {
                window.set_position(LogicalPosition::new(x, y))?;
            }
            continue;
        }

        let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("sticker.html".into()))
            .title(crate::i18n::text(app, "Lexora Sticker"))
            .inner_size(STICKER_WIDTH, STICKER_HEIGHT)
            .decorations(false)
            .transparent(true)
            .resizable(false)
            .always_on_top(false)
            .skip_taskbar(true)
            .visible(false)
            .focused(false)
            .visible_on_all_workspaces(true)
            .build()?;

        let saved_rect = app
            .try_state::<StickerWindows>()
            .and_then(|windows| windows.last_rect(i as usize))
            .filter(|rect| rect_on_screens(rect, &screens));
        if let Some(rect) = saved_rect {
            window.set_position(PhysicalPosition::new(rect.x.round() as i32, rect.y.round() as i32))?;
        } else if let Some((x, y)) = stack_position {
            window.set_position(LogicalPosition::new(x, y))?;
        }
        configure_sticker_overlay(&window)?;
        apply_sticker_pin(&window, false)?;
        // Окно остаётся скрытым: фронтенд покажет его, только если есть карточка.
    }

    for i in count..MAX_STICKERS {
        if let Some(window) = app.get_webview_window(&sticker_label(i)) {
            close_sticker_window(app, i as usize, &window)?;
        }
    }

    Ok(())
}

/// Создать окна стикеров по настройкам. В тихие часы — закрыть, не создавать.
pub fn spawn_stickers(app: &AppHandle) -> Result<(), AppError> {
    apply_sticker_policy(app)
}

/// Фоновая сверка тихих часов: скрыть стикеры в начале диапазона и
/// вернуть их, когда диапазон закончится, без перезапуска приложения.
pub fn start_quiet_hours_watcher(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(QUIET_HOURS_POLL_SECS));
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        // Первый tick() срабатывает сразу — skip, spawn_stickers уже вызван из setup.
        interval.tick().await;
        loop {
            interval.tick().await;
            if let Err(e) = apply_sticker_policy(&app) {
                log::warn!("Failed to apply sticker quiet-hours policy: {e}");
            }
        }
    });
}

/// Переключить видимость стикеров: видимые → скрыть, иначе показать
/// только слоты с карточками (или создать, если ни одного окна нет).
/// В тихие часы хоткей не показывает стикеры.
pub fn toggle_stickers_inner(app: &AppHandle) -> Result<(), AppError> {
    let settings = load_settings(app)?;
    if is_quiet_hours(
        settings.quiet_hours_start.as_deref(),
        settings.quiet_hours_end.as_deref(),
    ) {
        close_all_stickers(app)?;
        log::info!("Quiet hours active — sticker toggle ignored");
        return Ok(());
    }

    let mut any_visible = false;
    let mut any_exists = false;

    for i in 0..MAX_STICKERS {
        if let Some(window) = app.get_webview_window(&sticker_label(i)) {
            any_exists = true;
            if window.is_visible()? {
                any_visible = true;
            }
        }
    }

    if any_visible {
        set_stickers_user_hidden(app, true);
        hide_all_stickers(app)?;
    } else {
        set_stickers_user_hidden(app, false);
        if any_exists {
            let _ = app.emit(STICKER_SYNC_VISIBILITY_EVENT, ());
        } else {
            spawn_stickers(app)?;
        }
    }

    Ok(())
}

/// Показать стикер без активации приложения: карточка поверх других окон,
/// главное окно Lexora не выходит на передний план.
pub fn show_sticker_overlay(window: &tauri::WebviewWindow) -> Result<(), AppError> {
    if !window.label().starts_with("sticker-") {
        return Err(AppError::Validation(
            "show_sticker_window is only valid for sticker windows".into(),
        ));
    }
    if !may_show_stickers(window.app_handle()) {
        // Пользователь скрыл стикеры хоткеем/треем — не возвращаем их сами.
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        let window = window.clone();
        let overlay = window.clone();
        window
            .run_on_main_thread(move || {
                if let Err(e) = macos::show_without_activating(&overlay) {
                    log::warn!("Failed to show sticker overlay: {e}");
                }
            })
            .map_err(|e| AppError::Io(e.to_string()))?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        window.show()?;
        Ok(())
    }
}

fn configure_sticker_overlay(window: &tauri::WebviewWindow) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        let window = window.clone();
        let overlay = window.clone();
        window
            .run_on_main_thread(move || {
                if let Err(e) = macos::configure_as_overlay(&overlay) {
                    log::warn!("Failed to configure sticker overlay: {e}");
                }
            })
            .map_err(|e| AppError::Io(e.to_string()))?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = window;
        Ok(())
    }
}

fn resolve_sticker_card(
    app: &AppHandle,
    db: &Arc<DbPool>,
    roster: &Mutex<StickerRoster>,
    slot: usize,
    dismiss_id: Option<i64>,
) -> Result<Option<VocabularyEntryDto>, AppError> {
    let conn = db.get()?;
    let settings = SettingsRepo::get(&conn)?;
    let language_id =
        crate::db::repos::lexeme::LexemeRepo::language_id_by_code(&conn, &settings.primary_language)?;
    let filters = sticker_queue_filters(&settings.sticker_sources, language_id);
    let key = filter_fingerprint(&filters);
    let ids = QueueBuilder::build_queue_ids(&conn, &filters)?;
    let assigned = {
        let now = chrono::Utc::now().timestamp();
        let mut roster = lock_roster(roster)?;
        roster.ensure_filter(key);
        match dismiss_id {
            Some(entry_id) => roster.dismiss(slot, entry_id, &ids, now),
            None => roster.card_for_slot(slot, &ids, now),
        }
    };
    // Полная запись нужна только для карточки этого слота.
    let entry = assigned
        .map(|id| crate::commands::vocabulary::get_vocabulary_entry_by_id(&conn, id))
        .transpose()?;
    drop(conn);
    if let Some(ref entry) = entry {
        request_missing_translation(app, db, entry);
    }
    Ok(entry)
}

/// A sticker without a gloss shows the same `••••••` as a hidden one. Ask the
/// provider again instead of leaving the card mute forever.
fn request_missing_translation(app: &AppHandle, db: &Arc<DbPool>, entry: &VocabularyEntryDto) {
    if !entry.translations.is_empty() {
        return;
    }
    let source_language = db.get().ok().and_then(|conn| {
        crate::db::repos::lexeme::LexemeRepo::language_code_by_id(&conn, entry.lexeme.language_id)
            .ok()
    });
    let Some(source_language) = source_language else {
        return;
    };
    crate::commands::translate::spawn_translation_backfill(
        app.clone(),
        db.clone(),
        entry.lexeme.id,
        entry.lexeme.text.clone(),
        source_language,
    );
}

// ── IPC Commands ─────────────────────────────────────────────

#[tauri::command]
pub fn toggle_stickers(app: AppHandle) -> Result<(), AppError> {
    toggle_stickers_inner(&app)
}

#[tauri::command]
pub async fn get_sticker_card(
    window: WebviewWindow,
    db: State<'_, Arc<DbPool>>,
    roster: State<'_, Arc<Mutex<StickerRoster>>>,
) -> Result<Option<VocabularyEntryDto>, AppError> {
    let slot = slot_from_window(&window)?;
    let app = window.app_handle().clone();
    let db = db.inner().clone();
    let roster = roster.inner().clone();
    run_blocking(move || resolve_sticker_card(&app, &db, &roster, slot, None)).await
}

#[tauri::command]
pub async fn dismiss_sticker_card(
    entry_id: i64,
    window: WebviewWindow,
    db: State<'_, Arc<DbPool>>,
    roster: State<'_, Arc<Mutex<StickerRoster>>>,
) -> Result<Option<VocabularyEntryDto>, AppError> {
    let slot = slot_from_window(&window)?;
    let app = window.app_handle().clone();
    let db = db.inner().clone();
    let roster = roster.inner().clone();
    run_blocking(move || resolve_sticker_card(&app, &db, &roster, slot, Some(entry_id))).await
}

/// rusqlite блокирует поток: не занимаем им воркеры async-рантайма.
async fn run_blocking<T, F>(task: F) -> Result<T, AppError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, AppError> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| AppError::Io(format!("Sticker task failed: {e}")))?
}

#[tauri::command]
pub fn show_sticker_window(window: tauri::WebviewWindow) -> Result<(), AppError> {
    show_sticker_overlay(&window)
}

#[tauri::command]
pub fn set_sticker_pinned(window: tauri::WebviewWindow, pinned: bool) -> Result<(), AppError> {
    if !window.label().starts_with("sticker-") {
        return Err(AppError::Validation(
            "set_sticker_pinned is only valid for sticker windows".into(),
        ));
    }
    apply_sticker_pin(&window, pinned)
}

fn apply_sticker_pin(window: &tauri::WebviewWindow, pinned: bool) -> Result<(), AppError> {
    window.set_always_on_top(pinned)?;

    #[cfg(target_os = "macos")]
    {
        let window = window.clone();
        let overlay = window.clone();
        window
            .run_on_main_thread(move || {
                if let Err(e) = macos::apply_pin_level(&overlay, pinned) {
                    log::warn!("Failed to apply sticker pin level: {e}");
                }
            })
            .map_err(|e| AppError::Io(e.to_string()))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW: i64 = 1_700_000_000;

    fn rect(x: f64, y: f64, width: f64, height: f64) -> LogicalBounds {
        LogicalBounds {
            x,
            y,
            width,
            height,
        }
    }

    fn sources(tokens: &[&str]) -> Vec<String> {
        tokens.iter().map(|token| token.to_string()).collect()
    }

    #[test]
    fn sticker_filters_without_restriction_take_every_word() {
        for tokens in [&["all"][..], &["all", "c:3"]] {
            let filters = sticker_queue_filters(&sources(tokens), 2);
            assert_eq!(filters.include_mine, None, "{tokens:?}");
            assert!(filters.collection_ids.is_empty(), "{tokens:?}");
            assert_eq!(filters.language_id, 2);
            assert_eq!(filters.limit, STICKER_QUEUE_LIMIT);
            assert!(filters.include_new && filters.include_mature_refresh);
        }
    }

    #[test]
    fn sticker_categories_do_not_enable_all_user_words() {
        let filters = sticker_queue_filters(&sources(&["cat:2", "cat:5", "c:9"]), 1);
        assert_eq!(filters.include_mine, Some(false));
        assert_eq!(filters.category_ids, vec![2, 5]);
        assert_eq!(filters.collection_ids, vec![9]);
        let empty = sticker_queue_filters(&[], 1);
        assert_eq!(empty.include_mine, Some(false));
        assert!(empty.category_ids.is_empty() && empty.collection_ids.is_empty());
        assert_ne!(filter_fingerprint(&filters), filter_fingerprint(&empty));
    }

    #[test]
    fn sticker_filters_restrict_to_selected_sources() {
        let filters = sticker_queue_filters(&sources(&["mine", "c:3", "c:12"]), 1);
        assert_eq!(filters.include_mine, Some(true));
        assert_eq!(filters.collection_ids, vec![3, 12]);

        let filters = sticker_queue_filters(&sources(&["c:7", "c:", "c:x", "junk"]), 1);
        assert_eq!(filters.include_mine, Some(false));
        assert_eq!(filters.collection_ids, vec![7]);
    }

    #[test]
    fn sticker_filter_fingerprint_follows_settings_not_windows() {
        let en = filter_fingerprint(&sticker_queue_filters(&sources(&["all"]), 1));
        let en_again = filter_fingerprint(&sticker_queue_filters(&sources(&["all"]), 1));
        let ru = filter_fingerprint(&sticker_queue_filters(&sources(&["all"]), 2));
        assert_eq!(en, en_again);
        assert_ne!(en, ru);
    }

    #[test]
    fn user_hidden_stickers_cannot_be_shown_until_revealed() {
        let windows = StickerWindows::default();
        assert!(windows.may_show());
        windows.set_user_hidden(true);
        assert!(!windows.may_show());
        windows.set_user_hidden(false);
        assert!(windows.may_show());
    }

    #[test]
    fn closed_window_rect_is_remembered_per_slot() {
        let windows = StickerWindows::default();
        assert_eq!(windows.last_rect(1), None);
        windows.remember_rect(1, rect(3000.0, 200.0, 760.0, 300.0));
        assert_eq!(windows.last_rect(1), Some(rect(3000.0, 200.0, 760.0, 300.0)));
        assert_eq!(windows.last_rect(0), None);
        windows.remember_rect(MAX_STICKER_SLOTS, rect(0.0, 0.0, 1.0, 1.0));
    }

    #[test]
    fn window_rects_round_trip_through_db_rows() {
        let windows = StickerWindows::default();
        windows.remember_rect(2, rect(-1200.4, 40.6, 760.0, 300.0));
        let rows = windows.rect_rows();
        assert_eq!(
            rows,
            vec![StickerWindowRect {
                slot: 2,
                x: -1200,
                y: 41,
                width: 760,
                height: 300,
            }]
        );

        let restored = StickerWindows::default();
        restored.restore_rows(&rows);
        assert_eq!(restored.last_rect(2), Some(rect(-1200.0, 41.0, 760.0, 300.0)));
        assert_eq!(restored.last_rect(0), None);
    }

    #[test]
    fn restore_skips_rows_for_unknown_slots() {
        let windows = StickerWindows::default();
        let row = |slot| StickerWindowRect {
            slot,
            x: 1,
            y: 2,
            width: 3,
            height: 4,
        };
        windows.restore_rows(&[row(-1), row(MAX_STICKER_SLOTS as i64), row(0)]);
        assert_eq!(windows.rect_rows(), vec![row(0)]);
    }

    #[test]
    fn rect_on_screens_uses_the_window_center() {
        let screens = [rect(0.0, 0.0, 1920.0, 1080.0), rect(1920.0, 0.0, 2560.0, 1440.0)];
        assert!(rect_on_screens(&rect(3000.0, 100.0, 760.0, 300.0), &screens));
        // Частично за левым краем, но центр на экране — окно оставляем.
        assert!(rect_on_screens(&rect(-200.0, 100.0, 760.0, 300.0), &screens));
        // Второй монитор отключили — окно целиком за экранами.
        assert!(!rect_on_screens(&rect(3000.0, 100.0, 760.0, 300.0), &screens[..1]));
    }

    #[test]
    fn parse_hhmm_accepts_valid_times() {
        assert_eq!(parse_hhmm("00:00"), Some(0));
        assert_eq!(parse_hhmm("22:00"), Some(22 * 60));
        assert_eq!(parse_hhmm("07:30"), Some(7 * 60 + 30));
        assert_eq!(parse_hhmm("23:59"), Some(23 * 60 + 59));
    }

    #[test]
    fn parse_hhmm_rejects_invalid() {
        assert_eq!(parse_hhmm(""), None);
        assert_eq!(parse_hhmm("25:00"), None);
        assert_eq!(parse_hhmm("12:60"), None);
        assert_eq!(parse_hhmm("ab:cd"), None);
        assert_eq!(parse_hhmm("22"), None);
        assert_eq!(parse_hhmm("22:00:00"), None);
        assert_eq!(parse_hhmm("9:00"), Some(9 * 60));
    }

    #[test]
    fn quiet_hours_same_day_range() {
        assert!(is_quiet_hours_at(Some("09:00"), Some("17:00"), 10 * 60));
        assert!(is_quiet_hours_at(Some("09:00"), Some("17:00"), 9 * 60));
        assert!(!is_quiet_hours_at(Some("09:00"), Some("17:00"), 17 * 60));
        assert!(!is_quiet_hours_at(
            Some("09:00"),
            Some("17:00"),
            8 * 60 + 59
        ));
    }

    #[test]
    fn quiet_hours_overnight_range() {
        assert!(is_quiet_hours_at(Some("22:00"), Some("07:00"), 23 * 60));
        assert!(is_quiet_hours_at(Some("22:00"), Some("07:00"), 22 * 60));
        assert!(is_quiet_hours_at(Some("22:00"), Some("07:00"), 6 * 60 + 59));
        assert!(!is_quiet_hours_at(Some("22:00"), Some("07:00"), 7 * 60));
        assert!(!is_quiet_hours_at(Some("22:00"), Some("07:00"), 12 * 60));
        assert!(!is_quiet_hours_at(
            Some("22:00"),
            Some("07:00"),
            21 * 60 + 59
        ));
    }

    #[test]
    fn quiet_hours_disabled_without_both_bounds() {
        assert!(!is_quiet_hours_at(None, None, 23 * 60));
        assert!(!is_quiet_hours_at(Some("22:00"), None, 23 * 60));
        assert!(!is_quiet_hours_at(None, Some("07:00"), 23 * 60));
        assert!(!is_quiet_hours_at(Some("xx:yy"), Some("07:00"), 23 * 60));
    }

    #[test]
    fn quiet_hours_equal_start_end_is_never_active() {
        assert!(!is_quiet_hours_at(Some("12:00"), Some("12:00"), 12 * 60));
        assert!(!is_quiet_hours_at(Some("12:00"), Some("12:00"), 0));
    }

    #[test]
    fn validate_quiet_hours_pairs() {
        assert!(validate_quiet_hours(None, None).is_ok());
        assert!(validate_quiet_hours(Some("22:00"), Some("07:00")).is_ok());
        assert!(validate_quiet_hours(Some("22:00"), None).is_err());
        assert!(validate_quiet_hours(None, Some("07:00")).is_err());
        assert!(validate_quiet_hours(Some("25:00"), Some("07:00")).is_err());
    }

    #[test]
    fn sticker_label_format() {
        assert_eq!(sticker_label(0), "sticker-0");
        assert_eq!(sticker_label(2), "sticker-2");
    }

    #[test]
    fn sticker_slot_from_label_reads_index() {
        assert_eq!(sticker_slot_from_label("sticker-0"), Some(0));
        assert_eq!(sticker_slot_from_label("sticker-2"), Some(2));
        assert_eq!(sticker_slot_from_label("sticker-3"), None);
        assert_eq!(sticker_slot_from_label("main"), None);
    }

    #[test]
    fn roster_gives_each_slot_its_own_card() {
        let mut roster = StickerRoster::default();
        let queue = [10, 20, 30, 40];
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
        assert_eq!(roster.card_for_slot(2, &queue, NOW), Some(30));
    }

    #[test]
    fn roster_keeps_a_slot_on_the_same_card() {
        let mut roster = StickerRoster::default();
        let queue = [10, 20, 30];
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
    }

    #[test]
    fn dismiss_does_not_move_the_word_onto_another_slot() {
        let mut roster = StickerRoster::default();
        let queue = [10, 20, 30, 40];
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));

        assert_eq!(roster.dismiss(0, 10, &queue, NOW), Some(30));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(30));
    }

    #[test]
    fn dismissed_word_is_never_reassigned_to_a_peer() {
        let mut roster = StickerRoster::default();
        let queue = [10, 20, 30];
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));

        assert_eq!(roster.dismiss(1, 20, &queue, NOW), Some(30));
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.dismiss(0, 10, &queue, NOW), None);
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(30));
    }

    #[test]
    fn extra_slot_stays_empty_instead_of_stealing() {
        let mut roster = StickerRoster::default();
        let queue = [10];
        assert_eq!(roster.card_for_slot(1, &queue, NOW), None);
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), None);
    }

    #[test]
    fn new_slot_takes_a_free_card_when_its_queue_position_is_taken() {
        let mut roster = StickerRoster::default();
        let queue = [10, 20, 30, 40];
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
        assert_eq!(roster.dismiss(0, 10, &queue, NOW), Some(30));

        // Пользователь увеличил число стикеров: queue[2] уже занят слотом 0.
        assert_eq!(roster.card_for_slot(2, &queue, NOW), Some(40));
    }

    #[test]
    fn dismissed_word_returns_after_cooldown() {
        let mut roster = StickerRoster::default();
        let queue = [10];
        assert_eq!(roster.card_for_slot(0, &queue, NOW), Some(10));
        assert_eq!(roster.dismiss(0, 10, &queue, NOW), None);

        let almost = NOW + STICKER_DISMISS_COOLDOWN_SECS - 1;
        assert_eq!(roster.card_for_slot(0, &queue, almost), None);
        let expired = NOW + STICKER_DISMISS_COOLDOWN_SECS;
        assert_eq!(roster.card_for_slot(0, &queue, expired), Some(10));
    }

    #[test]
    fn first_card_fallback_does_not_take_a_waiting_slot_position() {
        let mut roster = StickerRoster::default();
        assert_eq!(roster.card_for_slot(0, &[10, 30, 20, 40], NOW), Some(10));
        assert_eq!(roster.dismiss(0, 10, &[10, 30, 20, 40], NOW), Some(30));

        // Порядок очереди сменился: queue[2] = 30 занят слотом 0, а позиция
        // queue[1] = 20 ждёт слот 1, который ещё не запрашивал карточку.
        let queue = [10, 20, 30, 40];
        assert_eq!(roster.card_for_slot(2, &queue, NOW), Some(40));
        assert_eq!(roster.card_for_slot(1, &queue, NOW), Some(20));
    }

    #[test]
    fn filter_change_reassigns_from_the_new_queue() {
        let mut roster = StickerRoster::default();
        roster.ensure_filter("en".into());
        assert_eq!(roster.card_for_slot(0, &[10, 20], NOW), Some(10));
        roster.ensure_filter("ru".into());
        assert_eq!(roster.card_for_slot(0, &[50, 60], NOW), Some(50));
        assert_eq!(roster.card_for_slot(1, &[50, 60], NOW), Some(60));
    }
}

/// macOS: стикер — non-activating overlay. `WebviewWindow::show()` идёт через
/// `makeKeyAndOrderFront`, из-за чего NSApp активируется и главное окно
/// Lexora всплывает поверх текущей работы.
#[cfg(target_os = "macos")]
mod macos {
    use crate::error::AppError;
    use objc2::rc::Retained;
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSFloatingWindowLevel, NSNormalWindowLevel, NSWindow, NSWindowCollectionBehavior,
        NSWindowStyleMask,
    };
    use tauri::WebviewWindow;

    fn ns_window(window: &WebviewWindow) -> Result<Retained<NSWindow>, AppError> {
        let _mtm = MainThreadMarker::new().ok_or_else(|| {
            AppError::Io("Sticker overlay must be configured on the main thread".into())
        })?;
        let ptr = window.ns_window()? as *mut NSWindow;
        unsafe { Retained::retain(ptr) }
            .ok_or_else(|| AppError::Io("Sticker NSWindow handle is null".into()))
    }

    pub fn configure_as_overlay(window: &WebviewWindow) -> Result<(), AppError> {
        let ns_window = ns_window(window)?;
        let mut style = ns_window.styleMask();
        style.insert(NSWindowStyleMask::NonactivatingPanel);
        ns_window.setStyleMask(style);
        ns_window.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary
                | NSWindowCollectionBehavior::IgnoresCycle,
        );
        ns_window.setHidesOnDeactivate(false);
        ns_window.setCanHide(false);
        ns_window.setLevel(NSNormalWindowLevel);
        Ok(())
    }

    pub fn apply_pin_level(window: &WebviewWindow, pinned: bool) -> Result<(), AppError> {
        let ns_window = ns_window(window)?;
        ns_window.setLevel(if pinned {
            NSFloatingWindowLevel
        } else {
            NSNormalWindowLevel
        });
        Ok(())
    }

    pub fn show_without_activating(window: &WebviewWindow) -> Result<(), AppError> {
        configure_as_overlay(window)?;
        ns_window(window)?.orderFrontRegardless();
        Ok(())
    }
}
