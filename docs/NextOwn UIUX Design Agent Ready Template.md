**N E X T O W N  /  DESIGN HANDOFF**

**NextOwn**

# **UI/UX Design & Agent-Ready Template**

## *A production-oriented blueprint for flows, screens, states, design tokens, reusable components, content and clickable prototype delivery.*

*Turn what you own into what you want.*

| Brand: NextOwn     Website: www\.nextown.ngMarket: Nigeria     First release: responsive web pilotStatus: V0.9 | PROPOSED / FOR APPROVAL |
| :---- |

Prepared for product, engineering, design, research and operations teams.

# **Document Control and How to Use this Brief**

| Field | Specification |
| :---- | :---- |
| Document ID | NX-UX-001 | Revision 0.9 | 14 October 2026 |
| Product reference | NextOwn | www\.nextown.ng | Nigeria | one-city pilot (city pending) |
| Source of truth | NX-PRD-001: transaction rules, scope and permissions. This document: experience, layout and interaction implementation. |
| Design scope | Mobile-first responsive marketplace \+ essential admin experience; cover complete adverse scenarios. |
| Approval status | Design system, tokens and copy recommended for approval, not an existing registered or finalised identity. |

| CRITICAL CONSTRAINT  Do not invent escrow, verified item/authenticity badges, integrated payouts, waybill tracking, multi-item swaps or AI valuation in first-release screens. They are intentionally deferred. |
| :---- |

# **1\. Experience Thesis and Design Objectives**

NextOwn should feel like an optimistic yet reliable secondhand exchange community, not a bank, classifieds dumping ground or addictive short-video app. The central visual tension is discovery versus decision: the experience must be enjoyable to browse while making ownership, item condition, money direction and availability unusually clear.

| User Feeling / Principle | Designer Response | Do not Do |
| :---- | :---- | :---- |
| I can get value from things I already own | Express progress and possibilities; show Sell, Swap and Swap \+ Cash choices visibly | Default every interaction to paying full price |
| I need confidence before committing | Show defects, real photos, phone confirmation meaning, offer history and exact terms near CTA | Use generic "Verified seller" or "Protected payment" markers |
| I am using a phone and mobile data | Strong visual hierarchy, compressed images, short forms and progress save | Heavy autoplay video, enormous imagery or hidden essentials |
| I want agency and fairness | Explicit cash payer, reject/counter options, visible time limits and reversible drafts | Default consent, fake urgency or emotional countdown tricks |
| This is local and practical | City/area filters, safety guidance, meeting arrangements in private workflow | Publish exact home address or require always-on geolocation |
| I should know what happens next | Process progress, honest pending states and failure recovery | Promote one-person confirmation to completed |

## 

## **1.1 User Contexts and Psychological Design Cues**

* **Scarcity**: used items are singular; show true availability and deadlines, not artificial low-stock pressure or exaggerated savings.  
* **Loss aversion**: explain precisely what the trader gives and receives; put the payer of any top-up in everyday language.  
* **Trust formation**: factual evidence outranks badges; bring real condition photos, disclosed repairs, review sample size and accountability into the decision area.  
* **Choice architecture**: keep the primary action prominent, reveal one decision at a time, and never hide a cheaper cash/swap option to steer users.  
* **Progress and reciprocity**: show received offers promptly, polite counteroffer affordances and a complete conversation history without pressuring agreement.  
* **Cognitive load**: use familiar marketplace patterns and progressive disclosure for technical electronics fields; preserve state when a user leaves a multi-step form.  
* **Control and privacy**: explicit location granularity, private offered-item records and clear notification choices.  
* **Social exploration**: feed interaction should move toward an eligible listing and structured offer, not turn comments into an unofficial deal record.

# **2\. Brand System and Visual Foundations**

**Proposed positioning**: NextOwn helps individuals make their next move with what they already have.

**Brand archetype**: helpful, credible, practical, optimistic, contemporary Nigerian. 

**Emotional promise**: opportunity without unnecessary spending. 

**Functional promise**: straightforward listings and clear negotiations, not guaranteed outcomes. This identity must be validated with the founding team before public launch.

# **NextOwn Brand Kit \- Proposed System**

**Brand status**: recommended design direction, subject to founder approval, accessibility testing, and logo/trademark clearance. The website address is founder-supplied and has not been independently verified. Apply these same tokens across product, website, design files, support templates and marketing.

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

## **Typography and UI Basics**

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

**Core identity**: NextOwn (capital N and O); wordmark and abstract N or handoff mark to be designed, not yet approved. 

**Tone**: practical, optimistic and transparent. Avoid claims of verified identity, escrow, guaranteed sales or protected payments in the pilot. Lead with authentic item images and clearly disclosed defects.

## **Status and Supporting Colours**

| Semantic | HEX | Use | Contrast against white |
| :---- | :---- | :---- | :---- |
| Success | \#147D52 | Success text/icons, never sole indicator | White 5.14:1 |
| Warning | \#9A5900 | Warning text/icons | White 5.52:1 |
| Danger | \#B42318 | Errors and destructive actions | White 6.57:1 |
| Information | \#2453A6 | Help and informational status | White 7.34:1 |

**Logo variations**: primary dark-on-light, reverse white-on-deep-teal, one-colour Ink. Minimum clear space is half the height of the initial N. Do not stretch, rotate, add gradients or use the icon in a way that resembles an identity-verified badge.

**Photo direction**: bright, authentic, well-lit, minimally edited user photographs; product condition is more important than aesthetic perfection. Show defects honestly, allow multiple angles, do not overlay prices into source images, and do not simulate photos of items for a real listing.

## **2.1 Visual Language and Layout**

| Foundation | Responsive Rule |
| :---- | :---- |
| Canvas | Cloud \#F7F9F7 background; white cards; large readable image blocks and Ink copy. Reserve Gold for controlled highlights. |
| Grid | Mobile: 4 columns, 16 px margins and 12 px gutters; tablet: 8 columns, 24 px margins; desktop: 12 columns within 1200 px max width and 24 px gutters. |
| Breakpoints | 320-767 mobile; 768-1023 tablet; 1024-1439 desktop; 1440+ wide. Design 390x844 and 1440x900 reference artboards plus 320 px check. |
| Elevation | Card shadow 0 2px 12px rgba(20,45,50,.06); overlay shadow 0 14px 36px rgba(20,45,50,.18). Prefer border over raised cards. |
| Controls | Button/input minimum height 48 px, radius 12 px, minimum target 44 x 44 px; full-width high-value mobile CTAs where possible. |
| Media | Item cards 4:3 or 1:1 crop from real images with object-fit cover; gallery supports full image, defects and thumbnails; no filters that conceal damage. |
| Icons | Single 20-24 px rounded-line icon family such as Lucide; accompany icons with labels for critical actions and statuses. |
| Motion | 120 ms feedback, 200 ms standard transitions, \<= 320 ms overlays, respect prefers-reduced-motion and avoid animated urgency timers. |
| Pricing | Render ₦ with grouping: ₦250,000. Use tabular figures, no truncation and visually distinct text for payer and recipient. |
| Accessibility | WCAG 2.2 AA design target, body 16 px, 4.5:1 normal text contrast, 3:1 large text/nontext minimum where applicable, visible focus. |

## **2.2 Logo, Icon and Launch Assets to Request from Brand Designer**

* Original wordmark "NextOwn" (capital N and O) in a sturdy modern geometric treatment, with a subtle handoff or forward-progress cue; avoid clichéd shopping trolley or cash/crypto imagery.  
* **App mark**: recognisable abstract N formed by two connected directional shapes; test at 16, 32 and 192 px. The initial mark is a design exploration, not an approved logo.  
* **Lockups**: horizontal wordmark, stacked optional, symbol only, light and dark variations, monochrome. Deliver SVG and PNG renditions after founder review.  
* **Icon/favicon targets**: 16, 32, 48, 192 and 512 px, plus a 1200 x 630 social share preview with real item photography.  
* **Clear-space rule**: at least 0.5 times cap height around all lockups; do not distort, glow, skew or use the mark as a verification badge.

# 

# **3\. Content Structure and Information Architecture**

## **3.1 Global Navigation**

| Platform Area | Primary / Secondary Navigation |
| :---- | :---- |
| Public web top | NextOwn logo | Search | Explore | Feed | How it works | Sign in | List an item |
| Mobile persistent | Explore | Feed | List (+) | Offers | Profile; bell \+ chat icons surfaced in header with labels for screen readers |
| Explore subsection | For Sale | Open to Swap | Quick Sell | Categories | Area filter (can overlap via filters; not different inventory) |
| Member profile | My Listings | Sent/Received Offers | Transactions | Saved | Reviews | Account & Privacy | Help |
| Admin console | Overview | Reports | Listings | Transactions | Members | Moderation log | Settings; permission-dependent |
| Global support | Accessible report, safety guide and terms/privacy links in contexts where needed; avoid safety links hidden only in footer |

## **3.2 Global State Vocabulary**

| User-facing label | Underlying meaning |
| :---- | :---- |
| Available | Listing ACTIVE and underlying item not reserved |
| Quick Sell · Ends in 18h | True deadline on ACTIVE listing; use clear absolute date too on detail |
| Offer sent | Pending latest actionable version |
| Counteroffer received | New immutable version requiring decision |
| Reserved | Accepted deal holds the involved item(s); other offers unavailable |
| Awaiting handover | Agreement created; both people still need to inspect/exchange and separately confirm |
| Your confirmation received | One party confirmed; platform is waiting for other participant |
| Completed | Both confirmations recorded without open dispute; not bank verification |
| Under review | Open dispute or moderation investigation; no assumption of blame |
| Expired / Closed | Time elapsed or owner closed; not available for new offers |

## **3.3 Core Task Flow Overview**

| Flow ID | Screens and Transition Sequence |
| :---- | :---- |
| F-01 Cash purchase | Explore/Feed \-\> Listing \-\> Choose cash \-\> Amount \-\> Review terms \-\> Send \-\> Seller acts \-\> Accepted \-\> Handover \-\> Two confirmations \-\> Review |
| F-02 Swap | Listing \-\> Swap \-\> Choose owned item or add offer-only item \-\> Preview both items \-\> Send \-\> Counter/accept \-\> Reserve both \-\> Inspect \-\> Confirm |
| F-03 Swap plus cash | Listing \-\> Swap+cash \-\> Offered item \-\> Choose who adds cash \-\> Amount \-\> Two-sided summary \-\> Send \-\> Version history \-\> Accept \-\> Handover |
| F-04 Quick Sell | Profile \-\> Create listing \-\> Mode \-\> Urgency \+ deadline \-\> Preview \-\> Publish \-\> Urgent Explore \-\> Offer or expiry \-\> Renew/revise/close |
| F-05 Social to trade | Feed \-\> Read caption/comments \-\> Open linked canonical listing \-\> Offer composer; disabled if no longer available |
| F-06 Support failure | Accepted transaction \-\> One confirms, other contests \-\> Report/dispute \-\> Status under review \-\> Moderator outcome \-\> Respect true record |
| F-07 Listing lifecycle | Start draft \-\> Add photos/condition \-\> Mode and location \-\> Preview \-\> Publish \-\> Edit/close \-\> Reservation or expiry |
| F-08 Reputation | Both confirmed \-\> Review eligibility \-\> One rating \+ optional detail \-\> Aggregate visible with count |

# **4\. Screen Inventory and Production Priorities**

| Group | IDs and Required Screens |
| :---- | :---- |
| Entry and exploration | UX-01 Home; UX-02 Explore; UX-03 Filter drawer; UX-04 Listing details; UX-05 Discovery Feed; UX-06 Post/comments detail |
| Onboarding and listing | UX-07 Phone auth; UX-08 Code confirmation; UX-09 Onboarding; UX-10 Listing wizard media/details; UX-11 Condition; UX-12 Modes/urgency; UX-13 Preview/manage |
| Negotiation and messages | UX-14 Choose offer mode; UX-15 Cash offer; UX-16 Swap item/select/create; UX-17 Mixed cash direction; UX-18 Offer confirmation; UX-19 Offers inbox/history; UX-20 Conversation |
| Agreement and trust | UX-21 Agreement/handover; UX-22 Confirm exchange; UX-23 Resolution/report; UX-24 Review/receipt |
| Member and operations | UX-25 Profile/listings; UX-26 Saved/alerts/settings; UX-27 Admin moderation queue; UX-28 Admin case/transaction detail |

**P0 screens**: UX-01 through UX-28 are included in design scope. UX-06 comments can be an accessible in-place sheet rather than a separate route, but comments remain in the pilot as required by DSC-04. Avoid a standalone full social-post studio; feed posts attach to an existing canonical listing.

# **5\. Screens: Entry, Exploration and Discovery**

### **UX-01 | Public Home**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make the value of cash sales and swaps understandable within seconds, while offering a direct search route. |
| Above-fold layout | Header logo/search/location picker; hero headline "Find your next thing"; Sell / Swap / Quick Sell chips; visible search field; selected categories; recent local listings; trust/how-it-works strip; footer. |
| Primary action | Explore items / List an item |
| Mandatory states | First visit; unknown area; empty city inventory; loading; guest CTA; offline banner. |
| Rules and trust detail | Do not show invented sales volume or fake trust badges. Locality shown as selected pilot area, not auto-located home. |
| Responsive / handoff | 390 px: vertical search and cards; desktop: two-column hero and multi-column item grid. |

### **UX-02 | Explore and Search Results**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Let a user find a relevant, actually available item efficiently. |
| Above-fold layout | Search with suggestions, category row, active chips, sort, 2-up cards mobile (switch 1-up for large accessibility setting); desktop filter sidebar and 3-4 cards per row. |
| Primary action | Open listing / Clear filters |
| Mandatory states | No results; loading skeleton; stale item; error/retry; selected multiple modes; long text; empty saved. |
| Rules and trust detail | Each card shows photo, title, price or swap-only label, area, condition and true urgent status; never exaggerate availability. |
| Responsive / handoff | 320 px supports one or two cards with unclipped ₦ amounts and 44 px filter target. |

### **UX-03 | Filter Drawer / Sort**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Refine without making the user start search again. |
| Above-fold layout | Bottom sheet mobile; sidebar desktop. Area, category, transaction mode, price min/max for sale, urgent-only, condition, sort recent. Selected count and reset. |
| Primary action | Show results (count) / Reset |
| Mandatory states | No-result preview, empty price, min \> max, unsaved modifications, accessible sheet close. |
| Rules and trust detail | Disable irrelevant price for swap-only mode or explain logic; keep controls keyboard accessible and selection persistent. |
| Responsive / handoff | Mobile full-width sheet, scrollable contents with pinned actions; desktop sticky rail. |

### **UX-04 | Listing Details**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Give sufficient evidence to decide whether and how to make a formal offer. |
| Above-fold layout | Image gallery \-\> status/location \-\> title/asking price \-\> allowed modes \-\> seller phone-confirmed label \+ review count \-\> condition and defects \-\> repairs/accessories \-\> desired swap \-\> report/safety. |
| Primary action | Make an offer / Save |
| Mandatory states | Available; Reserved; Expired; Removed; price hidden for swap-only; images fail; own listing; guest user. |
| Rules and trust detail | Above CTA disclose defects. Show "Cash offers" and/or "Open to swap" chips; hide exact address; explain phone confirmation accurately. |
| Responsive / handoff | Mobile sticky CTA at bottom without covering info; desktop media-left plus sticky right offer panel. |

### **UX-05 | Discovery Feed**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Support fun, serendipitous local discovery linked to actionable canonical listings. |
| Above-fold layout | Vertical cards with real item image, user avatar/display name, short caption, area, transaction chips, Save, Comments and View item actions; optional Quick Sell label. |
| Primary action | View item / Make an offer from eligible post |
| Mandatory states | Deleted or reserved listing; comment error; no feed content; moderation removal; loading pagination. |
| Rules and trust detail | Do not maintain separate inventory price in post. Feed should mix recent available local posts, not only popular or promoted content. |
| Responsive / handoff | Mobile comfortable card stream; desktop central feed column with contextual categories and suggested listings. |

### **UX-06 | Post and Comments**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Let users ask questions without mistaking comments for negotiated terms. |
| Above-fold layout | Item-linked caption and photo, comments ordered by recency, clear report/block, comment composer, full listing CTA. |
| Primary action | View listing / Post comment |
| Mandatory states | Guest prompt; comment flagged/removed; too many requests; listing no longer available. |
| Rules and trust detail | Copy: "To make an offer, use Make an offer. Agreements made in comments are not tracked." |
| Responsive / handoff | Can be an accessible modal/bottom sheet at P0; standalone route optional. |

# **6\. Screens: Onboarding, Listing and Item Management**

### **UX-07 | Phone Entry**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Offer low-friction account access with honest safety messaging. |
| Above-fold layout | Logo; one-line benefit; \+234 selector/normalised number entry; privacy summary; Continue; Terms/Privacy; sign-in link handled by same flow. |
| Primary action | Send code |
| Mandatory states | Invalid number; unsupported country; rate limited; network error; existing account. |
| Rules and trust detail | Never say "Identity verification". Show why phone is needed: account security and transaction messages. |
| Responsive / handoff | One column, large input, numeric keyboard; page fits 320 px. |

### **UX-08 | Confirm Phone Code**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Establish phone possession without overpromising identity verification. |
| Above-fold layout | Six-digit code segmented or single accessible field; resend timer; edit phone; success state; help link. |
| Primary action | Confirm phone |
| Mandatory states | Wrong/expired code; too many attempts; pending delivery; fallback contact. |
| Rules and trust detail | Use clear 60-second resend guidance from proposed default; do not reveal if a phone belongs to another account. |
| Responsive / handoff | Auto-focus cautiously; paste accepted; screen reader describes complete input; no forced auto-submit. |

### **UX-09 | First-time Setup**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Set coarse location and optional interests without slowing first transaction. |
| Above-fold layout | Progress step 1/2; display name; pilot city/area selector; optional interest chips (phones, laptops, gaming, home); review privacy note. |
| Primary action | Continue to marketplace |
| Mandatory states | Unknown area; user skips interests; account blocked; edit name. |
| Rules and trust detail | Ask city/area, not home address. Consent and eligibility confirmation are clear, not bundled with marketing consent. |
| Responsive / handoff | Progressive form; desktop medium-width centred panel. |

### **UX-10 | Create Listing: Item Basics**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make it easy to capture a truthful, useful item record. |
| Above-fold layout | 3 or 4-step wizard header; category; title; 1-8 photo uploader with ordering/cover selection; brand/model fields; Save draft; Back. |
| Primary action | Continue to condition |
| Mandatory states | Photo upload pending/failure; wrong format; no photos; duplicate hint; abandon draft; poor connection. |
| Rules and trust detail | Show photo tips: daylight, all sides, current condition, defects. Do not use generative mock photos for real goods. |
| Responsive / handoff | One task group per screen, sticky Continue, upload progress and compressed preview. |

### **UX-11 | Create Listing: Condition**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Reduce uncertainty and disputed expectations. |
| Above-fold layout | Condition selector Like New / Good / Fair / For Parts; defects text; repair history; included accessories; ownership check; contextual examples. |
| Primary action | Continue to trade options |
| Mandatory states | Missing defect disclosure; user selects Not sure where allowed; repairs text too long; safety flag. |
| Rules and trust detail | Do not let attractive visuals outweigh defects. Provide editable review of condition on confirmation screen. |
| Responsive / handoff | Inline explanatory help text, not hidden solely in tooltip. |

### **UX-12 | Create Listing: Mode and Urgency**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Capture what owner wants and whether urgency is genuine. |
| Above-fold layout | Sell / Swap / Both segmented choice; conditional asking price; desired item or "Open to offers"; city/area; Quick Sell toggle with real deadline. |
| Primary action | Preview listing |
| Mandatory states | Negative/invalid price; swap-only with no desired item; urgent expiry invalid; duplicate active item. |
| Rules and trust detail | Copy: "Quick Sell highlights your deadline. It does not guarantee a buyer." Setting urgency never changes safety requirements. |
| Responsive / handoff | Conditional fields do not shift focus unexpectedly; keyboard and screen-reader help. |

### **UX-13 | Preview, Publish and My Listings**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make publishing a deliberate commitment and provide easy post-publication management. |
| Above-fold layout | Full card preview with photos/defects/modes, public location, edit per section, Publish button. My Listings tabs Draft / Active / Reserved / Expired / Closed. |
| Primary action | Publish listing / Manage listing |
| Mandatory states | Moderation review; successful publish; editing; closing; expiration; stale draft; post-publish confirmation. |
| Rules and trust detail | Explain "Phone confirmed" label, public visibility and ability to close. Edits cannot change existing accepted deal terms. |
| Responsive / handoff | Mobile preview is identical to real detail structure; desktop manage table/cards as appropriate. |

# **7\. Screens: Offers, Negotiation and Chat**

### **UX-14 | Choose Offer Type**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Show only permitted routes, without assuming cash always comes from buyer. |
| Above-fold layout | Listing summary at top; tiles: Cash offer, Swap an item, Swap \+ cash (only available combinations); contextual cost explanation. |
| Primary action | Continue with selected option |
| Mandatory states | Swap blocked by seller mode; own listing; item becomes reserved; user not confirmed. |
| Rules and trust detail | A swipe/comment is never an offer. Create structured version when submitted, not when user previews. |
| Responsive / handoff | Single-select tiles with label, sample terms, and accessible focus/selected state. |

### **UX-15 | Cash Offer Composer**

| Element | Design specification |
| :---- | :---- |
| Job to be done | Let offerer present clear payment amount on cash-accepting listing. |
| Above-fold layout | Pinned target listing title/cover photo; visible asking price; Enter offer ₦ amount; optional note; summary "You would pay ₦X to receive \[item\]". |
| Primary action | Review cash offer |
| Mandatory states | Invalid price; zero/negative; seller no longer accepts cash; market network error; preserved draft. |
| Rules and trust detail | The default direction is OFFERER\_PAYS\_OWNER, no payer-direction toggle on cash-only offers. Payment takes place outside platform. |
| Responsive / handoff | Numeric keypad, grouping and explicit currency label; no floating-point errors. |

### **UX-16 | Select or Create Swap Item**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Allow a person without a published listing to offer a possession safely. |
| Above-fold layout | Step 1 select one eligible owned Item (active or offer-only); step 2 inline Add an item: photo, title, condition, defects, repairs and ownership statement; privacy label. |
| Primary action | Use this item |
| Mandatory states | No owned items; selected item reserved; image upload error; unshared item; item category mismatch. |
| Rules and trust detail | An offer-only item is private to intended negotiation, not publicly searchable. Only one offered item in pilot. |
| Responsive / handoff | Compact item card selection; reduce friction by reusing validated photos/details. |

### **UX-17 | Swap Plus Cash: Payer Direction**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make the direction and value of money unambiguous before submission. |
| Above-fold layout | Two item cards "You give" and "You receive"; clear radio buttons "I add cash" / "I receive cash"; amount in ₦; dynamic sentence under field. |
| Primary action | Review swap \+ cash |
| Mandatory states | Cash amount zero (suggest pure Swap); direction not selected; counter switched direction; invalid money; stale item. |
| Rules and trust detail | Preview: "You offer your PS5 and pay ₦300,000. They give you the MacBook." Or "They give you the laptop and pay you ₦50,000." |
| Responsive / handoff | Do not imply NextOwn collects funds. Avoid \+/- money notation as the only cue. |

### **UX-18 | Review and Send Offer**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Prevent accidental trade terms and leave durable evidence. |
| Above-fold layout | Side-by-side item summary on desktop, stacked on mobile; payer statement in bold; defects links; deadline; "This is an offer, not a completed transaction"; optional note. |
| Primary action | Send offer |
| Mandatory states | Submitting, retry-safe timeout, success, item unavailable, stale listing, unauthorised; ask for refresh. |
| Rules and trust detail | Show NextOwn does not hold or verify payment in local pilot. Success navigates to versioned offer thread. |
| Responsive / handoff | Action remains disabled on submission; if uncertain after timeout fetch canonical offer before trying again. |

### **UX-19 | Offers Inbox and Version History**

| Element | Design specification |
| :---- | :---- |
| Job to be done | Let both people compare exact offer versions and understand whose action is next. |
| Above-fold layout | Tabs Received / Sent / Awaiting handover / Closed; offer cards with photos \+ current mode \+ action needed. Thread has immutable version timeline, currency payer and counter field. |
| Primary action | Accept / Counter / Reject / Withdraw as role permits |
| Mandatory states | Expired offer; superseded version; reserved item; unread; accepted; no offers; stale notification; blocked account. |
| Rules and trust detail | Show full accepted terms before acceptance and revalidation after click. Historical versions viewable read-only, not actionable. |
| Responsive / handoff | Desktop split inbox+detail; mobile list \-\> detail with persistent decision bar. |

### **UX-20 | Messages Linked to Listing/Offer**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Allow practical questions and logistics while discouraging untracked side agreements. |
| Above-fold layout | Conversation header with item/transaction context and report/block; time-stamped bubbles; offers as structured cards; composer; connection state. |
| Primary action | Send message / Open formal offer |
| Mandatory states | Disconnected; failed send; moderated message; blocked partner; transaction completed/cancelled; chat support flag. |
| Rules and trust detail | Persistent notice: "Accept or counter through an offer card so the agreed terms are recorded." Private handover location belongs to accepted transaction. |
| Responsive / handoff | Keyboard-resilient composer, text scaling, accessible live-region announcement; no exposure of private phone. |

# **8\. Screens: Agreement, Completion, Trust and Reputation**

### **UX-21 | Agreed Transaction and Handover**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Turn acceptance into a clear real-world action plan. |
| Above-fold layout | Header "Offer accepted"; transaction ID/status; snapshot of both items, defects and exactly who pays cash; progress Check terms \> Arrange meeting \> Inspect \> Both confirm. Private meeting section \+ chat link. |
| Primary action | Set meeting details / Confirm after exchange |
| Mandatory states | One party unavailable; scheduled/rescheduled; expired reservation; cancellation request; open dispute; poor connectivity. |
| Rules and trust detail | Never say payment is protected. Show safe-meetup tips and "Cash is handled directly between participants; NextOwn cannot reverse external transfers." |
| Responsive / handoff | Mobile accordion sections, sticky status/next action; desktop structured two-column review. |

### **UX-22 | Independent Handover Confirmation**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Collect a meaningful self-attestation without coercion or accidental completion. |
| Above-fold layout | Distinct checkboxes: inspected received item, exchanged item where swap, handled agreed cash as personally observed (if relevant); statement of self-report; confirmation button; other-user status. |
| Primary action | Confirm my side |
| Mandatory states | Single confirmation pending; double tap; missing checks; one user disputes; confirmation after cancelled; delayed API. |
| Rules and trust detail | Both parties must confirm independently. Do not surface a fake "verified payment" shield, even if user ticks money checkbox. |
| Responsive / handoff | Use neutral waiting state; avoid celebratory success until both confirmations are recorded. |

### **UX-23 | Dispute, Cancellation and Report**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Give a user a safe off-ramp and explain realistic support limits. |
| Above-fold layout | Choose concern (condition mismatch, no-show, payment disagreement, intimidation/unsafe meeting, other), describe, optionally attach evidence, urgent support text, case number after submit. |
| Primary action | Submit report / Request cancellation |
| Mandatory states | Cancellation requested; disputed; evidence upload fail; already reported; report about blocked user; timeout. |
| Rules and trust detail | NextOwn cannot recover or reverse external payments. Never auto-release partially confirmed inventory before support review. |
| Responsive / handoff | Prioritise readability, no victim-blaming wording, clear case reference and follow-up path. |

### **UX-24 | Transaction Result and Review**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Close the exchange with clarity and feedback only after eligible completion. |
| Above-fold layout | Receipt with accepted terms, two confirmation timestamps and status, factual completion language; Review other person: 1-5 stars, optional note; review count on profile. |
| Primary action | Submit review / View history |
| Mandatory states | Incomplete; cancelled; disputed; review posted; rating error; re-open safety report route. |
| Rules and trust detail | Reviews unlocked only after COMPLETED. Do not imply a payment processor certified the cash. |
| Responsive / handoff | Shareable snapshot excludes exact private location and contact unless explicitly permitted. |

# **9\. Screens: Member and Support Operations**

### **UX-25 | Profile and My Listings**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Build accountable reputation and keep personal inventory manageable. |
| Above-fold layout | Display name/avatar, "Phone confirmed", transaction-linked reviews count, city/area; sections Listings (Draft/Active/Reserved/etc), Offers, Transaction history, Help. |
| Primary action | Create new listing / Manage listing |
| Mandatory states | No reviews; new user; restricted account; no listings; reserved listing; edit while accepted deal. |
| Rules and trust detail | No public raw phone or exact address; do not turn review average with one review into false long-term trust. |
| Responsive / handoff | Mobile segmented tabs; desktop profile sidebar and content panel. |

### **UX-26 | Saved, Alerts, Settings**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make retrieval and user control easy. |
| Above-fold layout | Saved Listings / Saved Posts; notification inbox with unread count and contextual deep links; settings for area, interests, alerts, privacy, account help. |
| Primary action | Open saved item / Mark alerts read |
| Mandatory states | Saved item expired; no alerts; notification references deleted content; network state. |
| Rules and trust detail | Essential transaction/security notifications distinct from promotional preferences; plain account deletion request route. |
| Responsive / handoff | Modal confirmations for destructive settings; desktop grouped settings panel. |

### **UX-27 | Admin Moderation Queue**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Enable safety intervention without exposing more private data than necessary. |
| Above-fold layout | Filters by status/severity/type/age; report cards with assigned operator, affected content, policy flag, time and priority; bulk read-only actions, no unlogged bulk ban. |
| Primary action | Open case / Assign / Apply permitted action |
| Mandatory states | Backlog; unassigned; duplicate reports; role forbidden; conflicting moderator update; redacted content. |
| Rules and trust detail | Reason code mandatory; sensitive message access only in authorised case context. Show audit entry after action. |
| Responsive / handoff | Desktop-first with usable tablet support; permission-based admin navigation. |

### **UX-28 | Admin Case and Transaction Detail**

| Element | Design Specification |
| :---- | :---- |
| Job to be done | Make facts, self-attestations and actions independently inspectable. |
| Above-fold layout | Case summary, parties masked as needed, agreement snapshot, immutable offer-version timeline, separate confirmation events, evidence access panel, staff notes, resolution workflow, audit log. |
| Primary action | Record action / Escalate / Close case |
| Mandatory states | Partial confirmation expired; evidence missing; cancellation disputed; repeat offender; staff permission denied. |
| Rules and trust detail | Never create fake second-party confirmation. Administrative case resolution is distinct from participant-confirmed completion. |
| Responsive / handoff | Desktop dense-data layout with clear hierarchy and no full-table overflow. |

# **10\. Interaction Patterns and Reusable Component Library**

| Component / variant set | Specification and State Coverage |
| :---- | :---- |
| Navigation / Header | Public vs member vs admin; scroll state; mobile safe-area; focus navigation and accessible menu labels. |
| NextOwn Button | Primary filled Teal; secondary Teal outline; tertiary text; danger text/red confirm. Default/hover/focus/disabled/loading; no red CTA for ordinary urgency. |
| Listing Card | Image, condition, title, price or swap label, city/area, mode chips, urgency true timer; skeleton/unavailable/featured states. |
| Status Badge | Available, Reserved, Offer pending, Quick Sell, Expired, Completed, Under review, Phone confirmed. Color \+ text/icon. |
| Mode Selector | Cash / Swap / Swap \+ Cash eligibility from Listing.allowed\_modes; keyboard radio semantics. |
| Offer Comparison | You give / You receive, item photos, condition notes, cash amount \+ payer direction, timestamp and version. |
| Currency Field | NGN label, input validation, grouping on blur, clear errors, integer kobo transform; precise voiceover. |
| Photo Uploader | 1-8 photos, progress, fail/retry, reorder, cover photo, remove, upload caps, condition prompt. |
| Form Field | Label, hint, placeholder example, error and success; required marker; character count only when meaningful. |
| Category and Area Picker | Searchable controls, empty states, selected chip, nested areas and no home-address request. |
| Filter Sheet | Mobile bottom sheet / desktop rail with apply/reset, badge count and validation. |
| Activity Timeline | Offer version created/countered, acceptance, reservation, meeting, two confirmations, support decision. |
| Conversation Card | Seller/buyer identities, listing, timestamp, structured offer event; no cash data copied only into raw chat. |
| Trust Module | Phone confirmed, reviews with counts, inspection reminder and precise limits; not a composite trust score. |
| Alert/Toast | Neutral success, error, warning and informational; clear persistent alternative for critical failures. |
| Confirmation Modal | Destructive close/cancel, send final terms, consent; explicit actor, object and consequence. |
| Empty State | Search none, zero offers, zero saved, no comments, no local listings; actionable next step, no forced engagement. |
| Error State | Network retry, conflict/409, stale version, 429 throttled, blocked/report; preserve safe draft and context. |
| Progress Stepper | Listing wizard and handover, actual status markers and accessible descriptions; no fake progress. |
| Review Module | Count \+ distribution when enough data, one star selection at a time, only completed-transaction eligibility. |
| Admin Data Table | Search, sort, permission, bulk select restricted, responsive overflow and clear action audit trail. |
| Support Case Panel | Reasons, severity, actors, evidence, resolution, due date and role-based access. |

## **10.1 Component Naming and Figma Variants**

Examples: Component/Button/Primary \[State=Default|Hover|Focus|Disabled|Loading, Size=M|L\]; Component/Card/Listing \[State=Available|Reserved|Expired, Mode=Cash|Swap|Both, Featured=False|True\]; Component/Offer/Summary \[Mode=Cash|Swap|Mixed, Direction=UserPays|OtherPays|None\]; Component/Status/Badge \[Status=...\]; Component/Field/Money \[State=...\]. Use variables and semantic colour tokens rather than individually editing swatches in screens.

## **10.2 Accessibility Interaction Checklist**

* Every primary action is keyboard reachable in logical order, including option chips, sheets, offers and handover checkboxes.  
* Modal/dialog focus enters overlay and returns to trigger on close; no trapped focus except correctly implemented active dialog.  
* Use accessible names, programmatic error association, error summary after submit and live region for status changes.  
* Ensure text reflows at 200% zoom, 320 px, and browser text enlargement without clipping monetary terms.  
* Colour never exclusively conveys danger, urgency or reservation. Avoid time-based controls without enough reading/decision time.  
* Test forms and tab flows with screen reader and a physical low-bandwidth Android phone; respect reduced motion.

# **11\. UX Microcopy Reference and Trust Language**

| Situation | Recommended Interface Copy |
| :---- | :---- |
| Marketing headline | Find your next thing. Turn what you own into what you want. |
| Primary modes | Sell it. Swap it. Add cash if you need to. |
| New listing helper | Use photos of the actual item. Include its defects and any repairs. |
| Urgent option | Quick Sell puts your deadline in view. It does not guarantee a buyer. |
| Seller badge | Phone confirmed. This does not verify identity or ownership. |
| Swap \+ cash to seller | You give: PS5 \+ ₦300,000. You receive: MacBook. You pay ₦300,000 directly at the exchange. |
| Swap \+ cash from seller | You give: PS5. You receive: MacBook \+ ₦50,000. The other person pays ₦50,000 directly. |
| Before send | Review what each person gives and receives. Offers can be countered or rejected. |
| Offer accepted | Both items are reserved. Arrange an inspection and handover with the other person. |
| Handover caution | Inspect the items first. NextOwn does not hold or independently verify payments in this pilot. |
| Partial confirmation | Your confirmation is recorded. Waiting for the other person to confirm. |
| Unavailable error | This item is no longer available. Your offer was not sent. |
| Old counteroffer | The offer has changed. Review the latest version before deciding. |
| Expiration | The deadline passed. Renew, update or close your listing. |
| Dispute | We have recorded your report. Your case reference is \[ID\]. Support will review the information. |
| Review gate | Reviews are available after both people confirm the exchange. |

## **11.1 Wording that Must not Appear in Pilot Designs**

Do not use: "Verified person", "Escrow protected", "Guaranteed buyer", "Secure payment", "We hold your money", "Payment confirmed by NextOwn", "Certified authentic", "Fraud-free", "Delivery guaranteed", "You have successfully paid through NextOwn", or fake scarcity claims. Replace with the specific fact NextOwn actually records.

# **12\. Responsive Wireframe Blueprints**

## **12.1 Mobile Explore Skeleton, 390 x 844**

| Region | Recommended Content |
| :---- | :---- |
| A. Sticky header | NextOwn logo   \[area\]   \[bell / inbox\] |
| B. Search | Find phones, consoles, laptops...  \[Search\] |
| C. Mode chips | \[For Sale\] \[Open to Swap\] \[Quick Sell\] |
| D. Category rail | Phones  Laptops  Gaming  Home  All |
| E. Result controls | \[Filter\] \[Sort: Recent\]  24 items |
| F. Listing card | \[Authentic item image\] \[Save\]Used PS5 Console | Good₦285,000  ·  \[Pilot Area\]\[Swap possible\] \[Quick Sell: 2 days\] |
| G. Next card | Real item image and core item facts |
| H. Bottom nav | Explore | Feed | List \+ | Offers | Profile |

## **12.2 Mobile Swap \+ Cash Confirmation Skeleton**

| Region | Recommended Content |
| :---- | :---- |
| Header | Review your offer | Step 3 of 3 |
| You give | \[Your PS5 image\] PS5 Console \- Good\+ Cash: ₦300,000 paid by you |
| You receive | \[Their MacBook image\] MacBook \- GoodDisclosed defect: small scratch on lid |
| Key sentence | You give your PS5 and pay ₦300,000. They give you the MacBook. |
| Safety note | Inspect items before handover. NextOwn does not hold or verify payment. |
| Footer CTAs | \[Edit offer\]  \[Send offer\] |

# **13\. Feed rules, Image Safety and Low-data Experience**

* **Feed content in MVP**: listing-linked highlight cards with user caption and moderated comments; supports save and View Item. More complex standalone posts, Following, video and personalised algorithm are later.  
* **Canonical status/price/condition**: always read the current Listing and Item records, not copied values on social posts; unavailable items cannot accept action even via an old post.  
* **Image gallery**: allow multiple angles with image count/thumbnail and zoom; maintain defect disclosures as text for accessibility.  
* **Image upload**: show compressing/upload progress and an offline/retry state. Strip geotags in backend. Never send entire original image in a public listing if a safe optimised derivative suffices.  
* **Data saving**: lazy load feed and results; do not autoplay videos or fetch large photos offscreen. Load plain text and CTA even if images fail.  
* Search filters persist across Explore \-\> Listing \-\> Back, and list scroll position ideally preserved. Offer draft preserved across authentication and retry, subject to safe storage limits.  
* **Feed safety**: reporting, removal states and blocked-user treatment must be designed alongside comments, not as a post-launch patch.

# **14\. Design Review and Delivery Protocol**

## **14.1 Figma Page and Layer Structure**

| Figma page | Contents and Deliverable |
| :---- | :---- |
| 00 \- Overview | Cover, version, product promise, approved constraints, route map, decisions and notes. |
| 01 \- Foundations | Colours, type scale, spacing, grids, elevations, radii, icon rules, image guidance and accessibility notes. |
| 02 \- Components | All reusable components and variants with Auto Layout, properties, variables and interaction documentation. |
| 03 \- User Journeys | Flowchart for F-01 to F-08 with decision and error branches. |
| 04 \- Mobile Screens | 390 x 844 canonical screens UX-01 to UX-26, organised into section names and linked by flow IDs. |
| 05 \- Responsive Screens | 1440 x 900 desktop for core browse/detail/offer/feed/account \+ 320 px stress check \+ tablet patterns. |
| 06 \- Admin Workspace | Moderator queue, case detail, transaction review and role restrictions. |
| 07 \- Prototype | Clickable P0 happy paths and adverse paths; reusable overlays and transparent launch boundaries. |
| 08 \- Handoff & QA | Annotated state tables, empty/error designs, redline specs, payload/field references, clickable acceptance checklist. |
| 09 \- Research & Feedback | Usability notes, founder design decisions, design changelog and unresolved questions. |

## **14.2 Required Design Artifacts before Engineering Handoff**

1. One-page information architecture plus site map and global member/admin permissions summary.  
2. All high-fidelity core mobile screens UX-01 to UX-26, including at least one empty, one error and one loading variant per major flow.  
3. Selected 320 px, 768 px and 1440 px states for Explore, item detail, offer summary, transaction handover and feed.  
4. Working component library with reusable Figma Auto Layout, variables, typography and state variants linked to JSON design tokens.  
5. Clickable happy paths for cash sale, swap plus cash, Quick Sell listing and feed discovery, plus unavailable/conflict and disputed-handover branches.  
6. Annotation of exact validation and model fields, including cash payer direction, available item constraints, timing, permissions and review eligibility.  
7. Keyboard and screen-reader behaviour notes, handoff to engineers with assets and image sizing/quality guidance.  
8. Founder-reviewed copy deck, moderation/error/empty states and a list of explicitly deferred features.

## **14.3 Design-Stage Usability Sessions**

Test with at least two early representatives of each high-priority job: a declutterer, buyer and budget-conscious swapper, including users with varying technical confidence and network access. Ask them to list a device truthfully, explain who pays in a mixed swap, respond to a counteroffer and identify what NextOwn can or cannot protect. Prioritise comprehension over aesthetic preference: no tester should mistake "Phone confirmed" for ID verification or think the platform holds their money.

## **14.4 Design Acceptance Rubric**

| Criterion | Pass Rule |
| :---- | :---- |
| Offer comprehension | A tester can name both items and identify who pays exactly how much before submitting. |
| Item integrity | Same item appears with consistent availability in Explore, Feed, detail, offers and profile. |
| Error recovery | Network, stale offer, expired listing and upload failures have visible next steps and preserved safe inputs. |
| Trust accuracy | No false identity, authenticity, payment or delivery claim; defects and reviews counts are not obscured. |
| Handovers | One person confirming is clearly different from a completed exchange; disputes are accessible. |
| Accessibility | Colour/contrast, focus, 320 px reflow, readable text and critical screen-reader labels meet design target. |
| Developer clarity | Each P0 screen linked to a PRD requirement, state and event; components and responsive behaviours specified. |

# **15\. Paste-Ready Master Instruction for Design Agent**

The following instruction is intended for a capable design agent with access to the linked PRD, this UX brief and design token JSON. Give the agent those files, not only the instruction below. Complete product decisions and final brand approvals before public-facing production.

### **Role and inputs**

You are the lead product designer for NextOwn, a Nigerian individual-first peer-to-peer marketplace. Build a high-fidelity, mobile-first UI/UX design system, screen library, user-flow diagrams, and clickable prototype intended for engineering handoff. Use the two attached documents as the binding product and UX specifications: NextOwn Product Requirements Document (NX-PRD-001) and NextOwn UI/UX Design & Agent-Ready Template (NX-UX-001). Use NextOwn Design Tokens JSON as the single source for visual variables. If a requirement is ambiguous, flag it as an open question rather than silently inventing a business rule.

### **Identity, Colour and Typography**

Brand and positioning: Name exactly NextOwn (capital N and O). Address www\.nextown.ng (do not claim domain verification). Tagline: "Turn what you own into what you want." The design should be optimistic, modern, practical, local and demonstrably transparent. Primary Ink \#142D32; Exchange Teal \#0B6159, hover \#084B46; Warm Gold \#F9BB55 accents; Cloud \#F7F9F7; White \#FFFFFF; Mint Mist \#E8F4EF; Slate \#486067; Border \#D6E2DE; semantic Success \#147D52, Warning \#9A5900, Danger \#B42318, Information \#2453A6. Typography: Inter Display headings and Inter body, with system fallbacks. Use 16px body, 48px action height, 44px minimum hit areas, 4/8/12/16/24/32/48/64px spacing scale, 12px control radius and 16px card radius. Design for 390x844 mobile first, test 320px width, and build 768px plus 1440x900 desktop responsive variants. Aim for WCAG 2.2 AA. Logo is a placeholder exploration, not an approved brand asset.

### **MVP Product Scope**

MVP scope: phone-confirmed accounts, coarse area location, truthful current-image listings, cash sale, Quick Sell real deadlines, one-item swaps with optional cash top-up and explicit payer direction, immutable counteroffer versions, atomic item reservation on acceptance, local offline handover, two independent user confirmations, a simple listing-linked discovery feed with short captions/comments, search/filter, saves, messaging, reports, reviews of completed exchanges and an admin moderation/support panel. One underlying Item record must retain consistent availability across listings, feed and swap offers. Offer-only items are private to the offered negotiation, not part of a searchable inventory.

### **Hard Exclusions**

Hard boundaries: NO in-app escrow, wallets, bank verification, delivery tracking, auction bidding, multi-item/multi-party swaps, generative AI price claims, authenticity or identity guarantees, or fake protected-payment badges. "Phone confirmed" does not mean verified identity. NextOwn does not hold or independently verify payments during pilot. Cash payment happens directly between participants. Never fabricate a launch city, a user base, transaction stats or real selling prices. Use fictional item example values strictly as illustrative placeholders.

### **Interaction Direction**

Experience directions: communicate "You give / You receive" for every offer, clearly identify who adds cash, show disclosed defects near the CTA, explain status transitions, and let users reject/counter without pressure. Provide accurate availability/expired states. Show the difference between awaiting handover, one confirmation and fully completed transaction. The social feed is a route to canonical item listings, not a separate inventory system. Prioritise mobile data efficiency, real-item photos, progressive forms, calm urgency and clear safety language.

### **Required Deliverables**

Output requirements: (1) 00 Overview \+ information architecture; (2) 01 Foundations with approved/proposed tokens; (3) 02 Figma components with variants and accessibility states; (4) 03 journeys F-01 to F-08, including failure branches; (5) 04 screen set UX-01 to UX-26, high-fidelity mobile; (6) 05 responsive desktop and tablet key screens; (7) 06 admin UX-27/UX-28; (8) 07 clickable prototype for cash, swap plus cash, Quick Sell, feed-to-offer and dispute; (9) 08 annotated developer handoff including field validation, loading/empty/error states and analytics events; (10) 09 open questions/changelog. Use descriptive layer names, reusable components, Auto Layout and variables. For every screen, show goal, information priority, CTA, UI components, normal and adverse states, accessibility and responsive behaviour.

### **Acceptance Self-Review**

Perform a self-review against the PRD: item cannot be doubly reserved, only latest offer version can be accepted, cash payer direction is unmistakable, accepted agreement snapshots do not change, one handover confirmation cannot unlock reviews, reservation expiry cannot pretend to complete a transaction, and off-platform payment disclosures are accurately worded. Deliver a gap list instead of silently making product policy decisions.

# **Appendix: Links Between Screens and Core Data Objects**

| Component or Screen | Data and Policy Dependencies |
| :---- | :---- |
| Listing card/detail | Listing \+ Item public projection; listing.status, item.availability, photos, condition, category, price/accepted modes, area, seller review count. |
| Feed post | FeedPost \+ Listing linked lookup; listing changes override stale cached post display and action state. |
| Offer composer/summary | Target Listing; owned/offered Item; OfferVersion payload with cash\_direction and integer amount; current permissions. |
| Offers thread | Offer negotiation and all immutable OfferVersions; current\_version\_id, expires\_at, latest recipient actor. |
| Agreement/handover | Transaction snapshot \+ live state \+ Reservations \+ user confirmations \+ private meeting details. |
| Review panel | Transaction COMPLETED and review eligibility computed server-side; aggregate count and average. |
| Admin case | Report/Case, linked affected content, transaction/offer history, confirmations and audited moderation actions. |

Design file naming suggestion: NextOwn / Product Design / v0.9 / Date; assets named NX-UX-04-ListingDetail-Available-Mobile and NX-UX-04-ListingDetail-Reserved-Mobile. Link every key prototype frame to F-flow and NX-PRD requirement numbers when available.