# iCloud MCP
This file contains instructions on how to use the iCloud MCP tool.

## Tool Reference (functional details)

### `list_calendars() -> List[Calendar]`

Returns:

- `name: str | null`
- `url: str` (preferred identifier for other calls)
- `id: str | null`

### `list_calendars_with_events(start, end, expand_recurring=True) -> List[Calendar]`

Returns only the calendars that contain **at least one event** in the
given time window.

**Args**

- `start, end: str` — ISO datetimes; search is [**start**, **end**)
- `expand_recurring: bool` — treat recurring series as concrete instances

Each returned calendar has the same shape as `list_calendars()`.

### `list_events(calendar_name_or_url, start, end, expand_recurring=True) -> List[Event]`

**Args**

- `calendar_name_or_url: str` — display name or full CalDAV URL
- `start, end: str` — ISO datetimes; search is [**start**, **end**)
- `expand_recurring: bool` — include concrete instances of recurring series

**Returns** each event with:

- `uid: str`
- `summary: str`
- `start: str` (ISO)
- `end: str | null` (ISO)
- `raw: str` (original ICS text)

### `create_event(calendar_name_or_url, summary, start, end, tzid?, description?, location?, recurrence?) -> str`

Creates a minimal **VEVENT**.

- `tzid` defaults to `TZID` env if omitted; naive datetimes are assumed in that zone and stored as UTC.
- `description` is optional; omit or pass `null` to skip it.
- `location` is optional; omit or pass `null` to skip it.
- `recurrence` (optional) describes how the event should repeat, for example:

    ```jsonc
    {
        "frequency": "weekly",              // daily | weekly | monthly | yearly | custom
        "interval": 1,                       // optional, default 1
        "by_weekday": ["MO", "WE"],         // optional; for weekly/custom
        "by_monthday": [1, 15],             // optional; for monthly/custom
        "end": {                            // optional end condition
            "type": "on_date",              // or "after_occurrences"
            "date": "2025-12-31"            // when type == "on_date"
            // or: "count": 10               // when type == "after_occurrences"
        }
        // for custom frequency you can pass a raw RRULE:
        // "frequency": "custom",
        // "rrule": "FREQ=MONTHLY;BYDAY=MO,TU;BYSETPOS=1"
    }
    ```

- Returns the generated `uid` (random hex + `@chatgpt-mcp`).

### `update_event(calendar_name_or_url, uid, summary?, start?, end?, tzid?, description?, location?, recurrence?, clear_recurrence=False) -> bool`

Updates the **whole** event identified by `uid` (for recurring events this updates the series VEVENT, not a single instance).

- Preserves any omitted fields from the original component.
- `location`:
  - If omitted (`null` / not provided), keeps the existing location.
  - If provided as a non-empty string, updates the event’s location.
  - If provided as an empty string, clears the event’s location.
- `recurrence`:
  - If provided, replaces any existing RRULE using the same shape as in `create_event`.
- `clear_recurrence`:
  - If `True`, removes any RRULE and converts the event back to a single non-recurring instance.
  - If `True` and `recurrence` is also provided, `clear_recurrence` wins (no recurrence).
- Returns `True` on success, `False` if `uid` not found in ±3-year window.

### `delete_event(calendar_name_or_url, uid) -> bool`

Deletes the first matching `uid` in a ±3-year window.

- Returns `True` if deleted, `False` if not found.

**Date/Time Notes**

- Accepts naive or `Z`/offset datetimes (`YYYY-MM-DDTHH:MM:SS`, optionally `Z` or `-04:00` etc.)
- New/edited events emit `DTSTART;TZID=...` and `DTEND;TZID=...` using provided `tzid` or `TZID` env
- Updates attempt to reuse the original TZID when present
- `LOCATION` is emitted when `location` is provided and non-empty; passing an empty string when updating an event removes the existing location.

---

## Deep Research read-only mode

Set DR_PROFILE=1 to run a read-only tool set for Deep Research. This exposes only:

- search(query) -> [{ id, title, snippet }]
- fetch(ids) -> [{ id, mimeType: 'text/calendar', content }]

Example:

```bash
DR_PROFILE=1 HOST=127.0.0.1 PORT=8000 python server.py
```

Notes:

- Write tools (list_events/create_event/update_event/delete_event) are disabled in this mode.
- SCAN_DAYS controls the search window around “now” (default: 1095 days ≈ 3 years).
- Keep this service private or add auth