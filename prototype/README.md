# AI MAX sign up, launch and onboarding prototype

A clickable prototype of the full journey: **Sign up & pay → Confirm details → Review website → Launch → AI MAX setup**.
It is built to be understood by anyone from a five-year-old to an eighty-five-year-old: one heading and one main button per screen, large type, plain words, and a progress bar that is always on screen.

## Run it

```bash
cd prototype
npm install        # only needed to rebuild
npm run build      # writes dist/
npm start          # builds and serves http://localhost:4173
```

`dist/` is committed, so you can also serve that folder with any static server (for example `python3 -m http.server --directory dist`).

## Where am I? (always visible)

- Top bar: **Sign up · Details · Website · Launch**, with done steps checked and the current step highlighted. On phones it becomes "Step 3 of 4 · Website" with a bar.
- Every screen starts with a small "Step n of 4" label, and the sticky bottom bar repeats it next to the one main button.
- After launch the bar becomes "Set up AI MAX · 3 of 6 done".
- "Progress saved" and **Finish later** are always in the top bar once the client has paid.

## Branding: AI MAX first, platform after the password

Sign up uses the dark AI MAX look (aurora purple). When payment succeeds and the account exists, the whole shell fades over about 2.4 seconds to the lighter "platform" look, and stays light from then on. Colour tokens are registered CSS properties, so the fade is a single attribute change (`data-tone`).

## Flow and where each spec section lives

| Spec | Screen | File |
| --- | --- | --- |
| 1 Signup and payment | Form, processing, welcome | `src/screens/Signup.jsx` |
| 2 Saved progress, return links | Finish later, email previews, expired link | `src/ui/Shell.jsx`, `src/ui/Emails.jsx`, `src/screens/Links.jsx` |
| 3 Shared layout | Top bar, help, saved status | `src/ui/Shell.jsx` |
| 4 Confirm business details | Editable summaries, explicit confirmation | `src/screens/Details.jsx` |
| 5 Apply confirmed info | Auto-apply, team work, clarification question | `src/screens/Updating.jsx`, `diffBiz` and `planUpdate` in `src/store.jsx` |
| 6 Review and edit | Click-to-comment on the real site, pins, browse vs leave edits | `src/screens/Review.jsx` |
| 7 My edits and submission | Drawer, check-before-send, one optional note | `src/screens/Review.jsx`, `src/screens/Tracking.jsx` |
| 8 Progress, questions, revisions | Per-request status, replies kept with the request | `src/screens/Tracking.jsx` |
| 9 Website approval | Tied to the reviewed version; renewed if the version changes | `approvalCurrent` in `src/store.jsx` |
| 10 Launch details | Calls, forms, follow-up, domain, approval | `src/screens/Launch.jsx` |
| 11 Authorization and publication | Checklist, publishing, waiting, action needed, live | `src/screens/Launch.jsx` |
| 12 Confirmation and handoff | Live preview, link, Continue to AI MAX, old-link state | `src/screens/Launch.jsx`, `src/screens/Links.jsx` |
| 13 Self-service onboarding | Prefilled items, connect flows, business software states, revenue goal | `src/screens/Platform.jsx` |
| 14 Shared record | One state object, six milestones | `src/store.jsx` (`milestones`) |

One customer record (`src/store.jsx`) backs everything, saved to `localStorage`, so a refresh or return visit resumes at the next unfinished action and never asks twice.

## Prototype controls (bottom-left)

A dark "Prototype controls" button opens a panel for reviewers:

- the customer record with the six milestones and timestamps
- jump to any screen (each jump builds a consistent record first)
- choose what happens after "Confirm & continue": from your edits, no changes, auto-apply, team work, or a question
- decline the next card, or open checkout again after paying (it resumes instead of charging twice)
- simulate the team: updated draft ready, start work, ask a question, revisions ready
- choose the publish outcome: goes live, waiting on a dependency, or action needed
- preview every email, the expired-link screen, and an old link opened after launch
- hide the dashed "Prototype" skip-ahead shortcuts that appear on waiting screens

Test card: any number works. A number ending in `0002` is declined.

## Decisions I made that you may want to change

- **Four steps in the bar.** The spec names three (Details, Website, Launch). I added "Sign up" in front so people also know where they are during checkout. It shows as done afterwards.
- **Sample numbers.** Price ($349 per month, 12 months, billed on the 14th, $349 due today), the firm, phone numbers, DNS values, help phone and email are placeholders in `src/data.js`.
- **No hard-coded edit limits or turnaround promises.** The Design Reveal's "two rounds", per-category limits and "two business days" are left out until the business rules are confirmed.
- **No target launch dates or assisted-launch option.** Retained only if the real process needs them.
- **Duplicate-charge protection** is simulated: the submit is guarded while processing and a paid account skips checkout. The real build needs an idempotency key on the payment and account creation calls.
- **Approving with unsent edits** asks once: send them first, or approve without them (they stay as drafts).
- **Business software.** "Other system entered" counts as handled for setup, but nothing is connected. Only "connected" or "I don't use any" fully count. "Decide later" keeps the item open.
- **Corrections from business confirmation** are tracked in their own list ("Updates from your confirmed details") and never count as edit requests.

## Still to confirm (from the spec)

1. Whether website updates after confirmation are automatic, team-managed, or both.
2. Revision policy: number of rounds, limits, turnaround wording.
3. Whether target dates and assisted launch stay.
4. Revenue goal fields, time period and whether it is required.
5. Whether AI MAX can offer the same provider connections (Google Business Profile, socials, business software) as the screenshots.
6. The approved price, term and billing copy.
7. Whether "supported account-creation method" (for example sign in with Google) is wanted at sign up.

## Tech

React 18 and esbuild, no runtime dependencies besides React. The website preview is the Duran Law Firm homepage from the Design Reveal (`src/site/RooSite.jsx`), parametrised so confirmed phone, email, address and services show up in the draft. Each clickable element carries a stable `data-el` label, which becomes the request's element reference together with its section.
