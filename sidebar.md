# Sidebar Features and Behavior

## Purpose

The sidebar is the app's persistent left-hand navigation and utility rail. It gives access to the primary workspace views, the morning roundup, appearance and settings controls, keyboard help, and the user's profile/privacy settings. The rail is rendered by `src/components/Sidebar.tsx` and is mounted for the full application shell in `src/App.tsx`.

## Layout and visual behavior

- Fixed full-viewport-height vertical rail with a dark navy background and a right divider.
- Width is 88 px by default and 94 px at the `xl` breakpoint.
- Contains four vertical areas: mascot/roundup, primary navigation, quick utilities, and profile footer.
- Uses Lucide icons for navigation and utility buttons, plus the animated `ChibiMascot` component.
- Active navigation item receives a darker blue background, blue icon, and animated left-edge indicator. Hover styles brighten inactive items and slightly scale their icons.
- Buttons have `title` text; utility buttons also have accessible labels. The rail is styled for both light and dark app themes.
- The component does not define a mobile-collapsed or hidden state; it stays in the app shell at its configured width.

## Primary navigation

The navigation items are defined in `Sidebar.tsx` and correspond directly to the `ViewType` union in `src/store/useAppStore.ts`:

| Item | View | Icon | Behavior |
| --- | --- | --- | --- |
| Home | `home` | Home | Shows the home dashboard. |
| Tasks | `tasks` | CheckSquare | Shows the task list and task actions. |
| Team | `team` | Users | Shows team and senior availability. |
| Calendar | `calendar` | Calendar | Shows the calendar view. |
| Files | `files` | FolderLock | Shows files and related context. |
| Apps | `apps` | Layers | Shows connected apps and permission boundaries. |
| Outbox | `outbox` | Send | Shows queued/simulated outgoing messages. |

Clicking an item calls `setCurrentView(item.id)` in the Zustand store. `App.tsx` uses `currentView` to render the matching view in the main content area and resets the main content's scroll position when the view changes.

The item type supports an optional numeric badge, but no current navigation item supplies a badge value, so no badge is displayed by default.

## Sidebar tabs and click interactions

Clicking a primary navigation tab calls `setCurrentView` with that tab's view ID. The active styling updates, the corresponding view renders in the main area, and `App.tsx` scrolls the main content back to the top. The interactions available after opening each tab are listed below. Controls described as informational do not respond to clicks.

### Home

Clicking **Home** opens the dashboard.

- **View Full Roundup** opens the Morning Roundup modal. Its close button dismisses it; **Let's make it a great day!** closes it and navigates to Tasks.
- **4-Step Plan Preview** opens the permission-plan modal.
- **Today's Priorities** shows up to four task rows. **View all** navigates to Tasks. **Add a priority task** reveals a title field; **Add** creates an Easy wins task for the Atlas Web App, and **Cancel** hides the form.
- In each task row, the checkbox toggles completion and the **Why?** control expands or collapses the prioritization explanation. The explanation's group buttons move the task to Easy wins, Next up, or Needs senior. An incomplete Needs senior task may have **Ask Senior**, which opens senior routing for that task.
- **Keep it up!** opens the Check-in modal.
- **Team Updates > View all** navigates to Team. The message, email, and calendar summary rows themselves are display-only.
- **Quick Actions**: **Ask Blue** and **Write** open the permission-plan modal; **Summarize** and **More** open Morning Roundup; **Find Help** opens senior routing; **Create Task** reveals the priority-task form.
- Clicking the large dashboard mascot toggles its mood between happy and excited.
- The first four entries in **Your Team at a Glance** are display-only. Clicking **Need help with something?** opens senior routing.

### Tasks

Clicking **Tasks** opens **Task Priorities & Triage**.

- **Add Task** opens or hides the creation form. Enter a title, project, and group, then **Save Task** to add it; an empty title is ignored. **Cancel** hides the form without creating a task.
- The **All Tasks**, **Easy wins**, **Next up**, and **Needs senior** filter buttons show matching tasks and their counts. Search filters by task title or project.
- Each task checkbox toggles completion. **Why?** expands or collapses the explanation, which may include source, confidence, reason, and blocker. Its group buttons move the task to a different group; the current group is disabled.
- An incomplete task in Needs senior can show **Ask Senior**, which opens the senior-routing modal for that task. The displayed due time and priority badge are informational, not controls.

### Team

Clicking **Team** opens **Team Directory & Senior Expertise**.

- Department buttons filter members by All, Design, Product Team, Platform, Engineering, or Infrastructure.
- Search filters by member name, role, or expertise.
- **Ask a Senior** opens senior routing for that member; it is not shown for the current user. Member cards, status indicators, expertise tags, and timezone text are otherwise display-only.
- The “Zero Surveillance · Support Only” label is informational.

### Calendar

Clicking **Calendar** opens **Calendar & Focus Blocks**.

- The mini-calendar's previous/next arrows change the displayed month. **Today** returns the month and selected date to today.
- Clicking a mini-calendar date selects it and displays its Monday-to-Friday week in the week strip. The week-strip arrows shift the selected week by one week, and clicking a weekday selects that date.
- **Schedule Senior Help** opens senior routing.
- **Join Meet** opens Google Meet in a new browser tab.
- Workspace event cards and their date, time, location, description, attendees, and Senior Support label are informational; they have no click action.

### Files

Clicking **Files** opens **Approved Files & Knowledge Base**.

- Search filters documents by filename or category.
- Clicking a document opens its preview with category, title, summary, path, size, and read-only/memory-isolation information. The preview's X or **Close Document** dismisses it.
- Documents are read-only; there are no edit or upload actions.

### Apps

Clicking **Apps** opens **Connected Apps & Permission Boundaries**.

- **Configure Connectors** opens Settings on the Connectors tab.
- App cards show category, description, status, privacy level, and last-sync value. The cards are informational and have no individual click action.

### Outbox

Clicking **Outbox** opens **Approved Outbox (Simulation Sandbox)**.

- The view lists simulated outgoing messages with recipient, channel, timestamp, approval hash, status, and content. Message entries are display-only; there are no send, edit, or delete controls.
- If there are no entries, an empty-state message appears. The page is a local demo sandbox; messages are not dispatched over a real network.

## Mascot and morning roundup

- The top button renders Blue using `Mascot` at 52 px, with a happy mood and animation enabled.
- Clicking the mascot opens the Morning Roundup modal via `openMorningRoundupModal`.
- A small sparkle badge reinforces the roundup action; the tooltip says “Blue: Your Work Buddy (Click for Morning Roundup)”.
- The mascot is decorative within the button; the button itself owns the click action.
- In the roundup modal, the primary action closes the modal and navigates to Tasks. The modal also has a close button; its four wellbeing/productivity pillars are informational.

## Quick utilities

### Keyboard shortcuts

Opens the keyboard-shortcuts modal by setting `isKeyboardShortcutsOpen` to true. The modal lists workspace navigation and global actions, including `H`, `T`, `M`, `C`, `F`, `A`, `B`, `D`, `S`, `R`, `?`, and Escape. The sidebar's tooltip advertises `?` as the keyboard-help shortcut.

### Theme toggle

Calls `toggleTheme` in the store. The store switches between `light` and `dark`, adds or removes the `dark` class on the document root, and updates the displayed icon: Moon while currently light, Sun while currently dark. The tooltip names the mode that will be switched to, and the global `D` shortcut performs the same action.

### Settings

Opens Settings on the `General` tab using `openSettings('General')`. The Settings modal provides further tabs for Privacy & Data, AI Model, Connectors, Notifications, Work Hours, Appearance, and About. The global `S` shortcut opens General settings as well.

## Profile footer

- Displays a profile image, a green online-status dot, the first word of `settings.name`, and a role label.
- Clicking the profile button opens General settings, whose settings tabs include privacy controls.
- The displayed name is data-driven (`settings.name.split(' ')[0]`). The subtitle is currently hardcoded as “Designer”, and the avatar URL and green online indicator are also static. They are presentation details, not live account/presence data.

## State and interactions

The sidebar reads and updates shared Zustand state from `useAppStore`:

- `currentView` / `setCurrentView` control selected navigation and main-view routing.
- `theme` / `toggleTheme` control the theme icon and document theme class.
- `settings` supplies the profile first name.
- `openSettings` selects the Settings tab and opens its modal.
- `openMorningRoundupModal` opens the roundup flow.
- `setKeyboardShortcutsOpen` opens the shortcut reference.

The selected view, theme, and modal state are app-level state; the sidebar itself does not persist them or own separate navigation state.

## Keyboard navigation context

The global keyboard handler is implemented in `src/App.tsx`, not in the sidebar. It maps `H` to Home, `T` to Tasks, `M` to Team, `C` to Calendar, `F` to Files, `A` to Apps, `D` to theme, `S` to Settings, and `R` to Morning Roundup. `B` toggles the separate floating Side Bubble, `P` opens permissions, and `?` opens keyboard help. The handler avoids most shortcuts while an input, textarea, or editable element has focus.

The shortcut reference lists Outbox navigation only as a sidebar item; no dedicated Outbox letter shortcut is currently defined. The shortcut modal also advertises Command/Ctrl+K for the command palette; that is outside the sidebar component's own handlers.

## Inferred product intent

The implementation suggests the sidebar is intended to keep frequent navigation and personal controls always available without consuming much horizontal space. Its grouping gives the mascot/roundup a prominent entry point, separates workspace navigation from utilities, and makes profile/settings controls available at the bottom. The active indicator and tooltips help orient users in a compact icon-led rail.

## Potential follow-up work

These are opportunities inferred from the current implementation, not behaviors that exist today:

- Replace the static profile role, avatar, and online indicator with user/presence-backed values or remove them if presence is not modeled.
- Add a narrow-screen strategy if the rail should collapse, become a drawer, or otherwise adapt on mobile.
- Populate navigation badges only when there is a defined data source and badge meaning.
- Consider adding `aria-current="page"` to the active navigation button and a visible focus style to every utility/profile button for more consistent keyboard accessibility.
- Confirm that the app's global shortcut list and behavior remain synchronized as navigation items evolve.

## Source files

- `src/components/Sidebar.tsx`: sidebar markup, nav items, button handlers, icons, and styling.
- `src/store/useAppStore.ts`: view/theme/settings and modal state/actions.
- `src/App.tsx`: shell placement, active-view rendering, and global keyboard shortcuts.
- `src/components/ChibiMascot.tsx`: mascot animation and visual states.
- `src/components/modals/KeyboardShortcutsModal.tsx`: shortcut reference UI.
- `src/components/modals/SettingsModal.tsx`: settings tabs and modal content.
