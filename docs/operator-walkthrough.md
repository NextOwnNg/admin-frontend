# Operator walkthrough: moderation gate

A script for the PRD §15 moderation gate. Trained operators test sign-in, inviting staff, reports, account restrictions, contested handovers, appeals and access to sensitive data, then sign off. Follow it on the mock API or on staging. You don't need to have seen the console before.

Each step says what to do and what you should see (**Expected**). If what you see differs, mark the section **Fail** in the sign-off table and note what happened.

## Before you start

- **Open the console.**
  - Locally, run `npm install` and then `npm run dev`, and open http://localhost:5173.
  - Or open the preview link you were given.
- **The records are fictional.** Every member, listing and case on the mock is made up, and the IDs below exist only there. On staging, ask for the equivalent records.
- **Reloading resets the mock.** It keeps its data in your browser tab, so reloading the page brings the sample data back. That's useful if you want to repeat a step.
- **Sign in** with an email and password, or use the one-click sample accounts on the sign-in page (mock only). Every sample account has the password `Pilot-2026!`. When the console asks for a code from your email, the mock's code is always `123456`; no real email is sent.

| Role | Name | Email | After the password |
| :-- | :-- | :-- | :-- |
| Support agent | Chiamaka Eze | `chiamaka@nextown.test` | Straight in |
| Moderator | Tunde Bakare | `tunde@nextown.test` | Straight in |
| Administrator | Ngozi Adeyemi | `ngozi@nextown.test` | A 6-digit code from email: `123456` |
| Not staff | — | `member@nextown.test` | Refused |

To change role, choose **Sign out** at the top right and sign in again.

## 1. Support agent (Chiamaka Eze)

1. **Sign in as the support agent.**
   - **Expected:** the Overview page.
   - The sidebar shows only Overview, Reports and Exceptions. There are no Records, Moderation log, Settings or Dashboard.
2. **Take an exception.** Open **Exceptions**, then the **Account appeals** tab. On the row for `NX-000233`, choose **Assign to me**.
   - **Expected:** the row now shows you as the assignee, and its next action becomes a link.
3. **Open your payment dispute.** Search for `NX-000202` in the top bar (press `/` to jump there), then open the case.
   - **Expected:**
     - the case summary, the parties with masked phone numbers, and the linked transaction `T-000301`
     - action buttons: **Request information**, **Escalate** and **Record decision**, and nothing else
4. **Reveal a phone number** (sensitive data). In **Parties**, choose **Reveal phone number of Ada O.**
   - **Expected:** a dialog asks why. **Reveal** stays disabled until you type a reason.
   - Type `Calling to confirm the handover time`, then choose **Reveal**.
   - **Expected:**
     - the number appears
     - the case history records that you viewed a phone number
     - when you leave the case and come back, the number is masked again
5. **Record a decision.** Choose **Record decision**.
   - **Expected:** the outcomes are transaction outcomes, such as "Resolved by support: cancelled".
   - Choose one and a reason, then **Continue** and confirm.
   - **Expected:** a green **Recorded** message saying what you proposed, with focus on that message.

## 2. Moderator (Tunde Bakare)

1. **Sign in as the moderator.** Open **Reports**.
   - **Expected:**
     - the queue, with the most severe (S1) cases pinned first
     - filters for status, severity, type, age and assignee above the table
2. **Hide an abusive comment** (reports, QA-19).
   - Open case `NX-000216`.
   - Choose **Hide content**, then the reason **Abusive language (S3)**, then **Continue**.
   - Confirm with **Hide content**.
   - **Expected:**
     - **Recorded**: "Tunde Bakare hid comment C-5501 · Abusive language"
     - the comment now reads "Content hidden by moderation", and its text is gone
3. **Restrict an account** (account restriction).
   - Open case `NX-000211`, an account that posts the same listing many times.
   - Choose **Restrict account**.
   - **Expected:** you can't continue without a reason.
   - Fill in what the dialog asks, then **Continue**. The confirm button is red; confirm.
   - **Expected:** **Recorded**, and the account's record shows the restriction.
4. **Handle an appeal.**
   - Open case `NX-000233`.
   - **Expected:**
     - the summary shows "Appeal from the member", "Restricted until …" and the member's statement
     - **Lift restriction** is offered
   - Choose **Lift restriction** with the reason **Decided on the evidence**, then confirm.
   - **Expected:**
     - the summary now reads "Restriction lifted …"
     - the member's record (`u-segun`) shows them as Active
   - To try the other outcome, reload to reset the mock and open `NX-000233` again. Choose **Close report**: its only outcome is "Restriction upheld", with the reason "Restriction stays in place".
5. **Check a possible duplicate.**
   - Open case `NX-000220`.
   - **Expected:** the case links to the listing it repeats, `L-5219`.
   - Choose **Close report**, then the outcome "No violation".
   - **Expected:** "Not a duplicate" is among the reasons. It isn't offered on ordinary reports.

## 3. Administrator (Ngozi Adeyemi)

1. **Sign in as the administrator.**
   - Enter `ngozi@nextown.test` and `Pilot-2026!`, then **Sign in**.
   - **Expected:** "Enter the code we emailed you", sent to `n•••@nextown.test`. **Resend code** is available after a minute.
   - Enter `123456`, then **Continue**.
   - **Expected:** every section in the sidebar, including Moderation log, Settings, Staff and Dashboard.
2. **Resolve a contested handover.**
   - Open **Exceptions**, then the **Open disputes** tab.
   - On the row for `NX-000205`, choose **Resolve dispute for NX-000205**.
   - **Expected:** transaction `T-000304`, flagged as disputed. Nothing offers to mark it completed.
   - Choose **Resolve dispute**, then the outcome **Resolved by support: cancelled** and the reason **No response from a participant**.
   - Choose **Continue** and confirm.
   - **Expected:** **Recorded**, and the status reads "Resolved by support: cancelled".
3. **A half-confirmed handover stays in review** (QA-15). Open transaction `T-000302`.
   - **Expected:**
     - "1 of 2 confirmed" and "Partial confirmation expired"
     - no **Release** button
     - **Resolve transaction** offers no "Completed" outcome
4. **Change a setting.**
   - Open **Settings**, then **Edit Offer lifetime**.
   - Change 72 to `96`, then choose **Save**.
   - **Expected:** a dialog showing "Offer lifetime: 72 hours → 96 hours" and a notice about agreements already made. **Save change** stays disabled until you give a reason.
   - Type `Pilot feedback: offers expire too soon`, then choose **Save change**.
   - **Expected:**
     - **Saved**, and the section shows 96 hours
     - **History** starts with "Version 2 · Offer lifetime"
5. **Find it in the log.** Open **Moderation log**.
   - **Expected:**
     - "Settings changed" at the top, showing old → new
     - the comment hidden in section 2 and the dispute you resolved, if you did those in this tab without reloading
6. **Invite a moderator, and accept the invite.** Do this without reloading the page: the mock forgets the invite on a reload.
   - Open **Staff**.
   - **Expected:** everyone with access, with their email, role and "Active".
   - Choose **Invite staff**. Enter the name `Ada Obi`, the email `ada@nextown.test`, the role **Moderator**, and the reason `Joining the weekend moderation shift`.
   - **Expected:** without a reason, **Continue** says "Say why you are adding them." and goes no further.
   - Choose **Continue**, check the confirmation, then **Send invite**.
   - **Expected:**
     - "Invite sent to ada@nextown.test", and a row for Ada Obi reading "Invited · expires" a week from today
     - on the mock only, a link **Mock only: open the invite link**, standing in for the email
   - Try inviting `tunde@nextown.test`. **Expected:** "This email already has staff access." under the email.
   - Choose **Mock only: open the invite link**.
   - **Expected:** "You're signed in as Ngozi Adeyemi." Choose **Sign out and continue**.
   - **Expected:** "Join NextOwn Admin as Moderator", "Invited as ada@nextown.test", and two password fields with a strength guide.
   - Enter `Mangoes7 at Ikeja` in both, then **Create account**.
   - **Expected:** the Overview, signed in as Ada Obi, with the moderator's sidebar.
   - Sign out, sign back in as the administrator, and open **Moderation log**. **Expected:** "Ngozi Adeyemi invited Ada Obi", with the reason.
   - Back on **Staff**, Ada's row now reads "Active". On another invite, the row's actions menu offers **Resend invite** and **Revoke invite**, each with a reason; a revoked link reads "Invite link not working".
7. **Reset a forgotten password.**
   - Sign out, then on the sign-in page choose **Forgot password?**.
   - Enter `tunde@nextown.test`, then **Send code**.
   - **Expected:** "If that email has a staff account, we've sent a code." The same message appears for an email with no account.
   - Enter `123456`, a new password, the same password again, then **Reset password**.
   - **Expected:** signed in as Tunde Bakare. Signing in later with `Pilot-2026!` no longer works; the new password does. Reload the page to put the sample password back.
8. **Read the dashboard.** Open **Dashboard**.
   - **Expected:**
     - Five sections. Every rate shows its count, for example "38% (19 of 50)".
     - No targets and no good or bad colours.
     - Support minutes and cost per deal read "Not measured yet".
   - Try **Last 7 days**, a category and an area.
   - **Expected:** the filters appear as chips you can remove, and the header names the dates covered.
   - Switch a section to **Table**.
   - **Expected:** the same figures as a table.

## 4. What must not be possible

| Test | How to try it | Expected |
| :-- | :-- | :-- |
| **ADM-T-01:** staff can't confirm a handover for a participant | As the administrator, open `T-000305` (both confirmed) and `T-000302`. Look for any control that confirms the handover on a member's behalf | There is none. Confirmations come only from the members' own app |
| **ADM-T-02:** masked data needs a reason | Section 1, step 4: try **Reveal** with no reason | **Reveal** stays disabled |
| **ADM-T-03:** every privileged action needs a reason | Open any action, such as **Hide content** on `NX-000216`, and choose **Continue** without a reason | The dialog asks for a reason and doesn't continue |
| **ADM-T-04:** non-staff can't get in | Sign in as `member@nextown.test` with `Pilot-2026!` | "This account can't sign in here." You stay on the sign-in page. A wrong password, or an email with no account, reads "That email and password don't match." either way |
| **ADM-T-05:** two moderators on one case | **Staging only.** The mock keeps its data per browser tab, so two windows can't share a case. Two moderators open the same case; the first hides the content, then the second tries an action | The second gets "This case changed since you opened it." and nothing is overwritten |
| **ADM-T-06:** idle sign-out | Signed in, open a case and leave the console untouched. The timeout is 30 minutes, with a warning 60 seconds before it | "You'll be signed out soon", with a countdown and **Stay signed in**. If you let it run out, you're signed out and the case data is gone from the screen. Signing in again returns you to the same case |

Also check:
- **A support agent can't open a page for another role.** Signed in as the support agent, type `/settings` in the address bar. **Expected:** "You don't have permission to view this page".
- **A moderator can't open the log.** Signed in as the moderator, type `/audit`. **Expected:** the same permission page.

## Screen-reader checklist

For the designer's UX gate. Use VoiceOver (macOS) or NVDA (Windows) with Chrome, and the keyboard only.

- [ ] **Skip link.** The first Tab on any page offers "Skip to content", and choosing it moves to the page's main area.
- [ ] **Landmarks.** The sidebar navigation, the top bar's search and the main content are announced as landmarks, and each page has one level-1 heading.
- [ ] **Queue tables.**
  - The Reports queue is announced as a table named "Reports".
  - Rows are read by their case ID, for example "NX-000216".
  - Sorting announces the new order.
  - Arrow keys move between rows and cells, and Tab enters a cell's link or button.
- [ ] **Dialogs.**
  - Every action dialog is announced by its title.
  - Focus stays inside the dialog until it closes.
  - Closing it returns focus to what opened it. After an action completes, focus moves to the **Recorded** message.
- [ ] **Search.** Typing in the top-bar search announces the number of results ("3 results") or that nothing matched.
- [ ] **Dashboard.** In chart view, each section's figures are read as a table, and the chart itself is skipped.
- [ ] **Masked values.** A masked phone number is read as "Hidden", with a **Reveal** button named for what it reveals. Once revealed, "Phone number revealed" is announced.
- [ ] **Errors.** Error messages and banners are announced when they appear, without moving focus away from your work.
- [ ] **Sign-in.** The password field's **Show password** button says whether the password is shown. On the code step, the code field reads as one field, and **Resend code** says how long to wait.
- [ ] **Idle warning.** The idle warning is announced, and **Stay signed in** can be reached at once.

## Sign-off

| Operator | Role | Date | Section | Pass / Fail | Notes |
| :-- | :-- | :-- | :-- | :-- | :-- |
|  |  |  | 1. Support agent |  |  |
|  |  |  | 2. Moderator |  |  |
|  |  |  | 3. Administrator, including inviting staff and resetting a password |  |  |
|  |  |  | 4. What must not be possible |  |  |
|  |  |  | Screen-reader checklist |  |  |
