# Icon Consolidation — one shared `packages/ui/icons` package

Date: 2026-08-27
Status: Design — not yet built.

## Problem

`apps/web` (and, to a smaller extent, `apps/admin`) picks icons straight from `react-icons` at every call site. There are 154 files and 233 import lines pulling from 20 different `react-icons` subpackages (`md`, `hi`, `hi2`, `lu`, `fa`, `fa6`, `ri`, `go`, `pi`, `bs`, `io`, `io5`, `ai`, `bi`, `fi`, `gr`, `lia`, `rx`, `si`, `tb`).

Because nothing centralizes the choice, the same idea gets drawn with a different glyph depending on who touched that file last. "Close" is drawn 4 different ways. "Chevron pointing right" is drawn 6 different ways. "A comment happened" is drawn 6 different ways. One bug slipped in from this: `HiOutlineTrash` is imported from two different `react-icons` subpackages (legacy `hi` and current `hi2`) under the identical name in different files — same name in code, two different glyphs on screen, and nobody would notice from reading the import line.

There are also three files of hand-drawn custom icons (`components/icons/StatusIcons.tsx`, `PriorityIcons.tsx`, `AnimatedIcons.tsx`) that live in `apps/web` today with no guardrail stopping someone from adding a fourth.

## Goal

One new package, `packages/ui`, with an `icons/` folder. Every icon apps/web and apps/admin need — react-icons-backed or hand-drawn — is exported from there under one clean, unambiguous name. `react-icons` is removed as a direct dependency of both apps; it becomes an internal dependency of `packages/ui` only. A lint rule then makes it impossible to add a stray icon import back into either app.

## Package layout

```
packages/ui/
  package.json          "@trydarwin/ui", exports: { "./icons": "./icons/index.ts" }
  tsconfig.json          mirrors packages/editorial's (moduleResolution: bundler, jsx: react-jsx, noEmit: true)
  icons/
    index.ts             flat barrel — every icon re-exported by name, this is the only import path consumers use
    createIcon.tsx        the shared factory every plain icon is built from (see below)
    IconTooltip.tsx        the Tooltip primitive createIcon() uses internally
    actions/               CloseIcon, CheckIcon, AddIcon, DeleteIcon, EditIcon, CopyIcon, ...
    navigation/             chevrons, carets, breadcrumb separator, submenu disclosure, search
    status/                 kanban statuses, priority, toast/verdict/tone icons, warning/info/error/success
    people/                 assignee, creator, team, tag
    communication/          comment, chat nav, emoji, bell, send
    git/                    github logo, pull request states, merge
    settings-access/        settings, lock/access, api key
    misc/                   spinner, external link, upload, question/help, refresh
    custom/                 StatusIcons.tsx (Done/Failed), PriorityIcons.tsx (High/Medium/Low), AnimatedIcons.tsx (marketing)
    catalog.ts              the ~215-icon bulk picker list (unrelated to the naming work above, see "Bulk picker catalog")
```

This follows `packages/editorial`'s conventions exactly (it's the closest existing template — a React-component package with a flat `index.ts` barrel, `private: true`, peer deps on `react`/`next`/`typescript`, `tsc --noEmit` as its typecheck script). `radix-ui` and `motion` join `react-icons` as dependencies scoped to this package.

Every individual icon file is a one-liner:

```ts
// packages/ui/icons/actions/CloseIcon.tsx
import { MdClose } from "react-icons/md";
import { createIcon } from "../createIcon";

export const CloseIcon = createIcon(MdClose);
```

One file per icon, matching the "smaller unit, one clear purpose" rule the rest of this codebase already follows — the file tells you at a glance which `react-icons` glyph backs a given name, without needing to open the barrel.

## Component shape: `createIcon` and the tooltip

Every exported icon takes the same props `react-icons`' `IconType` already accepts (`size`, `color`, `className`, `title`, `style`, ...) — those pass straight through, nothing new to learn. On top of that, every icon can optionally take `children`, which becomes tooltip content shown on hover. No children, no tooltip — the icon behaves exactly as bare `react-icons` does today.

```tsx
<CloseIcon className="size-4" />                 // bare, no tooltip
<CloseIcon className="size-4">Close</CloseIcon>   // hover shows "Close"
```

This is built once, in `createIcon.tsx`, and every one of the ~180 plain icon files is `createIcon(SomeGlyph)` — the tooltip logic is never duplicated per icon:

```tsx
export function createIcon(Glyph: IconType) {
  return function Icon({ children, ...props }: IconProps) {
    if (!children) return <Glyph {...props} />;
    return (
      <Tooltip>
        <TooltipTrigger asChild><Glyph {...props} /></TooltipTrigger>
        <TooltipContent>{children}</TooltipContent>
      </Tooltip>
    );
  };
}
```

`Tooltip`/`TooltipTrigger`/`TooltipContent` are a small primitive that lives in `packages/ui/icons/IconTooltip.tsx`, built on the `radix-ui` package (already a shared dependency of both `apps/web` and `apps/admin`, same version) and styled with the same Tailwind classes the app's existing `components/ui/tooltip.tsx` uses (`bg-graphite`, rounded, arrow) — those classes resolve against `packages/theme/theme.css`, which both apps already load, so the look matches exactly without `packages/ui` depending on either app. `packages/ui` cannot import from `apps/web` (dependency direction only flows the other way), so this is a small second copy of the same visual recipe, not a shared import — a deliberate, contained duplication, not an accident.

This is additive to, not a replacement for, the app's existing `TooltipComponent`/`InfoTooltip` — those wrap arbitrary children (buttons, rows, text) for tooltip needs unrelated to a bare icon. The two coexist.

Custom hand-drawn icons (`DoneStatusIcon`, `PriorityIcons`, the animated marketing icons) move in as-is — they already type their `className` prop off `IconBaseProps`, so they're compatible with being called the same way, but they are not built through `createIcon` (they're not thin wraps of a `react-icons` glyph, and the animated ones have their own hover-driven variants that don't compose with a hover tooltip in the same way). They keep their own prop shape.

## Naming convention

PascalCase, `Icon` suffix, named for what the icon **means**, never for which library or which glyph it happens to be today: `CloseIcon`, not `MdClose`; `ChevronRightIcon`... except see below — several of what looked like one "chevron-right" concept turned out to be 3-4 different concepts wearing the same-looking glyph, so they get 3-4 different, disambiguated names instead of one shared one. Precision beats a single tidy name.

Every one of the 233 current import lines gets a name under this rule. The ~30 clusters where multiple different glyphs are used for one idea are resolved explicitly below — that's the risky part, since a wrong pick here doesn't error at compile time, it just silently ships a slightly-off icon. The remaining ~200 non-conflicting single-glyph icons (an icon only ever drawn one way today) get a name derived the same way, mechanically, during implementation — verified by the codemod's generated mapping being reviewed before it's applied, and by `bun run typecheck` catching any import that doesn't exist.

## Scope

- **Both `apps/web` and `apps/admin`.** `apps/admin` has 3 files (`input-otp.tsx`, `button.tsx`, `select.tsx` — shadcn primitives copy-pasted from `apps/web`) importing `react-icons` directly; those migrate too, and `react-icons` comes out of `apps/admin/package.json` as well.
- **The bulk icon-picker catalog** (`apps/web/data/icons_bulk.ts`, ~215 `Pi*Fill` icons used to let a user pick a project's icon/avatar) moves into `packages/ui/icons/catalog.ts`, unchanged in shape. It is not part of the naming/conflict work above — it's meant to offer many distinct choices, not to express one concept — but it moves so that `apps/web` ends up with zero remaining `react-icons` imports of any kind.
- **The animated marketing icons** (`PeopleIcon`, `NoteIcon`, `ChecklistIcon`, `BriefcaseIcon` in `AnimatedIcons.tsx`, used only in the landing nav dropdown) move in too, renamed `MarketingPeopleIcon`, `MarketingNoteIcon`, `MarketingChecklistIcon`, `MarketingBriefcaseIcon` — the plain prefix avoids clashing with the unrelated, functional `AssigneeGroupIcon`/`TeamEntityIcon` names decided below, since "People" on its own would otherwise mean two different things in the same barrel.
- **Marketing/landing decorative icon clusters** (e.g. `BoardShowcase.tsx`'s self-contained Bootstrap-icon family, `HeroBoardMock.tsx`'s Lucide nav mock) still move into `packages/ui/icons` and still get real semantic names — no bare `react-icons` import may remain in either app — but they are not forced to merge onto the "real" app's canonical icon for the same concept when doing so would break a mock's internal visual cohesion. Each such case is called out at implementation time rather than silently forced.

## Guardrail

`packages/config-eslint`'s shared configs get a `no-restricted-imports` rule blocking `react-icons` and `react-icons/*` in both `apps/web` and `apps/admin`. This is what actually enforces "nobody hand-picks a new icon" going forward — after this migration, importing `react-icons` directly anywhere in either app fails lint.

## Canonical icon decisions

These are the ~30 clusters where the current code draws one idea with multiple different glyphs. Each was resolved by reading the real usage site, not just the import name — several turned out to be two or more genuinely different concepts that only look alike, and are kept separate on purpose (noted inline). Anything not listed here had only one glyph to begin with and gets a mechanical rename during implementation.

### Actions

| Canonical name | Source glyph | Folds in (migrates from) |
|---|---|---|
| `CloseIcon` | `MdClose` | `HiXMark`, `IoMdClose`, `FaXmark` |
| `CheckIcon` | `MdCheck` | `LuCheck`, `FaCheck`, `IoMdCheckmark` (button leading-icon usages) |
| `AddIcon` | `MdAdd` | `HiOutlinePlus`, `FaPlus`, `LuPlus` (marketing) |
| `DeleteIcon` | `MdDelete` | `HiOutlineTrash` (3 files — this also fixes the hi-v1/hi2 same-name bug), `LuTrash2` (3 files) |
| `EditIcon` | `MdEdit` | `LuPencil` (`activity.registry.tsx` TitleChanged) |
| `CopyIcon` | `MdContentCopy` | `LuCopy` (2 files) |
| `DuplicateIcon` | `LuCopyPlus` | — (not a conflict; "duplicate issue" is its own concept, kept apart from plain copy-to-clipboard) |
| `ComposeIssueIcon` | `IoPencilSharp` | — (kept separate from `EditIcon`: "create a new issue" vs. "edit an existing field", both happen to be pencil glyphs, already used consistently across all 3 real create-issue entry points) |
| `SettingsGeneralIcon` | `HiOutlinePencilSquare` | — (kept separate: this is `SettingsPanel.tsx`'s nav-row icon, part of a cohesive `HiOutline*` row family with its siblings, not a generic edit action) |
| `RevealSecretIcon` / `HideSecretIcon` | `MdVisibility` / `MdVisibilityOff` | `FaEye`/`FaEyeSlash` (`ProjectEnvStep.tsx`) |
| `ImportUploadIcon` | `MdUpload` | `FaFileArrowUp` (`ProjectEnvStep.tsx`) |
| `ExternalLinkIcon` | `LuExternalLink` | `LuSquareArrowOutUpRight` (`IssueDropdown.tsx`) |

### Navigation & disclosure

The "chevron/arrow forward" cluster is the worst offender in the raw inventory (6 different glyphs) — it turned out to be 4 unrelated concepts, not one:

| Canonical name | Source glyph | Meaning | Folds in |
|---|---|---|---|
| `CtaArrowIcon` | `MdChevronRight` | Trailing arrow on a marketing CTA ("Get started", "Continue") | `MdOutlineChevronRight`, `BsChevronRight` |
| `BreadcrumbSeparatorIcon` | `MdOutlineKeyboardArrowRight` | Static separator in "Avatar › New X" dialog headers and page breadcrumbs | `MdChevronRight` (only `PlaygroundBreadcrumb.tsx`'s usage, which was the odd one out against 6 other files) |
| `SubmenuDisclosureIcon` | `RxTriangleRight` | Static "opens a submenu to the side" marker on `*SubTrigger` | `MdKeyboardArrowRight` (`ProfileCard.tsx`, `PlaygroundUserMenu.tsx`) |
| `DropdownCaretIcon` / `DropdownCaretUpIcon` | `MdKeyboardArrowDown` / `MdKeyboardArrowUp` | Rotating/swapping open-state indicator on dropdowns, accordions, selects | `LuChevronDown` (3 dropdown-trigger sites, **not** the `DateTimePicker` stepper), `HiChevronDown`, `PiCaretDownBold`, `MdArrowRight` (the `rotate-90` pair in `HiddenKanbanColumn.tsx`/`IssueListGroupHeader.tsx`) |
| `StepperDecrementIcon` / `StepperIncrementIcon` | `LuChevronDown` / `LuChevronUp` | `DateTimePicker.tsx`'s numeric +/- stepper — kept apart from `DropdownCaretIcon` despite sharing a glyph today, since these are a different concept (decrement/increment, not disclosure) that shouldn't move in lockstep with dropdown carets in the future |

Flagged, not a pure rename: `FaCaretDown`/`FaCaretRight` (`ToggleNodeView.tsx`, `SidebarSection.tsx`) currently swap between two icons on state change rather than rotating one icon. Migrating these to `DropdownCaretIcon` needs a small logic change (swap → rotate), not just an import edit — call this out explicitly in the implementation plan so it isn't silently batched with the mechanical renames.

| Canonical name | Source glyph | Meaning | Folds in |
|---|---|---|---|
| `SearchIcon` | `MdSearch` | Leading icon inside an already-open text input | `HiOutlineMagnifyingGlass` (3 embedded-input usages) |
| `SearchToggleIcon` | `LuSearch` | Clickable button that opens/expands a search field | `HiOutlineMagnifyingGlass` (`ChatConversationSidebar.tsx`'s toggle-button usage) |

### Status (kanban, priority, toast/verdict)

`KanbanBoard.COLUMNS`:

| Status | Canonical name | Source |
|---|---|---|
| Todo | `TodoStatusIcon` | `LuCircle` |
| Queued | `QueuedStatusIcon` | `LuCircleDashed` |
| In Progress | `InProgressStatusIcon` | `RiProgress4Line` |
| In Review | `InReviewStatusIcon` | `LuCircleDotDashed` |
| Done | `DoneStatusIcon` | custom (`StatusIcons.tsx`, moved as-is) |
| Failed | `FailedStatusIcon` | custom (`StatusIcons.tsx`, moved as-is) |
| Cancelled | `CancelledStatusIcon` | `AiFillStop` |
| Off-board fallback | `OffBoardStatusIcon` | `LuCirclePause` |

Three more names share `LuCircleDashed`'s glyph on purpose, kept apart from `QueuedStatusIcon` even though they render identically today: `UnknownStatusIcon` (the fallback in `IssueCardFace.tsx`/`IssueReferenceCard.tsx` for when an issue's status doesn't match any column — only a fallback, not a "Queued" statement) and `StatusChangedActivityIcon` (the activity-feed glyph for a generic status-change log entry in `activity.registry.tsx`). Splitting these now means a future change to one doesn't silently drag the other two along.

`PRIORITY_OPTIONS`:

| Priority | Canonical name | Source |
|---|---|---|
| None | `NoPriorityIcon` | `LuEllipsis` |
| Urgent | `UrgentPriorityIcon` | `BsExclamationSquareFill` |
| High | `HighPriorityIcon` | custom (`PriorityIcons.tsx`, moved as-is) |
| Medium | `MediumPriorityIcon` | custom (`PriorityIcons.tsx`, moved as-is) |
| Low | `LowPriorityIcon` | custom (`PriorityIcons.tsx`, moved as-is) |

Toast / merge-panel / PR-verdict — these are internally-consistent, filled-weight icon sets tied to one colored badge each; they are **not** folded into the generic outline versions of the same idea used elsewhere, on purpose:

| Canonical name | Source | Where |
|---|---|---|
| `ToastDefaultIcon` / `ToastWarningIcon` | `HiBell` / `HiExclamationTriangle` (filled) | `Toast.tsx`'s `STATUS_CONFIG`, stays filled |
| `StatusInfoIcon` | `HiInformationCircle` | `Toast.tsx` + `ReviewMergePanel.tsx`'s `TONE_STYLE.checking` (already consistent) |
| `MergeToneWarningIcon` | `HiExclamationTriangle` (filled) | `ReviewMergePanel.tsx`'s `TONE_STYLE.attention` badge |
| `ReviewVerdictApprovedIcon` / `ReviewVerdictRejectedIcon` / `ReviewVerdictCommentIcon` | `GoCheck` / `GoXCircle` / `GoComment` | `ReviewCommentCard.tsx`'s `REVIEW_VERDICT` — a matched Octicon trio, kept intact rather than folding any one member into the generic check/error/comment icons |

Generic (non-badge) versions of the same warning/error/success/info/bell family, used elsewhere as plain feature icons:

| Canonical name | Source | Folds in |
|---|---|---|
| `WarningTriangleIcon` | `HiOutlineExclamationTriangle` | `HiExclamationTriangle` (`DiffReviewDisplay.tsx` — filled today, changes to outline) |
| `SuccessCircleIcon` | `HiCheckCircle` | `FaCircleCheck`, `MdCheckCircle` |
| `ErrorCircleIcon` | `HiXCircle` | `FaCircleXmark`, `LuCircleX` |
| `NotificationsBellIcon` | `HiOutlineBell` | — (already consistent across 5 files) |
| `InlineHintIcon` | `LuInfo` | — (kept separate from `StatusInfoIcon`: a small 10px inline reading-aid next to plain text, not a status badge) |
| `HelpIcon` | `HiOutlineQuestionMarkCircle` | `HiQuestionMarkCircle` (`DiffFrame.tsx` — filled today, changes to outline) |

### People & organization

| Canonical name | Source | Meaning | Folds in |
|---|---|---|---|
| `AssigneeGroupIcon` | `LuUsers` | "Assign to" / multi-value assignee facet | — (already consistent) + `MdPeople` (`MembersCapsule.tsx`, functionally the same "members of this issue" concept) |
| `CreatorIcon` | `LuUser` | Singular "who created this" facet | — (kept separate — creator is single-valued, assignee is multi-valued, and the codebase already draws this distinction deliberately in `filterFacets.ts`) |
| `TeamEntityIcon` | `HiOutlineUserGroup` | "Team" as an org entity | `MdGroup` (`TeamDisplay.tsx`) |
| `TagIcon` | `HiOutlineTag` | A tag/label, in every context (capsule, filter facet, nav, activity feed) | `MdLabel`, `LuTag`, `IoMdPricetags` |

### Communication

| Canonical name | Source | Meaning | Folds in |
|---|---|---|---|
| `CommentCountIcon` | `MdChat` | Inline "N comments" count badge / empty chat-thread state | `BiChat` (`ReviewSummary.tsx`), `HiOutlineChatBubbleLeftRight` (`notificationView.ts`'s `IssueCommented` theme) |
| `ChatsNavIcon` | `HiOutlineChatBubbleLeftRight` (from `hi2`) | "Chats" section nav/discovery icon | `HiOutlineAnnotation` (legacy `hi` v1, no direct `hi2` equivalent — this reuses the glyph freed up by `CommentCountIcon`'s migration above, so no new visual is introduced while still killing the legacy-package import) |
| `EmojiReactionIcon` | `HiOutlineFaceSmile` | Add-a-reaction trigger in chat/comments | — (kept separate from the picker below — different affordance) |
| `ProjectAvatarPickerIcon` | `PiSmileyFill` | Pick a project's emoji avatar | — (kept separate) |
| `SendIcon` | `RiSendPlane2Fill` | Submit a composer (chat message, PR review comment) | `RiTelegram2Line` (`ChatComposer.tsx` — the Telegram-branded glyph was a thematic mismatch for a non-Telegram product). `IoSendSharp` (`ReviewComposer.tsx`) is a dead, unrendered import — delete it, don't migrate it. |

### Git & integrations

| Canonical name | Source | Folds in |
|---|---|---|
| `GithubLogoIcon` | `FaGithub` | `RiGithubFill`, `LiaGithub` |
| `PullRequestOpenIcon` | `GoGitPullRequest` | `FaCodePullRequest`, `LuGitPullRequest` |
| `PullRequestClosedIcon` | `GoGitPullRequestClosed` | — (already consistent, naming only) |
| `MergeIcon` | `GoGitMerge` | `AiFillMerge` |
| `PrivateRepoIcon` | `FaLock` | — (kept separate from `AccessRestrictedIcon` below — this marks a GitHub repo's own visibility, paired with `GithubLogoIcon` in the same row, a different concept from an app permission) |

### Settings & access

| Canonical name | Source | Folds in |
|---|---|---|
| `SettingsIcon` | `HiOutlineCog6Tooth` | `MdSettings`, `LuSettings` (all 3 real entry points navigate to the exact same destination today, split across 2 different glyphs) |
| `AccessRestrictedIcon` | `HiOutlineLockClosed` | `MdLock` (`SettingsDisplay.tsx`) |
| `ApiKeyIcon` | `MdKey` | — (kept separate — a literal API-key credential) |
| `EnvSecretIcon` | `MdVpnKey` | `HiOutlineKey`'s usage in `SettingsPanel.tsx`'s nav row (fixes that row not matching its own section's inline icon) |
| `AccessChangedIcon` | `HiOutlineKey` | — (kept separate — `notificationView.ts`'s "role changed" notification, an unrelated concept to either key above) |

### Kanban / board-view mode

Splits into concepts that looked identical but aren't:

| Canonical name | Source | Meaning | Folds in |
|---|---|---|---|
| `KanbanColumnsIcon` | `LuColumns3` | "The board's columns" — move-to-column, focus-a-column, sidebar Kanban nav entry | `PiColumnsLight` (`BoardSection.tsx`, `usePlaygroundShortcuts.ts`) |
| `KanbanBoardLayoutIcon` | `MdViewKanban` | "Grid/board layout mode" as opposed to List layout | — (kept separate — a real functional distinction, not a duplicate) |

Marketing-only kanban glyphs (`BsKanban` in `BoardShowcase.tsx`, `LuSquareKanban` in `HeroBoardMock.tsx`/`LandingPlatformStack.tsx`) still move into `packages/ui/icons` with real names but are not forced onto either canonical above — see "Scope" above.

### Misc

| Canonical name | Source | Folds in |
|---|---|---|
| `CalendarIcon` | `HiCalendar` | `LuCalendar` (`usePlaygroundShortcuts.ts`) |
| `LoadingSpinnerIcon` | `RiLoader4Line` | `FaSpinner` (2 files) |
| `OverflowMenuIcon` | `MdMoreHoriz` | `BsThreeDots` (marketing) |
| `OverflowMenuVerticalIcon` | `PiDotsThreeOutlineVerticalLight` | — (kept separate — vertical orientation is a deliberate fit for corner/row card-action triggers, not a duplicate of the horizontal glyph) |
| `ProcessingSpinnerIcon` | `MdAutorenew` | — (kept separate — an ongoing/repeating process, Material's own `Autorenew` vs `Refresh` distinction) |
| `RetryActionIcon` | `MdRefresh` | `FiRefreshCw` (`DiffReviewDisplay.tsx` — also normalizes the app's one lone `Fi`-family import onto `Md`) |
| `StatusChangedIcon` | `HiOutlineArrowPath` | — (kept separate — a themed notification-list icon, not a manual retry action) |
| `GanttNavIcon` | `HiBars3CenterLeft` (from `hi2`) | `HiMenuAlt2` (legacy `hi` v1 — this is the Heroicons v1→v2 rename target; verify visually during implementation before committing) |

## Legacy Heroicons v1 (`react-icons/hi`) cleanup

Three imports pull from the legacy `hi` package instead of `hi2`. All three are resolved above rather than as a separate blanket find-replace, since a blind "swap the import path, keep the name" isn't safe when the name doesn't exist in `hi2` (Heroicons v2 renamed whole icon families):

- `HiOutlineTrash` (`MessageActions.tsx`, `CommentCard.tsx`) — resolved by `DeleteIcon`'s migration to `MdDelete`; no separate action needed.
- `HiOutlineAnnotation` — resolved by `ChatsNavIcon`'s migration to `HiOutlineChatBubbleLeftRight`.
- `HiMenuAlt2` — resolved by `GanttNavIcon`'s migration to `HiBars3CenterLeft`.

After this migration, no file in `apps/web` or `apps/admin` imports from `react-icons/hi` at all — everything is `hi2` or another family, enforced by the lint guardrail.

## Bulk picker catalog

`apps/web/data/icons_bulk.ts` (~215 `Pi*Fill` icons for a project-icon picker) moves to `packages/ui/icons/catalog.ts` unchanged in shape — same list, same export, just relocated. It is exempt from the naming/conflict work above because it exists to offer many distinct choices, not to express one concept consistently.

## Migration approach

233 import lines across more than 150 files is too many to hand-edit safely. The implementation plan should generate this mechanically:

1. Build `packages/ui/icons` first — every file described above, the `createIcon` factory, the `IconTooltip` primitive, the barrel, the catalog file, the moved custom-icon files.
2. Write a script that, given the canonical mapping above (plus the mechanical names for the ~200 non-conflicting icons), rewrites every import line in `apps/web` and `apps/admin` to pull from `@trydarwin/ui/icons`, and renames every JSX/reference usage of the old identifier to the new one, in the same file.
3. Handle the two flagged non-mechanical cases by hand, not via the script: `FaCaretDown`/`FaCaretRight`'s swap-to-rotate change, and a visual check on `HiMenuAlt2` → `HiBars3CenterLeft` before committing to it.
4. Remove `react-icons` from `apps/web/package.json` and `apps/admin/package.json`; add `@trydarwin/ui` as a dependency of both.
5. Add the `no-restricted-imports` rule to the shared eslint config.
6. Verify: `bun run typecheck` (catches any import that doesn't exist — the main safety net, since a *wrong-but-valid* icon choice is a design-review problem, not a compiler one), `bun run lint` (catches any remaining direct `react-icons` import, and the dead `IoSendSharp` import), then a plain `grep -rl "from \"react-icons" apps/` returning nothing outside `packages/ui`.
7. Spot-check a handful of the higher-risk renames in a running app (the ones that changed visual weight: `DiffReviewDisplay.tsx`'s warning triangle, `DiffFrame.tsx`'s help icon, `SettingsDisplay.tsx`'s lock, `ChatComposer.tsx`'s send icon).

## Out of scope / noted but not acted on

- `apps/web/components/new/LandingHero.tsx` appears to be dead code (unreferenced — `app/page.tsx` imports `components/landing/LandingHero.tsx` instead). Unrelated to icons; flagged for a separate cleanup, not touched here.
- The installed `react-icons` version actually resolves to `5.7.0` (within the `^5.6.0` range declared in `package.json`), not literally `5.6.x`.
