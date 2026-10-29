

**N E X T O W N  /  PRODUCT SPECIFICATION**

**NextOwn**

# **Product Requirements Document**

## *Business objectives, release scope, functional behaviours, technical interfaces, safety and acceptance criteria.*

*Turn what you own into what you want.*

| Brand: NextOwn     Website: www\.nextown.ngMarket: Nigeria     First release: responsive web pilotStatus: V0.9 | PROPOSED / FOR FOUNDER APPROVAL |
| :---- |

Prepared for product, engineering, design, research and operations teams.

# **Document Control and Decision Status**

| Field | Definition |
| :---- | :---- |
| Document ID | NX-PRD-001 | Revision 0.9 | 13 October 2026 |
| Product / address | NextOwn | www\.nextown.ng (founder-supplied) |
| Source of concept | Peer Exchange Marketplace Proposal, October 2026, pages 2-9 |
| Owner / reviewers | Product owner: Founder; reviewers: engineering leads, UI/UX, pilot operations, legal/privacy advisers |
| Delivery target | One-city, individual-first, mobile-first responsive web pilot; native apps excluded initially |
| Normative status | Proposed delivery baseline. P0 defaults require sign-off in the decision register before implementation. |

Evidence key used in requirements: S \= established by the source proposal; R \= new, recommended implementation detail; D \= open decision. P0 \= required to launch safely; P1 \= important pilot improvement; P2 \= later-phase capability. A recommended value is an explicit placeholder, not an agreed business decision.

| DECISION PRINCIPLE  When scope, risk or budget conflict, preserve the complete listing \> offer \> agreement \> handover \> dual-confirmation journey, safety controls and accurate records before adding engagement features. |
| :---- |

# **1\. Executive Product Definition**

NextOwn is an individual-first marketplace where people in Nigeria can turn possessions they already own into cash or other possessions. A person can list a used item, receive a cash offer, trade an item, or negotiate an item-plus-cash exchange. Quick Sell expresses urgency. A discovery feed makes the marketplace interesting between purposeful searches without fragmenting underlying inventory or transaction records.

**Core positioning**: "Turn what you own into what you want." The immediate product must prove the feasibility of local, person-to-person transactions, not assume product-market fit, verified item ownership, authentic goods or financially sustainable economics.

## **1.1 Problems and Jobs to be Done**

| User / job | Current friction | NextOwn response |
| :---- | :---- | :---- |
| Declutterer: "Move this item quickly" | Scattered DMs, repetitive explanations and ghosting | Fast listing, condition evidence, clear urgency, centralised structured offers |
| Budget-conscious upgrader: "Get a better device without full cash" | Existing property is not readily usable as part payment | One item plus optional cash, clearly marked payer direction and counteroffers |
| Bargain-seeking buyer: "Find reliable local secondhand" | Unclear availability, location, defects and seller credibility | Structured searchable listings, item condition fields, availability and transaction-linked reviews |
| Responsible casual flipper: "Find viable opportunities" | Large amount of searching and uncertain deal terms | Local discovery and Quick Sell, without privileging bulk shops or duplicate stock |
| Moderation/support: "Resolve marketplace issues" | Missing records, unverifiable claims and no audit trail | Frozen agreements, report/case tools, granular confirmations and moderation log |

## **1.2 Product Principles**

* **Exchange first**: offer flexibility and agreement clarity are the differentiators; cash sales remain fully supported.  
* **Individual-first**: discourage bulk store catalogues and duplicate listings, while permitting ordinary personal re-selling.  
* **Honest trust cues**: phone confirmation is not identity verification; external transfers are not protected by NextOwn.  
* **One possession, one state**: the same item record appears in public listings and outgoing swap offers.  
* **Local and practical**: city/area discovery, low-data mobile access and clear handover expectations.  
* **Feed serves liquidity**: social discovery should lead to actionable offers and completed exchanges, not vanity metrics.  
* **Explain what happens next**: every offer, hold, handover, cancellation and dispute has a visible next step.

# **2\. Objectives, Non-goals and Pilot proof**

| Level | Objective / Definition |
| :---- | :---- |
| North-star outcome | Completed real-world person-to-person transactions, counted by mode and verified on-platform through independent user confirmations (not independent payment verification). |
| Pilot goals | Quality listings; credible offers; responsive negotiation; agreed deals that become completed handovers; repeat use with tolerable safety and support cost. |
| Non-goals in MVP | Banking/escrow, payment custody, shipping guarantees, item authenticity certification, AI price valuation, identity proofing, auctions or three-way swaps. |
| Monetisation stance | Ordinary pilot listings may be free; no percentage fee or protected-payment charge assumed until feasible service economics are validated. |
| Evidence standard | Use behavioural conversion and a sampled manual review of credible offers, alongside interviews and incident records. |

## **2.1 User Groups and Access Boundaries**

| Role | Capabilities / Boundaries |
| :---- | :---- |
| Guest | Browse public listings/feed, see coarse seller reputation, search/filter; must sign in to save, comment, message, offer or report. |
| Member | Own items and listings, post listing-linked feed highlights, negotiate, chat, confirm, rate and manage privacy. |
| Restricted member | Can access own account and support/appeal path but cannot create offers/listings or public content, subject to moderation rule. |
| Support agent | View assigned cases, relevant transaction evidence and limited content with audited access; no irreversible super-admin actions. |
| Moderator | Review/disable listings and comments, handle reports, apply temporary restrictions and record reasons. |
| Administrator | Manage permitted account roles, policy settings, audit events, operational dashboards and case escalation. |

# **3\. Delivery Phases and Scope Boundary**

| Phase | What is in Scope | Release Gate |
| :---- | :---- | :---- |
| 0\. Discovery / prototype | Interviews, manual matching experiments, click-through prototype, technical spikes and costing | Founding team chooses city/categories and signs off architecture, privacy review and pilot metrics |
| 1\. Local pilot / P0 | Phone confirmation; profiles; item and listing records; Sell, Quick Sell, Swap and item-plus-cash; search/filter; simple feed with listing-linked captions/comments; saves; chat; offers/counters; atomic holds; dual handover confirmation; reports, reviews and admin | Complete end-to-end acceptance tests including adverse scenarios and support runbook |
| 1.1 Pilot improvements / P1 | Better onboarding, richer but rule-based sorting, assisted seller tooling, helpful notifications and safety refinements | Usage evidence identifies bottleneck |
| 2\. Matching | Public Looking For, opt-in private My Stuff, automated compatibility, multi-item offers, Following feed | Enough local supply and repeat demand |
| 3\. Services | Delivery partnerships, paid inspection, protected payments subject to provider/legal feasibility, transparent fees | Service partner contracts, risk controls and unit economics |
| 4\. Specialist | Auctions, collector workflows, authenticators, value guidance, video-rich social feed | Category density, operations and specialist partners |
| 5\. Advanced exchange | Multi-party trade circles, AI pricing assistance and fraud support | Reliable transaction data, safeguards and multi-party coordination design |

## **3.1 Explicit Exclusions from the Launch Contract**

Do not implement or depict in the MVP: escrow wallets; "secure" or "protected" payment badges; automatic external-bank-transfer verification; logistics tracking or remote delivery completion; in-app auction bids; service-for-goods as formal consideration; AI condition/authenticity guarantees; multi-item offers; searchable private My Stuff inventory; live video social feeds; true identity verification without a provider and defined checks. Preserve clean data models for later extensibility.

## **3.2 Pilot Parameters to Configure, not Hard-code**

| Setting | Proposed Implementation Default / Approval |
| :---- | :---- |
| Geography | One city, area/LGA level; founding team selection pending. Allow an administrator to configure available cities/areas. |
| Categories | Phones, laptops, gaming devices proposed; compare fraud and inspection risk with household goods before lock. |
| Eligibility | 18+ self-attestation proposed for pilot, subject to legal approval; country code \+234. |
| Offer lifetime | 72 hours since last version created by default; configurable 24-168h; offer owner can withdraw before acceptance. |
| Quick Sell deadline | Seller chooses 24h, 48h, 72h or 7 days; exact UTC expiry is recorded and shown in WAT. |
| Reservation duration | 7 days after acceptance by default; configurable. Never auto-complete on timeout. |
| OTP policy | Six digits, 10-minute expiry, 5 attempts, 60-second resend wait, anti-enumeration/rate limiting. |
| Listing photos | 1-8 current photos; at least 3 recommended for high-risk devices; compress before upload. |
| Fees / support | Zero ordinary listing fee in initial pilot; dedicated support contact and hours to be selected. |

# **4\. User Journeys and Service Blueprints**

| Journey | Happy Path | Unhappy / Recovery Path |
| :---- | :---- | :---- |
| Seller lists | Confirm phone \> select area \> add item details/photos \> choose sale/swap preferences \> preview \> publish | Save draft; correct field errors; moderation queue; failed image retry |
| Cash sale | Browse \> make cash offer \> seller accepts/counters \> reserve \> arrange inspection/payment \> each confirms \> review | Offer expires; listing withdrawn; seller counters; one party disputes or cancels |
| Swap \+ cash | Open listing \> choose owned swap item or create offer-only item \> enter payer direction/top-up \> send \> counter \> accept \> reserve both \> inspect/exchange \> confirm | Offered item already reserved; mismatched cash direction; changed item condition; dual confirmations diverge |
| Quick Sell | Seller selects expiry \> listing appears in urgent surfaces \> credible offer \> acceptance | Deadline lapses: renew/edit/close; no implied buyer guarantee |
| Feed to trade | Browse recent local highlights \> expand listing \> open structured offer | Listing reserved while post viewed: show unavailable state; no stale offer allowed |
| Support | Report from listing/chat/transaction \> add details \> case assignment \> recorded intervention | Appeal restriction; access limited; never promise refunds for an external payment |

# **5\. Functional Requirements and Acceptance Criteria**

For every P0 requirement, engineering must implement server-side validation, a usable client-side state and relevant audit/analytics events. Client validation alone is never sufficient for money amounts, access rules, ownership or availability.

## **5.1 Account, Profile and Permissions**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| ACC-01P0 S | Allow phone number sign-up/sign-in with SMS one-time confirmation. Display "Phone confirmed" when successful. | A new user can confirm \+234 number; session persists; label never says "Identity verified". |
| ACC-02P0 R | Block brute force, OTP enumeration and repeated SMS sends with configurable per-phone, per-device and per-IP limits. | Excessive attempts return neutral retry advice; logs omit OTP plaintext. |
| ACC-03P0 S | Collect display name, coarse city/area and optional profile photo; permit profile editing and account controls. | Public profile omits phone number, home address and exact GPS; edits are versioned. |
| ACC-04P0 R | Record terms/privacy acknowledgment and proposed eligibility confirmation (18+) before posting or offering. | Time, version and consent source captured; no optional marketing opt-in prechecked. |
| ACC-05P0 R | Provide logout, session expiry, safe account recovery and a request-access/deletion support route. | Logged-out sessions cannot mutate objects; privacy request is ticketed for policy handling. |
| ACC-06P0 R | Use role-based access controls and relationship checks on every authenticated endpoint. | A user cannot view another user's private item, offer thread or unshared handover details. |
| ACC-07P1 R | Let users configure notification preferences and optional interests. | Essential security notices remain deliverable; marketing opt-in separate. |

## **5.2 Item Records, Listings and Quick Sell**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| LST-01P0 S | Create stable Item IDs owned by a user. Public listing and swap offer reference the same item, never copied inventory. | Editing a public listing does not create a second sellable Item ID. |
| LST-02P0 S | Collect category, make/model where relevant, title, description, current images, condition, defects, repair history and lawful ownership declaration. | Required fields gated before publish; condition and defect disclosure preserved in agreement snapshot. |
| LST-03P0 S | A listing can permit cash, swap or both. Cash-enabled mode has asking price in NGN; swap mode may specify desired items or "open to offers". | Unsupported offer types cannot be submitted; users see allowed modes. |
| LST-04P0 S | Quick Sell is a deadline/urgency option on a listing, not a promise of completion. | Urgent status displays actual expiry; expiration offers renew, revise or close. |
| LST-05P0 R | Listings support DRAFT, PENDING\_REVIEW, ACTIVE, RESERVED, EXPIRED, COMPLETED, CLOSED and REMOVED states. | Only ACTIVE listings accept new offers; public URLs show honest unavailable state. |
| LST-06P0 R | Compress images and strip EXIF/GPS metadata server-side; accept approved formats, enforce byte and count limits, scan/moderate as appropriate. | Metadata not publicly recoverable and malicious files rejected. |
| LST-07P0 R | Offer-only items can be created during a swap offer without appearing in public search or creating a general My Stuff inventory. | Recipient sees item details/photos; other users cannot enumerate offer-only records. |
| LST-08P0 R | Owner can edit active listings, close, archive or mark no longer available; accepted terms remain unchanged. | Editing price after a deal does not mutate transaction snapshot. |
| LST-09P0 S | Prevent or flag duplicate/reposted commercial inventory and prohibit policy-restricted goods; moderation may remove listings. | Duplicate/report queue exists and removal reasons are recorded. |
| LST-10P0 R | Restrict a member to one actively available public listing per physical Item ID. | DB enforces no multiple active listings for one item. |
| LST-11P1 R | Provide category-specific form fields (e.g., storage, battery, accessories) with "not known" when reasonable. | Irrelevant fields not shown; high-risk categories have targeted disclosures. |

## **5.3 Search, Discovery and Social Feed**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| DSC-01P0 S | Offer keyword search, category, city/area, price, transaction mode and urgency filters; allow sort by recent. | Combining filters returns consistent active listings with removable chips. |
| DSC-02P0 R | Public results never reveal exact home address, seller phone, unlisted items or reserved inventory as available. | API returns coarse public-safe location and state-based availability. |
| DSC-03P0 S | Users can save listings and feed posts, with access from profile. | Saves persist across sessions and survive a listing later becoming unavailable. |
| DSC-04P0 S | Expose a lightweight discovery feed with listing highlights, short captions and moderated comments, linked to canonical listing data. | Status/price changes appear consistently; stale feed post cannot initiate invalid offer. |
| DSC-05P0 R | MVP feed order uses area and interests (when available), recency and basic category diversity, with an always-visible Explore Marketplace path. | Sort is deterministic enough for testing; no engagement-only ranking requirement. |
| DSC-06P0 S | Permit users to open an eligible listing from a post and enter structured negotiation. | Comments never count as accepted offers; CTA opens listing/offer composer. |
| DSC-07P0 R | Show explicit empty, no-result, loading, partial-load and unavailable states. | User can reset filters or explore alternatives without error traps. |
| DSC-08P0 R | Enable report and block from public profiles/posts/comments; block suppresses direct contact by blocked member. | Server enforces block status for messages, offer creation and mentions (if added). |
| DSC-09P1 R | Support SEO-friendly public listing routes and share previews that omit sensitive data. | Deep links open correct listing and represent actual availability. |

## **5.4 Structured Offers, Counteroffers and Reservation**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| OFF-01P0 S | Support cash offers; one offered item in swap; and one item plus optional cash. Offered item belongs to offerer. | Offer mode and item count validated server-side; no multi-item offers in MVP. |
| OFF-02P0 S | Represent cash top-up explicitly as amount and direction: OFFERER\_PAYS\_OWNER, OWNER\_PAYS\_OFFERER or NONE. | No ambiguous negative amounts; both users see who pays whom. |
| OFF-03P0 S | Recipient can accept, reject or counter; sender can withdraw a pending offer; expiring offers become non-actionable. | Only latest version is actionable; expired/withdrawn offers cannot be accepted. |
| OFF-04P0 S | Each counteroffer creates an immutable version of money, item and disclosed terms, requiring the other party to accept. | History visible chronologically; accepting a prior version fails with conflict. |
| OFF-05P0 R | Use optimistic display plus server revalidation for availability, ownership, policy and blocked relationships at send and accept. | Offers on withdrawn, reserved or self-owned targets are rejected safely. |
| OFF-06P0 S | Acceptance atomically reserves all Item IDs involved. Exactly one competing acceptance can succeed. | Concurrent accept test creates at most one transaction with unique reserved items. |
| OFF-07P0 S | Acceptance records a fixed transaction snapshot including listing title/photos/defects, cash direction, amount, item IDs and accepted offer version. | Later listing edits cannot change transaction terms in API or UI. |
| OFF-08P0 S | Competing offers on newly reserved items are closed/unavailable and relevant participants informed. | Every affected offer stops accepting and has a reason code. |
| OFF-09P0 R | Default version expiration 72 hours; use UTC timestamp and a background worker with idempotent expiry. | Visible remaining time corresponds to server time; late acceptance returns EXPIRED. |
| OFF-10P0 R | Prevent a user from offering the same item into a second accepted deal. | Unique active reservation constraint on each Item ID passes racing test. |
| OFF-11P1 R | Provide a clear side-by-side comparison of previous and new counteroffer terms. | Amount and payer changes are unmistakable before acceptance. |

## **5.5 Transaction, Local Handover and Completion**

| ID / Priority | Requirement / rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| TRX-01P0 S | On acceptance, create one transaction with AWAITING\_HANDOVER status and reserved item(s), without moving funds in-product. | Transaction ID and immutable agreement visible to both parties. |
| TRX-02P0 S | Provide private handover arrangement fields and chat, share exact meeting point only in accepted deal. | Only participants and audited authorised support may see handover information. |
| TRX-03P0 S | Require independent confirmation from both parties before COMPLETED and review eligibility. | One confirmation never produces a completed badge or review eligibility. |
| TRX-04P0 S | Record confirmation time, confirming user and self-attested inspection/exchange/payment checkboxes as applicable. | UI explicitly states payment was not verified by NextOwn. |
| TRX-05P0 R | Allow participant-initiated cancellation request with reason. Cancellation after acceptance needs an explicit decision flow and logged reason. | A disputed cancellation does not silently release inventory or close evidence. |
| TRX-06P0 S | Provide DISPUTED path if one party contests handover, condition or completion; hold records for case handling. | Transaction does not become COMPLETED while unresolved. |
| TRX-07P0 R | Default reservation expires after 7 days. If neither confirms, send reminder then cancel/expire and release; if one confirms, escalate to review instead of automatically releasing. | Expiry worker cannot mark completed; partial confirmation enters exception queue. |
| TRX-08P0 R | Admin may record a resolution outcome and release items with reason and audit trail; never rewrite initial agreement or impersonate a user confirmation. | Audit shows actor/time/evidence, original user confirmations remain intact. |
| TRX-09P0 S | No escrow/protected-payment representation in local pilot; cash and inspection happen between participants. | Every handover flow presents concise off-platform payment limits. |
| TRX-10P1 R | Give both parties the same shareable transaction summary with timestamp and exact agreed item/cash terms. | Downloaded/shared summary labels payment confirmation as self-reported. |

## **5.6 Messaging and Notifications**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| MSG-01P0 S | Provide chat anchored to listing and participants, with offer and transaction context available in thread. | Chat accessible only to both participants and audited authorised case handling. |
| MSG-02P0 R | Messages have sender ID, timestamp, delivery status and server-side sanitisation; attachments are optional and restricted. | Untrusted HTML/scripts not executed; failed send can retry without duplicate. |
| MSG-03P0 S | Notify on received offer, counteroffer, accepted/rejected/expired offer, reservation, meeting update, confirmation, dispute and moderation action. | Each material event creates an in-app notification and optional supported channel. |
| MSG-04P0 R | Notifications deep link to context and reflect current source of truth if state has changed. | Old "accept offer" notification never bypasses availability rules. |
| MSG-05P0 R | Rate-limit chat and comments and offer report/block without removing access to one's own transaction records. | Spam bursts throttled and blocked recipient does not receive new messages. |
| MSG-06P1 R | Offer user-level quiet settings for non-critical alerts, with accessible in-app inbox as fallback. | Security and transaction changes never depend only on push delivery. |

## **5.7 Reputation, Reporting and Moderation**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| TRU-01P0 S | Allow a review only when transaction completed, one per reviewer per transaction and for the other participant. | Blocked/expired/cancelled/disputed-unresolved transactions do not grant reviews. |
| TRU-02P0 S | Show review count beside rating; do not introduce a composite Trust Score at pilot. | A one-review rating is distinguishable from many reviews. |
| TRU-03P0 S | Enable reporting for listing, message, feed post, comment, account and transaction; include category and optional evidence. | Submission returns case reference and help channel; duplicate handling supported. |
| TRU-04P0 S | Moderators can hide content, remove listings, warn/restrict accounts, review case evidence and log actions. | Role permissions, reason codes and audited actions enforced. |
| TRU-05P0 R | Publish community/prohibited goods rules, escalation and appeals process before launch. | Policies linked at publish, listing, report, and support contexts. |
| TRU-06P0 R | Use “Phone confirmed” only for OTP; never imply authenticity, inspected condition or ownership verification. | All verification labels describe exactly what was checked. |
| TRU-07P0 R | Implement report queue with priority/severity, assignee, internal notes, status, evidence permissions and resolution. | Safety cases can be assigned/escalated; admin changes have audit entries. |
| TRU-08P1 R | Detect repetitive suspicious accounts/listings with simple heuristics; moderation decides sanctions. | False positive appeal route exists; no hidden Trust Score. |

## **5.8 Administration and Operations**

| ID / Priority | Requirement / Rule | Acceptance / Evidence |
| :---- | :---- | :---- |
| ADM-01P0 S | Provide admin list/detail views for users, items, listings, offers/versions, transactions, feed content and reports. | Authorized role can search relevant records and navigate relationship chain. |
| ADM-02P0 R | All privileged actions record actor, target, reason, time and before/after state; sensitive views are also logged. | Audit rows immutable to ordinary admins and queryable by super-admin. |
| ADM-03P0 R | Admins can configure pilot city/areas, supported categories, default expiry, content rules and support contacts without code deployment. | Updates are versioned and validated; do not retroactively rewrite agreements. |
| ADM-04P0 R | Support can triage stale partial confirmations, reservation expiries, duplicate items, disputes and account appeals. | Queue includes due date, priority and next action; no hidden dead-end cases. |
| ADM-05P0 S | Operators can review pilot funnel and category/location liquidity, alongside disputes and support effort. | Role-restricted dashboard uses event definitions set in Section 13\. |
| ADM-06P1 R | Support masked export of case/transaction audit for authorised requests, subject to retention policy. | Export action permissioned, logged and excludes unrelated private data. |

# **6\. Domain Model and Critical Data Rules**

All material records use server-generated opaque IDs, UTC created\_at/updated\_at times, an owning principal and audit history where relevant. Monetary values persist as integer kobo under currency NGN, never binary floating-point. Display in whole-naira format unless fractional support is explicitly introduced. Access to a linked ID never implies permission to access the linked record.

| Entity / Relationships | Minimum Fields and Constraints |
| :---- | :---- |
| User 1:M Item, Listing, Offer, Report | id, phone\_e164 (private, unique), phone\_confirmed\_at, display\_name, city\_id, area\_id, profile\_image, status, role, terms\_version, created\_at. Public view has no phone. |
| Item 1:M Listing history; 1:M Offer reference | id, owner\_id, category\_id, title, model, condition, defects, repairs, images, ownership\_declaration, visibility (PUBLIC\_LISTED/OFFER\_ONLY), availability, version. One physical item means one logical ID. |
| Listing M:1 Item | id, item\_id, seller\_id, accepted\_modes, asking\_amount\_kobo nullable, desired\_items, area\_id, description, urgency\_expires\_at, status, published\_at, moderation\_status. One ACTIVE/RESERVED listing per Item. |
| FeedPost M:1 Listing | id, author\_id, listing\_id, caption, created\_at, status; post points to live listing price and availability, not duplicated fields. |
| Comment / Save | comment: post\_id, author\_id, text, status, created\_at; save: user\_id \+ target type/id, unique per target/user. |
| Offer negotiation 1:M OfferVersion | offer id, target\_listing\_id, initiator\_id, recipient\_id, status, current\_version\_id, expires\_at. Only one current actionable version. |
| OfferVersion M:1 Offer | version\_number, proposed\_by\_id, cash\_amount\_kobo, cash\_direction, offered\_item\_id nullable, terms\_text, created\_at, expires\_at, immutable payload. |
| Reservation M:1 Item / Transaction | item\_id, transaction\_id, created\_at, expires\_at, released\_at, release\_reason; unique active reservation per Item ID. |
| Transaction 1:1 accepted OfferVersion | id, accepted\_version\_id, buyer\_or\_swap\_participants, status, agreement\_snapshot JSON, handover\_city/venue (private), expires\_at, exception\_reason, created\_at. |
| Confirmation M:1 Transaction | transaction\_id, participant\_id (unique per transaction), inspected\_items, exchange\_confirmed, cash\_handled\_self\_report (if relevant), confirmed\_at, source. |
| Conversation / Message | conversation listing\_id, participants; message sender\_id, text, attachment\_ref optional, timestamp, moderation state. Access restricted by membership. |
| Review 1:1 reviewer+transaction | transaction\_id, reviewer\_id, reviewed\_user\_id, rating\_1\_5, optional note, created\_at, status; only after COMPLETED. |
| Report / ModerationCase | reporter, reported target, reason, evidence refs, severity, status, assigned\_to, decision, timestamps. Case notes private. |
| Notification / AuditEvent | notification recipient\_id, event\_type, object\_ref, read\_at; audit actor\_id, action, target, reason, outcome, timestamp, request\_id. |

## **6.1 Invariants Enforced at the Persistence Boundary**

* One physical item can have at most one ACTIVE reservation. Acceptance of a multi-asset swap locks every Item ID in a consistent order inside one database transaction.  
* The server verifies Item.owner\_id equals offering user and target Listing.item\_id belongs to recipient, and that participants differ.  
* One accepted OfferVersion generates at most one Transaction; idempotency keys make retries safe even if response is lost.  
* Only the newest OfferVersion of a PENDING negotiation is actionable; historical versions are immutable.  
* Monetary terms are always cash\_amount\_kobo \>= 0 plus explicit direction, or NONE when zero; no inferred direction.  
* Accepted transaction agreement\_snapshot is immutable, including photos or version references needed to interpret condition at agreement time.  
* One user confirmation does not mark transaction COMPLETE; independently confirmed participants must be the exact transaction parties.  
* Completed status does not certify funds or authenticity, only platform-recorded reciprocal user attestations.  
* An unavailable, removed or reserved item cannot be exposed as open to a new deal in discovery or feed.

# **7\. State Transitions and Concurrency**

## **7.1 State Machine: Listing**

| From | Allowed Action / Guard | To / Effect |
| :---- | :---- | :---- |
| DRAFT | Owner completes required fields and publishes | ACTIVE, or PENDING\_REVIEW when content requires manual check |
| PENDING\_REVIEW | Moderator approves / rejects | ACTIVE / REMOVED with reason |
| ACTIVE | Owner changes listing data | ACTIVE; updated metadata, offers remain separately versioned |
| ACTIVE | Acceptance atomically reserves underlying item | RESERVED; close competing offers |
| ACTIVE | Quick Sell deadline reached; no accepted transaction | EXPIRED; owner may renew after current checks |
| ACTIVE / EXPIRED | Owner voluntarily closes | CLOSED; no new offers |
| RESERVED | Deal completes | COMPLETED; item TRANSFERRED |
| RESERVED | Deal cancellation/expiry resolved; item still owner available | ACTIVE or CLOSED per owner choice; reservation released |
| Any public state | Policy violation with moderator action | REMOVED; no new contact/offer, evidence retained per policy |

## **7.2 State Machine: Negotiation and Offer Versions**

| Action | Server Guard | Result |
| :---- | :---- | :---- |
| New offer sent | Target ACTIVE, current user eligible, item owner/available, mode allowed | Offer PENDING, version 1 actionable with expires\_at |
| Counteroffer sent | Actor is current recipient, PENDING not expired | Current version SUPERSEDED; next immutable version; turn passes to other party |
| Accept latest version | Current recipient, no dispute or block, both assets available and unlocked | Offer ACCEPTED, Transaction created, all items reserved in same DB transaction |
| Reject / withdraw | Actor authorised and Offer PENDING | REJECTED / WITHDRAWN; no transaction |
| Offer timer fires | PENDING and expires\_at elapsed | EXPIRED; reject late request consistently |
| Competing item reserved | Offer references target or offered item now reserved elsewhere | CLOSED\_UNAVAILABLE with reason and notification |
| Client retries accept | Idempotency key repeated | Return original transaction result, not duplicate records |

## **7.3 Transaction Lifecycle and Exception Rules**

| State / Flag | Transition or Support Policy |
| :---- | :---- |
| AWAITING\_HANDOVER | Agreement has been accepted and assets reserved; users can arrange a local inspection, meet, update private venue and separately self-confirm. |
| AWAITING\_HANDOVER \+ confirmation 1/2 | Remain awaiting; show "Waiting for other person". At expiry, flag PARTIAL\_CONFIRMATION\_TIMEOUT, freeze automated item release and alert support. |
| COMPLETED | Set only if both valid confirmations exist and no unresolved dispute/hold. Item becomes TRANSFERRED; review permissions open. |
| CANCELLED | Both participants agree, or admin applies authorised cancellation resolution after evidence review. Release available items and record cancellation reason. |
| DISPUTED | Participant raises a contested fact; freeze reviews and completion, notify support, restrict automatic release pending recorded resolution. |
| Reservation timeout, 0/2 confirmed | Send warning before default 7 days; if no dispute, cancel with EXPIRED\_HANDOVER and release; never auto-confirm payment. |
| Admin resolution of dispute | Record case decision separately. Resolve as COMPLETED only if both confirmations legitimately exist; otherwise close/cancel or mark administratively resolved without a false completion claim. |

## **7.4 Atomic Acceptance \- Required Server Sequence**

* Authenticate and authorise accepting actor, require Idempotency-Key and request version ID.  
* Begin one serialisable or properly locked transaction; lock target and offered Item IDs in stable sorted order.  
* Confirm Offer/Version still latest and pending, not expired; listing still ACTIVE, mode valid, parties unblocked, owner unchanged and Items AVAILABLE.  
* Insert reservation rows protected by a unique-active-item constraint, create immutable Transaction snapshot, update availability/listing/offer states.  
* Mark competing offers CLOSED\_UNAVAILABLE inside the same committed operation or in a reliable outbox workflow whose effect cannot leave offers actionable.  
* Commit, then publish transactional outbox events for notifications, analytics and search/feed index updates. On race return 409 ITEM\_UNAVAILABLE with an explanation.

# **8\. Product Navigation, Screens and Route Outline**

| Route / Section | Screen and Access |
| :---- | :---- |
| / | Public landing/marketplace home; search, modes and trust explanation |
| /explore | Search results, categories, Quick Sell and filter sheet; public |
| /feed | Listing-linked discovery feed; public view and member interactions |
| /listings/:slug | Public item detail, photo gallery, condition, defects, location, available modes and offer CTA |
| /login, /verify | Phone sign-in and OTP challenge, accessible public |
| /listings/new, /listings/:id/edit | Authenticated listing wizard and preview |
| /offers/new?listing=:id | Mode-aware structured offer composer; sign-in required |
| /offers, /offers/:id | Received/sent negotiations, immutable version history and action buttons |
| /messages, /messages/:id | Listing/offer-anchored conversations |
| /transactions/:id | Agreement snapshot, handover, confirmation, cancel/report and review route |
| /saved, /notifications | Saved items/posts and event inbox |
| /me, /me/listings, /settings | Profile, listing management, account and privacy controls |
| /support, /report/:type/:id | Safety guidance, reporting intake and case reference |
| /admin/\* | Separate permissioned operations console, not navigable from ordinary public UI |

Mobile navigation recommendation: Explore, Feed, List (+), Offers, Profile; messages and alerts available prominently from top bar and offer detail. Desktop may use top navigation and contextual side navigation. The UI/UX Design Brief specifies responsive layouts and all state variants.

# **9\. API Contract Outline and Event Integrity**

These are suggested resource contracts, not a framework decision. Use documented OpenAPI types, schema validation, stable error codes, cursor pagination and opaque IDs. All writes require authentication, relationship authorisation and appropriate anti-abuse limits; transaction-changing writes require idempotency.

| Method / Path Family | Purpose and Invariant |
| :---- | :---- |
| POST /auth/otp/request, /verify | Request and verify phone OTP; generic anti-enumeration responses; issue scoped session |
| GET /me, PATCH /me, POST /me/delete-request | Get/update self and start privacy handling; never return another member's phone |
| POST /items, GET /items/:id, PATCH /items/:id | Create/edit owned Item; offer-only item remains private except shared recipient context |
| POST /listings, PATCH /listings/:id, POST /listings/:id/close | Publish/update/close listing; validate modes, required disclosures and state |
| GET /listings, GET /listings/:id | Filter/paginate public ACTIVE listings and safe public detail; show unavailable record honestly |
| GET /feed, POST /feed-posts, POST /posts/:id/comments | Listing-linked feed \+ moderated comments and report control |
| POST /saves, DELETE /saves/:type/:id | Idempotent add/remove current member saves |
| POST /offers, GET /offers/:id, POST /offers/:id/counter | Create, read and version negotiation; version number/version ID required on counter |
| POST /offers/:id/accept, /reject, /withdraw | Accept atomic on expected\_version\_id \+ Idempotency-Key; 409 on stale/occupied |
| GET /transactions/:id, PATCH /transactions/:id/handover | Immutable agreement and private handover details for participants only |
| POST /transactions/:id/confirm, /cancel, /dispute | Separate self-attestation and dispute; no auto-refund or payment proof |
| POST /reviews, GET /users/:id/reviews | Eligibility based on COMPLETED transaction; user review count always available |
| GET /conversations, GET/POST /conversations/:id/messages | Private chat, membership ACL, optional moderated attachments |
| GET /notifications, POST /notifications/:id/read | In-app event inbox with safe deep links |
| POST /reports, GET /me/reports | Abuse intake and status of own case without exposing moderator notes |
| /admin/cases, /admin/content, /admin/transactions | RBAC, action reason, audit event and least-privilege data exposure |

## **9.1 API Error Conventions**

| Code / HTTP | UI Response |
| :---- | :---- |
| VALIDATION\_ERROR / 422 | Show per-field errors and preserve input; no raw stack trace. |
| AUTH\_REQUIRED / 401 | Persist safe draft locally where appropriate; take user through sign-in. |
| FORBIDDEN / 403 | Explain action unavailable; do not reveal another person's private object. |
| ITEM\_UNAVAILABLE / 409 | Tell user item is no longer available; preserve drafted offer and suggest discovery. |
| STALE\_OFFER\_VERSION / 409 | Fetch latest version; display difference before user resubmits. |
| OFFER\_EXPIRED / 410 | Offer no longer actionable; invite a new offer only if listing still ACTIVE. |
| RATE\_LIMITED / 429 | Neutral waiting time, human-safe retry; do not expose OTP status. |
| SERVER\_ERROR / 5xx | Clear retry path; do not falsely tell user acceptance failed if commitment uncertain. Read state first. |

## **9.2 Sample Offer Payload \- Implementation Interpretation**

POST /offers request (illustrative): target\_listing\_id, mode \= CASH | SWAP | SWAP\_PLUS\_CASH, offered\_item\_id \= null or owned Item ID, cash\_amount\_kobo \= integer, cash\_direction \= OFFERER\_PAYS\_OWNER | OWNER\_PAYS\_OFFERER | NONE, message \= short optional explanation. On CASH mode, cash\_direction is OFFERER\_PAYS\_OWNER and offered\_item\_id is null. On SWAP mode, cash\_amount\_kobo is zero and direction NONE. On SWAP\_PLUS\_CASH, require offered\_item\_id and a positive amount plus explicit payer direction. For swap with no money use SWAP. All public client amounts convert from naira input to kobo exactly.

# **10\. Architecture, Integration and Deployment Assumptions**

## **10.1 Recommended Logical Architecture (Stack-Agnostic)**

* Responsive mobile-first web application (PWA-capable, optional install), server-rendered public listing routes for shareability; separate admin route permission boundary.  
* Authenticated versioned API handling users, listings, offers, state transitions, transactions, content and reporting.  
* PostgreSQL or equivalent transactional relational database to enforce locks, reservations, referential integrity and immutable accepted snapshots.  
* Private object storage with CDN for optimised listing imagery; public safe variants plus signed URLs for private offer/item/chat evidence.  
* Queue/worker and transactional outbox for expiry, notifications, indexing, moderation scans and resilient processing.  
* SMS OTP provider with security limits; email or alternate notification provider if approved, never required for core handover state.  
* Observability: server logs, request IDs, exception reporting, basic metrics, incident alerts, audit store and access controls.  
* Admin analytics event pipeline (privacy-safe events) and relational operational metrics; avoid shipping raw chat contents to analytics.

## **10.2 Service Decisions Engineering Must Evaluate**

| Area | Options / Selection Test |
| :---- | :---- |
| Frontend | Next.js/React or maintainable equivalent; prioritise low-data UX, developer expertise, SEO and hosting cost. |
| API | NestJS/Node, Django/Python or equivalent; demonstrate correct transaction locking, validation and audit support. |
| Database | Managed PostgreSQL with backups, encryption and failover plan; avoid a nontransactional acceptance model. |
| Search | Pilot can use indexed relational full-text and structured filtering; specialist search engine only after evidence. |
| Background jobs | Durable queue and schedule for expirations and outbox retries; no unsafe in-request SMS dependencies. |
| Media | Direct-to-storage signed upload or gateway proxy, server-side content validation and EXIF stripping; documented cost limits. |
| Realtime | Polling or WebSockets for chat/offer updates; either must handle disconnected/reordered updates safely. |
| Hosting | Managed region and provider selected after Nigeria latency, cost, backup, privacy and incident-response review. |

## **10.3 Data Flow and Failure Recovery**

Client submits mutation \-\> API validates identity/permissions \-\> database transaction commits authoritative state \-\> transactional outbox emits event \-\> workers update notification, feed/search cache and metrics. If any downstream worker fails, retry with unique event ID; the committed transaction remains authoritative. Never rely on optimistic UI state to represent funds, legal title or completion. Data migrations must be versioned, reversible when practical and tested against snapshot integrity.

# **11\. Non-functional Requirements and Measurable Targets**

The following targets are proposed pilot acceptance objectives, not measured performance claims. Engineering should validate them against pilot usage, hosting cost and actual Nigerian network conditions.

| Attribute | Proposed Measurable Requirement / Method |
| :---- | :---- |
| Accessibility | Aim for WCAG 2.2 AA across critical journeys; keyboard operation, visible focus, semantic labels, error association, contrast and reduced motion; automated \+ manual review. |
| Mobile responsiveness | Support 320 px to 1440+ px; no horizontal scrolling on primary forms at 320 px; touch targets at least 44 x 44 px where practical. |
| Core Web Vitals | At p75 mobile real-user sessions: LCP \<= 2.5s, INP \<= 200ms, CLS \<= 0.1 under representative networks, excluding unavoidable third-party SMS delay. |
| API latency | Target p95 \< 700ms for normal reads and \< 1200ms for ordinary writes at pilot-level load, excluding external provider latency; accept path prioritises correctness. |
| Availability | Pilot service availability target 99.5% monthly after beta; monitor separately from SMS/notification provider failures. |
| Image performance | Responsive images, lazy-load below fold, compressed thumbnails; listing detail still useful with poor network/failed media. |
| Reliability | Automated daily database backups minimum with restore rehearsal; define RPO/RTO before launch with hosting owner. Retries cannot duplicate transactions. |
| Security | HTTPS/TLS everywhere, encryption at rest, salted passwordless sessions, secret rotation, CSRF/XSS/SQLi controls, rate limiting, anti-abuse and privileged audit. |
| Privacy | Privacy-by-design data minimisation; coarse public location, no public phone, short-lived private signed media, retention/deletion schedules approved by counsel. |
| Compatibility | Latest two releases of Chrome, Safari, Firefox and Edge in target environments; iOS Safari and Android Chrome physical-device testing. |
| Observability | Request tracing with IDs, logs without OTP/private phone/full messages, alerting on offer failure, failed jobs, queue backlog and sudden report rate. |
| Internationalisation | Initial English UI; Nigeria naira format and WAT time display; structured copy ready for later localisation. |
| Scaling | Demand-driven, not speculative: demonstrate controlled concurrent accept test at \>= 50 parallel attempts without double-reserve; load profile approved with engineers. |

# **12\. Trust, User Safety and Compliance Workstream**

The source proposal explicitly treats protected payments, identity verification, inspection guarantees and consumer obligations as later or unresolved workstreams. Product copy, terms and support scripts must not suggest that they already exist.

## **12.1 User-Facing Trust Disclosures**

| Surface | Required Copy Principle |
| :---- | :---- |
| Profile | "Phone confirmed" denotes possession of a phone number, not legal identity or ownership verification. |
| Item detail | Show defects, repairs, disclosed condition and photo count near the offer decision; encourage inspection. |
| Handover | "Inspect the items before exchanging. Payment is arranged directly between you and the other person. NextOwn does not hold or independently verify payment in this pilot." |
| Completion | "I confirm that I completed the exchange" is a self-report. Both participants must confirm separately. |
| Reporting | Clear report reasons, emergency/safety guidance without implying platform can recover funds or stolen goods. |

## **12.2 Safety and Legal Launch Gates**

* Obtain qualified Nigerian advice on the Data Protection Act and applicable NDPC requirements, consumer protection, prohibited goods, e-commerce disputes and content moderation.  
* Define privacy notice, terms, community guidelines, children/minor eligibility, account deletion requests, incident response, data retention and lawful disclosure processes.  
* Carry out threat modelling for OTP abuse, account takeover, duplicate item listing, stolen goods allegations, payment proof fraud, coercion, impersonation and moderation insider abuse.  
* Use least-privilege access and audited review for message and private handover information. Moderator access requires reason and appropriate case.  
* Determine actual local support contact, hours, response priority levels, law-enforcement escalation protocol and physical meeting safety guidance.  
* If payment or delivery partnerships are added later, perform a new legal, funds-flow and operational risk review before claiming protected transactions.

## **12.3 Proposed Operations Severity Tiers**

| Severity | Examples / action |
| :---- | :---- |
| S1 \- urgent safety | Credible threat, doxxing, coercion, reported stolen goods ring; immediate restriction/escalation per operating hours and safety protocol. |
| S2 \- active trade harm | Payment disagreement, misrepresented item at active handover, repeated fraud report; freeze automated closure and prompt support review. |
| S3 \- policy/content | Prohibited listing, spam, abuse, duplicate listing; triage and moderate with appeal route. |
| S4 \- ordinary help | How to list, edit/cancel, navigation confusion; knowledge base or support queue. |

# **13\. Measurement Plan and Event Contract**

## **13.1 Definitions that Prevent Misleading Pilot Numbers**

| Metric | Exact Proposed Calculation / Important Caveat |
| :---- | :---- |
| Quality listing rate | Published ACTIVE listings meeting photo, condition, location and necessary category disclosure checklist / listings submitted for publish. |
| Credible offer rate | Actionable offers meeting structured requirements and passing a manual/sampled spam-quality rubric / submitted offers. Avoid interpreting any lowball offer as credible. |
| Time to first credible offer | Median hours from published\_at to first rubric-qualified offer among listings receiving one; also publish % receiving none by 7 days. |
| Offer acceptance rate | Accepted negotiations / negotiations reaching decision, segmented CASH, SWAP, SWAP\_PLUS\_CASH and city/category. |
| Completion rate | COMPLETED / accepted transactions after a maturity window, excluding none from denominator except clearly disclosed cohorts; segment by mode. |
| Time to completion | Median time from acceptance to both confirmations among completed deals; separately report incomplete and unsold share. |
| 7/14/30-day liquidity | Listings that completed within the time window / eligible published listing cohort, by city and category. |
| Trust and cost | Cancelled, disputed and loss-reported transactions per 100 accepted; support minutes and variable operating cost per completed deal. |
| Feed contribution | Credible offers and completed transactions attributable to feed discovery / relevant feed sessions, alongside engagement. |
| Retention | % of first-time active traders who return to browse, list or make an offer by day 30, with definition of eligible cohorts. |

## **13.2 Required Product Event Taxonomy**

| Event Group | Events and Required Safe Dimensions |
| :---- | :---- |
| Onboarding | otp\_requested, otp\_verified, onboarding\_completed; method, city, validation\_error\_code (not phone/OTP) |
| Listings | listing\_draft\_started, listing\_published, listing\_edited, listing\_expired, listing\_closed, listing\_removed; category, city, condition, allowed\_modes, urgent |
| Discovery | search\_submitted, filter\_applied, listing\_viewed, feed\_post\_viewed, feed\_to\_listing\_opened, item\_saved; category, area, referral\_surface |
| Offers | offer\_submitted, offer\_countered, offer\_rejected, offer\_withdrawn, offer\_expired, offer\_accepted, offer\_unavailable; mode, turn, error\_code |
| Transactions | reservation\_created, handover\_scheduled, participant\_confirmed, transaction\_completed, transaction\_cancelled, dispute\_opened, dispute\_resolved; mode, age, reason |
| Trust | report\_submitted, moderation\_action, review\_created, support\_case\_closed; broad reason class, SLA bucket, no private evidence content |

Every event should contain immutable event\_id, occurred\_at UTC, anonymous/session or authorised user ID, entity ID, client platform, and experiment flag where appropriate. Use consent/legal-reviewed analytics, avoid raw phone numbers and chat content; warehouse rollups should not count event retries twice.

## **13.3 Pilot Scorecard and Candidate Hypotheses**

The founding team must set actual pass/fail thresholds after baseline recruitment estimates. Candidate hypotheses to evaluate: at least two active categories with credible supply; measurable offers within the first week of listing; accepted offers progressing to dual confirmation without intolerable support; enough feed-originated actionable offers to justify ongoing moderation cost. Do not put invented target percentages into an investor-facing commitment before experiments.

# **14\. Acceptance Tests and Negative Scenarios**

| Case | Given / When / Then Expected Behaviour |
| :---- | :---- |
| QA-01 | Given a guest viewing a listing, when they tap Make offer, then phone confirmation is prompted and intended listing is preserved. |
| QA-02 | Given two members in different pilot areas, when they filter, only selected area/category/mode active items are returned. |
| QA-03 | Given a swap listing, when offerer provides an item and OWNER\_PAYS\_OFFERER ₦50,000, both preview parties and cash direction explicitly. |
| QA-04 | Given a mixed offer, when recipient counters from ₦300,000 to ₦350,000, original terms remain in version history and only latest can be accepted. |
| QA-05 | Given two competing simultaneous accept requests for one item, exactly one succeeds and the other receives conflict/unavailable. |
| QA-06 | Given an offerer selected a swap item now reserved elsewhere, the server rejects submission even if the browser appears current. |
| QA-07 | Given a reservation, any new offer on target or offered item is blocked and stale feed CTA becomes unavailable. |
| QA-08 | Given a listing price edit after acceptance, transaction snapshot still shows the accepted historic amount and disclosures. |
| QA-09 | Given a 72-hour expired offer, acceptance fails consistently and status is EXPIRED after worker and request-level guard. |
| QA-10 | Given urgent deadline passes without acceptance, seller sees renew/revise/close and listing no longer shows urgent active. |
| QA-11 | Given one user confirmation only, transaction remains AWAITING\_HANDOVER and no review can be submitted. |
| QA-12 | Given both confirmations with no dispute, transaction completes once, records time and allows one review per party. |
| QA-13 | Given a contested handover, a dispute blocks automatic completion/release and places the case in support queue. |
| QA-14 | Given no confirmations and reservation expiry, items become available only through approved cancellation flow; no completion event. |
| QA-15 | Given one confirmation then reservation expiry, automated release is suspended pending support review. |
| QA-16 | Given an unauthorised user guesses offer/transaction IDs, all private details return 403/404 without leaking other party metadata. |
| QA-17 | Given malicious image metadata and executable content, public image exposes no GPS and upload is sanitised or rejected. |
| QA-18 | Given a blocked account, it cannot start a new message/offer with blocking member even by direct API call. |
| QA-19 | Given report of abusive comment, moderator can hide it, record reason, notify as policy allows and log action. |
| QA-20 | Given a cancelled deal, posting a rating fails, even if client retains an old completion-screen link. |
| QA-21 | Given notification retry or network timeout after offer acceptance, repeated idempotency key returns the original transaction. |
| QA-22 | Given Android device on reduced bandwidth, every required field, image alt/label and action remains usable without horizontal scroll. |

# **15\. Launch, QA and Operational Readiness Gates**

| Gate | Owner and Required Evidence |
| :---- | :---- |
| Product scope | Founding team signs pilot city, categories, role owners, scope freeze, success metrics and out-of-scope list. |
| Functional QA | Engineer \+ product verify QA-01 to QA-22; automated state machine/integration/concurrency tests pass. |
| UX and accessibility | Designer signs core mobile/desktop flows, readable financial directions, status errors, keyboard and screen-reader review. |
| Security and privacy | Security/privacy owners sign OTP anti-abuse, RBAC, logging, object security, backup restore, retention policy and legally reviewed notices. |
| Moderation | Trained operators test reports, account restrictions, contested handovers, appeal and sensitive-data access. |
| Support | Accessible contact channel, triage hours, safe exchange tips, knowledge base, playbooks and incident escalation. |
| Analytics | Event schema QA, duplicate prevention, internal scorecard and manual quality rubric prepared. |
| Operations | SMS provider limits/cost, storage/hosting forecast, backup drill, error alerts and environment secrets managed. |
| Pilot recruitment | Supply-side listing plan and buyer/community recruitment, with at least one category stocked before invitation. |

## **15.1 Suggested Six-Stage Execution Plan**

* Weeks 1-2: recruit pilot users, interview sellers/traders, sign decision register, prototype listing \> offer \> agreement, test usability.  
* Weeks 2-3: architecture, entity/state model, permission matrix, UI library, provider selection, data/privacy and moderation rules.  
* Weeks 3-6: parallel delivery of accounts, items/listings, discovery, feed and the offer/reservation engine with tests.  
* Weeks 6-8: transaction lifecycle, messaging, report queue, reviews, notifications, event tracking and integration QA.  
* Weeks 8-9: closed beta with invited users; run real local transactions and adverse case drills, adjust experience.  
* Weeks 9-10+: one-city controlled pilot, daily operating review and weekly evidence review; do not treat timeline as a fixed estimate until team capacity is agreed.

# **16\. Risks, Dependencies and Decision log**

| ID / Priority | Open Decision or Dependency | Proposed Owner / Deadline |
| :---- | :---- | :---- |
| D-01 / blocking | Launch city and invitation community; local meetup model and allowed areas | Founder \+ community lead / before design sign-off |
| D-02 / blocking | Initial categories, prohibited goods policy and device-condition fields | Product \+ safety / before listing engineering |
| D-03 / blocking | Pricing model: free pilot listings, no escrow; agree later monetisation experiments | Founder / before public messaging |
| D-04 / blocking | Transaction reserve lifetime, disputed-cancellation release authority and appeal rules | Product \+ legal \+ engineering / before state-machine implementation |
| D-05 / blocking | Data retention, privacy rights workflows, underage policy and cross-border processing | Privacy counsel / before beta |
| D-06 / blocking | SMS OTP vendor/costs, support hours, admin staffing and budget ceiling | Engineering \+ operations / before sprint commitment |
| D-07 / high | Role ownership, equity/engagement terms, IP assignment and decision rights among founding collaborators | Founder \+ collaborators \+ counsel / before substantial product work |
| D-08 / high | Are listing-linked posts and comments all included at pilot day 1, or behind controlled feature flags? | Founder \+ product / before sprint scoping |
| D-09 / high | Reservation extension, cancellation authorisation and evidence standards on a one-confirmation case | Product \+ safety / before UX handoff |
| D-10 / high | Logo identity, brand colours, trademark availability and ownership of www\.nextown.ng | Founder \+ designer \+ counsel / before marketing launch |
| D-11 / high | Pilot pass/fail thresholds and manual credibility rubric | Founder \+ growth \+ ops / before user recruitment |
| D-12 / medium | Whether QR/handover codes or waybill processes should be experimentally prototyped for later release | Product \+ engineering / after local pilot evidence |

## **16.1 Change Control**

Every new scope request requires feature ID, user problem, pilot proof, phase assignment (P0/P1/P2), dependencies, privacy/safety impact, UI impact, estimate and product-owner sign-off. Any change to an accepted-offer state transition requires a migration plan, concurrent test coverage and an updated support playbook. Product, design and engineering should jointly review any deviation that changes user expectations about cash, condition, identity or completion.

# **NextOwn Brand Kit \- Proposed System**

**Brand status**: recommended design direction, subject to founding team approval, accessibility testing, and logo/trademark clearance. The website address is founder-supplied and has not been independently verified. Apply these same tokens across product, website, design files, support templates and marketing.

| Role | Name | HEX | Usage |
| :---- | :---- | :---- | :---- |
| Core | NextOwn Ink | \#142D32 | Primary text, dark surfaces, logo |
| Core | Exchange Teal | \#0B6159 | Primary action, interactive links |
| Core | Teal Hover | \#084B46 | Hovered/pressed primary state |
| Accent | Warm Gold | \#F9BB55 | Highlights, moments of delight; never white text |
| Neutral | Cloud | \#F7F9F7 | Page background |
| Neutral | Paper | \#FFFFFF | Cards and overlays |
| Neutral | Mint Mist | \#E8F4EF | Info surface and low emphasis sections |
| Neutral | Slate | \#486067 | Secondary copy |
| Neutral | Border | \#D6E2DE | Dividers and input outlines |

## **Typography and UI basics**

| Use | Font / weight | Size / line height |
| :---- | :---- | :---- |
| Display / desktop | Inter Display / 700 | 40 / 48 px |
| H1 / mobile | Inter Display / 700 | 32 / 40 px |
| H2 | Inter Display / 650-700 | 26 / 34 px |
| H3 | Inter Display / 600 | 21 / 28 px |
| Body | Inter / 400 | 16 / 24 px |
| Body medium | Inter / 500 | 16 / 24 px |
| Compact | Inter / 400-600 | 14 / 21 px |
| Caption | Inter / 500 | 12 / 18 px |
| Button | Inter / 600 | 16 / 24 px |
| Price | Inter / 700 | 24 / 30 px |

**Typeface fallbacks**: Inter Display / Inter / system-ui / Segoe UI / sans-serif. Use 4, 8, 12, 16, 24, 32, 48 and 64 px spacing; card radius 16 px, control radius 12 px; minimum touch target 44 x 44 px; WCAG 2.2 AA design target. 

**Brand button**: Exchange Teal with white text; Warm Gold with Ink text only.

**Core identity**: NextOwn (capital N and O); wordmark and abstract N or handoff mark to be designed, not yet approved. Tone: practical, optimistic and transparent. Avoid claims of verified identity, escrow, guaranteed sales or protected payments in the pilot. Lead with authentic item images and clearly disclosed defects.

## **Status and Supporting Colours**

| Semantic | HEX | Use | Contrast against white |
| :---- | :---- | :---- | :---- |
| Success | \#147D52 | Success text/icons, never sole indicator | White 5.14:1 |
| Warning | \#9A5900 | Warning text/icons | White 5.52:1 |
| Danger | \#B42318 | Errors and destructive actions | White 6.57:1 |
| Information | \#2453A6 | Help and informational status | White 7.34:1 |

**Logo variations**: primary dark-on-light, reverse white-on-deep-teal, one-colour Ink. Minimum clear space is half the height of the initial N. Do not stretch, rotate, add gradients or use the icon in a way that resembles an identity-verified badge.

**Photo direction**: bright, authentic, well-lit, minimally edited user photographs; product condition is more important than aesthetic perfection. Show defects honestly, allow multiple angles, do not overlay prices into source images, and do not simulate photos of items for a real listing.

# **Appendix A. Requirement Traceability and Source Alignment**

| Source Proposal Location | Corresponding PRD Sections |
| :---- | :---- |
| Pages 2-3: modes, early users, offers and the MacBook/PS5 example | Sections 1-5, 6-7, core Item/Offer/Transaction logic |
| Pages 3-4: MVP scope and discovery feed | Sections 3, 5.1-5.8, 8 and companion UI/UX Brief |
| Page 5: data records, availability, snapshots and expiry | Sections 6-9, 14 race/acceptance QA |
| Page 6: trust, inspections and no protected payment in pilot | Sections 5.5-5.7, 12 and 15 |
| Pages 7-8: pilot strategy, metrics and roadmap | Sections 2-3, 13 and 15-16 |
| Page 9: collaboration, long-term concepts and decisions | Sections 3 and 16 |

**Companion delivery files**: NX-UX-001 UI/UX Design & Agent-Ready Template; NextOwn Brand Kit; NextOwn Design Tokens JSON; and paste-ready Agent Master Prompt. The PRD determines behaviour; the UI/UX Brief determines presentation and state communication. Where a discrepancy appears, resolve through the product owner and update both documents together.