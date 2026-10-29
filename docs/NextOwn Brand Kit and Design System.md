

**N E X T O W N  /  BRAND FOUNDATIONS**

**NextOwn**

# **Brand Kit & Design System**

## *Identity direction, colour accessibility, typography, graphic language, voice, UI application and handoff governance.*

*Turn what you own into what you want.*

| Brand: NextOwn     Website: www\.nextown.ngMarket: Nigeria     First release: responsive web pilotStatus: V0.9 | PROPOSED / FOR FOUNDER APPROVAL |
| :---- |

Prepared for product, engineering, design, research and operations teams.

# **1\. Brand Identity at a Glance**

| Element | NextOwn Proposed Specification |
| :---- | :---- |
| Name | NextOwn. Capital N and O in all brand-first displays; avoid Next Own, NEXT-OWN or NEXTOWN in consumer copy except small logotype treatments. |
| Web address | www\.nextown.ng. Founder-provided address; do not interpret as domain ownership, website launch or trademark confirmation. |
| Core proposition | Turn what you own into what you want. |
| One-sentence description | NextOwn is a person-to-person marketplace for selling, swapping and combining items with cash to obtain something else. |
| Primary audience | Nigerians who want to declutter, upgrade devices, discover affordable used items or make one-for-one local swaps. |
| Personality | Practical, optimistic, dependable, friendly, contemporary and direct. Never overpromise safety, value or verification. |
| Brand values | Resourcefulness; transparency; possibility; fairness; community; personal agency. |
| Design status | Recommended identity specification (v0.9), not a pre-existing approved brand kit. Founder, designer and counsel should sign off. |

## **1.1 Positioning Pillars**

| Pillar | Meaning | Experience Proof |
| :---- | :---- | :---- |
| Value in what you own | A useful item can fund an upgrade or become part of another trade | Cash, swap and item-plus-cash paths equally legible |
| Clarity before exchange | People should know condition, who pays and what is agreed | Defects beside CTA and immutable offer snapshots |
| Trust through facts | Trust is built from evidence and transparent status, not unearned badges | Phone confirmed means phone confirmed; reviews display count |
| Local opportunity | Discover nearby secondhand possibilities with practical arrangements | Area filters, Quick Sell and private local handover |
| Fun but purposeful | Exploration should lead to useful deals | Listing-linked feed connected to canonical availability |

# **2\. Colour Palette and Contrast Policy**

The system balances a high-confidence Ink foundation, an approachable Exchange Teal action colour, light open surfaces and one Warm Gold accent. This separates commercial opportunity from financial guarantee cues. Use semantic shades only for specific states; do not introduce unnecessary competing accents.

| Family / label | HEX | RGB | Usage / contrast |
| :---- | :---- | :---- | :---- |
| Core / NextOwn Ink | **\#142D32** | 20, 45, 50 | Primary text, dark surfaces, logo; White 14.47:1 |
| Core / Exchange Teal | **\#0B6159** | 11, 97, 89 | Primary action, interactive links; White 7.32:1 |
| Core / Teal Hover | **\#084B46** | 8, 75, 70 | Hovered/pressed primary state; White 9.98:1 |
| Accent / Warm Gold | **\#F9BB55** | 249, 187, 85 | Highlights, moments of delight; never white text; Ink 8.45:1 |
| Neutral / Cloud | **\#F7F9F7** | 247, 249, 247 | Page background; Ink 13.68:1 |
| Neutral / Paper | **\#FFFFFF** | 255, 255, 255 | Cards and overlays; Ink 14.47:1 |
| Neutral / Mint Mist | **\#E8F4EF** | 232, 244, 239 | Info surface and low emphasis sections; Ink 12.83:1 |
| Neutral / Slate | **\#486067** | 72, 96, 103 | Secondary copy; White 6.68:1 |
| Neutral / Border | **\#D6E2DE** | 214, 226, 222 | Dividers and input outlines; Not for text |
| Semantic / Success | **\#147D52** | 20, 125, 82 | Success text/icons, never sole indicator; White 5.14:1 |
| Semantic / Warning | **\#9A5900** | 154, 89, 0 | Warning text/icons; White 5.52:1 |
| Semantic / Danger | **\#B42318** | 180, 35, 24 | Errors and destructive actions; White 6.57:1 |
| Semantic / Information | **\#2453A6** | 36, 83, 166 | Help and informational status; White 7.34:1 |

## **2.1 Mandatory Accessible Combinations**

| Context | Approved Treatment | Reason |
| :---- | :---- | :---- |
| Primary CTA | Exchange Teal \#0B6159 background with white \#FFFFFF text | 7.32:1 text contrast; 48 px minimum control height. |
| Primary CTA hover | Teal Hover \#084B46 background with white text | 9.98:1 text contrast. |
| Headings/body | NextOwn Ink \#142D32 on Cloud/White | Strong legibility: 13.68:1 on Cloud and 14.47:1 on White. |
| Secondary copy | Slate \#486067 on White/Cloud | 6.68:1 on White; avoid reducing opacity further. |
| Highlight | Warm Gold \#F9BB55 background with NextOwn Ink text | 8.45:1 text contrast; never use white text on Gold. |
| Status | Success/Warning/Danger/Info colours as labelled text plus icon/status word | Pair signals with text; colour alone does not convey action/state. |
| Borders | Border \#D6E2DE for decorative dividers only | Do not rely on border-only treatment for required keyboard focus or form validation. |

## **2.2 Recommended Colour Use Budget**

Approximately 60% white/cloud backgrounds, 25% Ink typography/structural elements, 10% Exchange Teal interactive emphasis, 5% Gold or semantic states. These are art direction proportions, not pixel-level acceptance thresholds. Keep primary screens calm; offer decision and support views should use less Gold and more clarity.

## **2.3 CSS and Engineering Integration**

Colour references should use semantic names instead of hard-coded HEX inside components: colour.action.primary, colour.action.hover, colour.text.default, colour.text.muted, colour.border.default, colour.surface.default, colour.surface.tinted, colour.feedback.success/warning/error/info. The machine-readable token JSON accompanies this document; do not create diverging component-local swatches.

# **3\. Typography System**

Use Inter Display for headings and Inter for sustained copy and interface components. Both are widely available open-source type families; final webfont distribution and font performance must be handled by engineering. The document uses installed fonts for presentation but does not include/share font files.

| Role | Typeface | Weight | Desktop/Mobile Size |
| :---- | :---- | :---- | :---- |
| Display / desktop | Inter Display | 700 | 40 / 48 px |
| H1 / mobile | Inter Display | 700 | 32 / 40 px |
| H2 | Inter Display | 650-700 | 26 / 34 px |
| H3 | Inter Display | 600 | 21 / 28 px |
| Body | Inter | 400 | 16 / 24 px |
| Body medium | Inter | 500 | 16 / 24 px |
| Compact | Inter | 400-600 | 14 / 21 px |
| Caption | Inter | 500 | 12 / 18 px |
| Button | Inter | 600 | 16 / 24 px |
| Price | Inter | 700 | 24 / 30 px |

## **3.1 Typeface Rules**

* **Headings**: sentence case instead of all-caps. Avoid decorative type for offers, defects, support text and prices.  
* **Body**: baseline 16 px / 24 px with line lengths approximately 45-75 characters for editorial copy; narrow columns for forms.  
* **Amounts**: 24 px / 30 px bold or larger where appropriate; use tabular figures so ₦300,000 and ₦350,000 compare precisely.  
* Use Inter in UI controls to prevent text-width drift across responsive screens; avoid overly condensed labels.  
* **Fallback sequence**: Inter Display or Inter first, then system-ui, Segoe UI, sans-serif. Avoid layout shifts while web fonts load.  
* Display headings can be 40/48 desktop, 32/40 mobile. Mobile secondary headings remain 26/34 or smaller; no long, stylised paragraphs.  
* Link treatment combines visual affordance and context; do not communicate clickability only by Teal colour.

# **4\. Logo Design System and Usage Rules**

## **4.1 Creative Brief for an Original Identity**

Create two to three original logo routes for founder review. Preferred direction: a confident NextOwn wordmark paired with a simple monogram N suggesting onward movement, two possessions changing hands, or an open path. Geometric strokes and restrained negative space are appropriate. The logo must remain recognisable at small mobile sizes and should not evoke a bank, delivery courier or crypto exchange.

| Logo Asset | Required Variants and Constraints |
| :---- | :---- |
| Primary wordmark | NextOwn in Ink or Teal on Cloud/White, horizontal variant preferred. |
| Reverse wordmark | White on Exchange Teal or Ink backgrounds, no gradient or shadow. |
| Icon mark | Geometric N or abstract handoff; must work as one-colour silhouette at 24 px. |
| Monochrome | Solid Ink or solid White, for documents, stamping and low-ink cases. |
| Minimum size | Proposed: wordmark \>= 112 px web desktop, \>= 92 px mobile; icon \>= 20 px with legibility check. |
| Clear space | At least 0.5x cap height of the N on each side; exact protected zone fixed after final mark selection. |
| Prohibited treatments | Never stretch, rotate, distort, mix unapproved colours, add neon outlines or pair logo with fake "verified" shields. |
| Delivery files | Figma editable vectors, SVG, transparent PNGs, app icon 192/512, favicon 16/32/48, dark/light exports, usage guide. |

## **4.2 Brand Ownership Checkpoints**

Before final launch approve the final wordmark/monogram; check domain control, Nigerian and relevant trademark conflicts, licensing and creator IP assignment. Branding exercises and visual treatments do not independently establish ownership or trademark clearance.

# **5\. Grids, Spacing, Shape and Motion**

| Token Family | Design Rule |
| :---- | :---- |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64 px; use these values in all spacing variables. |
| Mobile canvas | 320-767 px; reference 390 x 844; 16 px side margins, 4 columns, 12 px gutter; 320 px stress test. |
| Tablet canvas | 768-1023 px; 24 px side margins, 8 columns; adaptive card counts. |
| Desktop canvas | 1024+ px; max content 1200 px, 12 columns, 24 px gutters; reference 1440 x 900\. |
| Radius | Small 8 px, control 12 px, card 16 px, feature 24 px, pill 999 px. Avoid gratuitous mixed shapes. |
| Shadows | Card 0 2px 12px rgba(20,45,50,.06); overlay 0 14px 36px rgba(20,45,50,.18). No shadows on every nested element. |
| Control sizing | Primary buttons and inputs 48 px min height; minimum pointer target 44 x 44 px, reasonable spacing for adjacent destructive controls. |
| Motion | Fast 120ms, standard 200ms, slow 320ms; ease-out; reduced-motion path for all movement. |
| Visual density | Balanced; show price, condition and mode in every item card without overloading with unverified labels. |

## **5.1 Iconography**

Use one outline icon family, recommended Lucide rounded-line icons. Standard 20-24 px optical size and approximately 1.75-2 px strokes. Prefer labelled actions for Give, Receive, Swap, Filter, Message, Save, Report and Handover. The trade motif can use a paired directional arrow, but no payment/security shield unless the exact service exists. Use consistent alignment, hit areas and filled/outline active states.

# **6\. Photography and Illustration Style**

| Use Case | Visual Direction / Constraints |
| :---- | :---- |
| Listing gallery | Photographs of actual items, clear daylight, multiple angles, plain background when possible; honest defects and repairs. |
| Item cards | Crop predictable 4:3 or 1:1 with consistent safe zone; allow enlarged original viewing; no overlays concealing flaws. |
| Hero lifestyle | Inclusive Nigerian everyday contexts and personal items; avoid stock imagery implying transactions or authenticated goods without evidence. |
| Feed | Real item highlights tied to listings, caption not obscuring photo or item condition; avoid videos in first release. |
| Illustration | Simple geometric hands/objects/arrows, line icons and lightweight stylised backgrounds; functional not childish. |
| Compositional balance | Natural light; Cloud backgrounds; Teal accent for UI; Gold sparingly in promotional graphics. |
| Accessibility | Alt text for functional/product photos, never embed essential prices or condition descriptions solely into images. |

# **7\. Brand Voice and Interface Writing**

## **7.1 Voice Traits**

| Trait | Write Like This | Avoid |
| :---- | :---- | :---- |
| Helpful | "Add clear photos of your item and show any defects." | "Perfect photos required to win." |
| Optimistic | "Your next upgrade could start with something you own." | "Guaranteed upgrade with zero stress." |
| Specific | "You pay ₦50,000 directly to the other person." | "Cash difference: \-50k" with no context |
| Respectful | "This item is no longer available. Explore similar listings." | "Oops\! You were too slow\!" |
| Truthful | "Phone confirmed" and "Both people confirmed exchange" | "Identity verified" or "Funds secured" |

## **7.2 Messaging and Value Proposition Set**

| Channel | Copy Direction |
| :---- | :---- |
| Primary brand line | Turn what you own into what you want. |
| Website hero | Find your next thing. |
| Supporting line | Sell what you no longer need, swap for something better, or add cash to make the exchange work. |
| CTA pair | Explore items | List an item |
| Trade prompt | You give \[item\] \+ ₦\[amount\]. You receive \[item\]. You pay \[amount\] directly at handover. |
| Quick Sell note | Highlight your deadline to local buyers. A sale is not guaranteed. |
| Trust note | People confirm their own exchanges. NextOwn does not hold or verify payment during the pilot. |
| Support promise | We can review reports and account activity. We cannot reverse a transfer made outside NextOwn. |

## **7.3 Content Formatting Rules**

* Use Nigerian naira symbol ₦; comma-separated numbers; show cash payer in full words in all mixed offers.  
* Write "Open to swap", "Quick Sell" and "Phone confirmed" consistently. Use sentence case for labels and buttons.  
* Keep form helper text succinct, explanatory and tied to the user benefit; do not bury important facts in tooltips.  
* Local pilot city and areas are configurable. Avoid inventing live cities and do not auto-expose home address.  
* Use concise and calm errors, without blaming the user or creating false artificial urgency.  
* For UX copy, avoid jokes, shaming or celebration while disputes are unresolved.

# **8\. UI Components and Design Patterns**

| Component | Brand Expression and Rules |
| :---- | :---- |
| Primary action | Filled Exchange Teal, White label, 48 px minimum height, focus outline visible; for Offer, List, Confirm my side. |
| Secondary action | White surface, Teal border/text for Counter, Save, Review terms. Must appear less dominant than primary. |
| Destructive action | Danger text and explicit confirmation for Delete/Close/Report details; no red for Quick Sell excitement. |
| Cards | White or Cloud surfaces, 16 px radius, restrained border and shadow; item imagery carries attention. |
| Fields | 48 px controls, Ink labels, Slate helpers, 12 px radius; explicit error message and programmatic association. |
| Status chips | Mint/Mist for normal, Warm Gold tint for real urgency with dark label; status word and icon accompany colour. |
| Offer summary | Symmetric You Give and You Receive visual regions plus prominent, redundant explicit cash direction. |
| Trust area | Defect details and factually labelled phone confirmation, with review count and no score claims. |
| Bottom navigation | Five destinations maximum; selected uses Teal \+ shape/text changes; high-contrast icons. |
| Error banners | Semantic colour with icon and recommended next action; never automatically dismiss critical transaction errors. |

## **8.1 Prototype-Level Sample Components**

| Component | Default Sample Text | Exceptional State |
| :---- | :---- | :---- |
| Listing card | Used PS5 Console | Good | ₦285,000 | \[Pilot Area\] | Open to swap | Reserved: This item is no longer accepting offers. |
| Counteroffer card | New terms: Your PS5 \+ ₦350,000 for their MacBook. You pay cash directly. | Offer expired. Review active listings or create a new offer. |
| Handover button | Confirm my side of exchange | Your confirmation is recorded. Waiting for the other person. |
| Phone label | Phone confirmed | No extra meaning. Identity/item authenticity not verified. |
| Report status | We received report NX-000123. | Your report is under review; do not make a second identical case unless facts changed. |

# **9\. Digital, Social and Communication Applications**

| Surface | Recommended Brand Treatment |
| :---- | :---- |
| Website | Teal primary navigation CTAs, Cloud canvas, clear search, actual listing photos and compact trust copy. |
| Transactional SMS | Plain copy with branded NextOwn prefix, action context and no sensitive full agreement disclosure; caution against malicious links. |
| Email / notification | White/Cloud with Ink text, Teal buttons, precise item and offer state, support links and no fake security guarantees. |
| Social banners | Modern item photography, headline-led messaging, dark Ink copy, Teal system, one Gold accent maximum. |
| OG preview | 1200 x 630 px artboard; brand lockup, value line and visual link to available listing, with no false current-price promise. |
| Instagram post | 1080 x 1350 px default feed visual; allow intentional variation, readable hierarchy and current feature claims. |
| Avatar / app icon | Geometric N mark on Teal or Ink canvas; test visible detail at 32 px and 16 px. |
| Print / signage | White, Ink and one accent; check print CMYK proof and readability before production; digital HEX is canonical until print matching. |

## **9.1 Brand Governance**

Maintain one NextOwn brand file, one token source and a changelog. Any colour, logo, font or copy change affecting product screens requires a version bump, design review, engineering notification and accessibility regression. No agency, designer or code contributor should independently publish a different core brand palette. Store rights to final design assets in the company or agreed legal entity after collaboration terms are established.

# **10\. Accessibility, Trust and Approval Checklist**

* All relevant text on surface variants meets WCAG 2.2 AA design thresholds; Gold uses Ink rather than white text.  
* Controls, focus rings and keyboard navigation are documented, 320 px mobile layout avoids clipped prices and cash descriptions.  
* Clear text labels reinforce status chips, icons, alerts and warning colour; reduced-motion preference supported.  
* Product imagery is authentic and does not hide item faults; photos are privacy-sanitised in implementation.  
* No identity, authenticity, escrow, cash protection, shipping or completed-payment claim is designed without a real supporting capability.  
* Mobile data-friendly image sizes and form recovery prevent unnecessary friction.  
* Final mark, font licensing/delivery, domain/trademark clearance, launch city and component assets are approved before public rollout.

## **10.1 Specific Approvals Remaining**

| Decision ID | What to Approve | Owner |
| :---- | :---- | :---- |
| BR-01 | Primary wordmark \+ N mark, light/dark variations and full icon set | Founder \+ brand designer |
| BR-02 | Proposed palette, contrast combinations and UI component variants | Founder \+ product designer |
| BR-03 | Typography Inter Display/Inter and fallbacks, webfont strategy | Design \+ engineering |
| BR-04 | Final copy tone and legal/safety/commerce disclosures | Product \+ legal/safety |
| BR-05 | Pilot city/categories and photo guidance examples | Founder \+ operations |
| BR-06 | Trademark, domain ownership, collaborator IP assignment and final export licence | Founder \+ counsel |

# **Appendix. Machine-Readable Token Package**

**Included companion**: NextOwn\_Design\_Tokens.json. Files are intended for Figma token import or engineering translation into CSS/theme objects. The machine-readable package expresses the same colour HEX, font families, sizes, spacing, border radii, durations and breakpoint values used in the product and UX documents. Design and developer teams must agree on token naming before shipping without altering the approved values.

**Design asset checklist**: primary logo SVG, reversed logo SVG, monochrome logo SVG, favicon 16/32/48, app mark 192/512, Open Graph banner 1200 x 630, listing photo guidelines, Figma component library, accessible state matrix, UI copy bank and partner/use-of-logo guidance.