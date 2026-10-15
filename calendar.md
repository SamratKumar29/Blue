# Calendar View Implementation

## Overview

The Calendar view is implemented as a React function component in [`src/views/CalendarView.tsx`](src/views/CalendarView.tsx). The application shell mounts it when the shared `currentView` state is `calendar` in [`src/App.tsx`](src/App.tsx). When the view changes, the shell resets the main content scroll position to the top.

The view combines a live date heading, a navigable mini-month calendar, a Monday-to-Friday week strip, a featured strategy meeting banner, and a list of workspace events. It is currently a local demonstration view: event data is loaded from [`src/data/calendar.json`](src/data/calendar.json) through the Zustand store in [`src/store/useAppStore.ts`](src/store/useAppStore.ts). It does not fetch events from a calendar service or create, edit, or delete events.

## Component dependencies

`CalendarView.tsx` uses:

- React state and effects (`useState`, `useEffect`) for the current day, month, and selected date.
- React memoization (`useMemo`) for derived weekday and month-grid arrays.
- `useAppStore()` to read the event list and call `openSeniorRoutingModal()`.
- `motion.div` from `motion/react` for a small hover-scale effect on event cards.
- Lucide icons for the calendar heading, navigation arrows, meeting link, and senior-help action.
- Tailwind utility classes for responsive layout, spacing, borders, hover states, and light/dark theme styling.

## Date helper functions

The component defines small date helpers locally rather than using a calendar library:

- `startOfMonth(date)` returns the first day of the date's month.
- `daysInMonth(date)` returns the number of days in that month.
- `mondayOf(date)` finds the Monday in the same Monday-to-Sunday week as the given date, including when the date is Sunday.
- `addDays(date, amount)` returns a new date offset by a number of days.
- `isSameDay(a, b)` compares year, month, and day fields.
- `formatDate(date, options)` formats dates using the browser's locale via `toLocaleDateString`.

These helpers operate on local JavaScript `Date` values. `mondayOf` treats Monday as the start of the week.

## State and derived values

The view reads `calendar` and `openSeniorRoutingModal` from the application store. Its date-related state is local to the mounted component:

- `today` starts as the current system date. An effect schedules an update at the next local midnight and cleans up the previous timeout. After updating `today`, the effect schedules the next midnight refresh.
- `viewMonth` starts at the first day of the current month and controls the mini-month heading and grid.
- `selectedDate` starts as today and controls which date is selected and which weekdays appear in the week strip.
- `weekDays` is derived from `selectedDate`: it contains Monday through Friday of that date's week.
- `monthGrid` is derived from `viewMonth`: it contains leading blank cells before the first day, every day of that month, and trailing blanks until the cell count is a multiple of seven.
- `monthLabel` and `weekRangeLabel` are formatted strings derived from the displayed month and computed weekdays.

The mini-month uses a seven-column grid with Monday-first day headers. The week strip uses five columns for weekdays.

## Layout and rendering

The component renders these areas from top to bottom:

1. **Header**: Calendar title and the current local date, plus a **Schedule Senior Help** button.
2. **Date navigation**: A responsive two-column area. On larger screens, the mini-month occupies four of twelve grid columns and the weekday strip occupies eight; on smaller screens they stack.
3. **Featured meeting**: A static strategy discussion banner with time, attendee/context text, and a **Join Meet** external link to Google Meet.
4. **Workspace event list**: A responsive event-card grid. The heading includes the total number of items in the store's calendar array.

Event cards display each event's title, date, start/end times, location, description, and attendee names. Events marked `isSeniorDiscussion` receive a blue-tinted treatment and a **Senior Support** label. `motion.div` scales a card slightly on hover, but cards are not buttons and do not have click handlers.

## Click interactions

- **Previous month** and **Next month** update `viewMonth` by one month. These controls change the mini-month display only.
- **Today** sets `viewMonth` to the current month and `selectedDate` to the current date.
- Clicking a date in the mini-month sets `selectedDate` to that day and moves `viewMonth` to that date's month. This also recalculates the weekday strip.
- The week strip's left and right arrows move `selectedDate` to the previous or next Monday-to-Friday week. Because `viewMonth` is not changed by these arrows, the mini-month display can remain on a different month from the selected week.
- Clicking a weekday button selects that date. It does not change `viewMonth`.
- **Schedule Senior Help** opens the shared senior-routing modal. With no task passed, the store chooses a task from its current task list for the routing flow.
- **Join Meet** opens `https://meet.google.com` in a new tab with `rel="noopener noreferrer"`.

## Event data shape and current limits

Each record in `calendar.json` includes an ID, title, start and end times, date/day labels, attendee array, location, description, and `isSeniorDiscussion` flag. The store imports this JSON as its initial calendar state.

The selected date currently affects only date navigation. It does **not** filter the workspace event list, select an event, or update the static strategy meeting banner. The event cards are informational, and there are no controls for adding or changing calendar events. The small event dots in the mini-calendar are also currently rendered with zero opacity, so they are not visible.

## Styling and accessibility notes

Tailwind classes provide responsive layout and light/dark colors. Selected dates, today, and hovered dates receive different visual treatments. The calendar navigation buttons currently use icon-only controls without explicit `aria-label` attributes, so screen-reader names may be insufficient; adding accessible labels would improve the control semantics.

## Source files

- [`src/views/CalendarView.tsx`](src/views/CalendarView.tsx): Date calculations, local state, layout, controls, and rendering.
- [`src/data/calendar.json`](src/data/calendar.json): Seed calendar events.
- [`src/store/useAppStore.ts`](src/store/useAppStore.ts): Calendar data exposure and senior-routing modal action.
- [`src/App.tsx`](src/App.tsx): Active-view selection and scroll reset when changing views.
