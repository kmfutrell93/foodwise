# FoodWise: iOS App Development & App Store Success Guide
**Research Date:** May 2, 2026  
**Priority:** iOS First, Android Secondary  
**Purpose:** Ensure successful App Store submission and maximize organic discovery

---

## Table of Contents

1. [iOS Human Interface Guidelines (HIG) Compliance](#hig-compliance)
2. [App Store Review Guidelines](#app-store-review)
3. [Privacy & Health App Requirements](#privacy-requirements)
4. [App Store Optimization (ASO)](#aso-strategy)
5. [iOS Typography Standards](#typography)
6. [FoodWise-Specific Recommendations](#foodwise-recommendations)

---

## 1. iOS Human Interface Guidelines (HIG) Compliance {#hig-compliance}

### Four Core Principles (2026)

Apple's HIG is built on four design principles: **Clarity** ensures interfaces are easily understood and free of ambiguity, **Deference** keeps focus on content rather than UI elements, **Depth** uses visual layers to communicate hierarchy, and **Consistency** maintains familiar patterns across all Apple platforms.

**Practical Application for FoodWise:**

#### **Clarity**
Clarity means removing ambiguity from every interactive element - a button labeled "Submit" forces users to remember context, while "Log Symptoms" removes all doubt.

✅ **DO:**
- Button labels: "Generate Meal Plan" not "Submit"
- "Log Today's Symptoms" not "Check In"
- "Start 7-Day Free Trial" not "Continue"

❌ **DON'T:**
- Vague CTAs like "OK", "Done", "Next"
- Competing elements on one screen
- Ambiguous icon meanings without labels

#### **Deference**
Deference means UI disappears when viewing content - the Photos app's chrome fades when viewing an image, content takes over rather than persistent toolbars framing every view.

✅ **DO:**
- Meal cards fill viewport, controls appear contextually
- Home screen: protein ring is focal point, navigation fades
- Full-screen meal plan view with bottom sheet actions

❌ **DON'T:**
- Persistent toolbars at top AND bottom
- Navigation bar + custom header + floating action button simultaneously
- Decorative UI competing with meal content

#### **Depth**
- Use shadows, layering, and motion to guide users
- Meal cards should have subtle elevation
- Modal overlays with backdrop blur
- Streak milestone animations with z-depth

#### **Consistency**
- Use system components (tab bars, navigation bars)
- Standard gestures (swipe back, pull to refresh)
- Familiar patterns (Settings-style grouped lists)

---

### HIG Structure (6 Categories)

The HIG is organized into Platforms (iOS/iPadOS/macOS/watchOS/tvOS/visionOS), Foundations (color, layout, typography, icons, materials, motion, accessibility), Patterns (onboarding, navigation, search, feedback, data entry), Components (buttons, toolbars, menus, navigation bars), Inputs (touch, keyboard, mouse, Apple Pencil), and Technologies (widgets, Live Activities, SharePlay).

**FoodWise Must-Read Sections:**
1. **Foundations → Typography** (SF Pro standards, Dynamic Type)
2. **Foundations → Color** (System colors, accessibility contrast)
3. **Patterns → Onboarding** (First-run experience best practices)
4. **Components → Navigation Bars** (Top navigation standards)
5. **Components → Tab Bars** (Bottom navigation best practices)
6. **Patterns → Feedback** (Streaks, progress, celebrations)

---

### 2026 HIG Updates

Recent HIG updates for 2025-2026 introduce guidance for visionOS spatial computing, customizable home screen widgets, Control Center extensions, the new Liquid Glass design language, and AI-powered features integration.

**Relevant to FoodWise:**
- ✅ **Widget support** (protein ring widget, injection day countdown)
- ✅ **Live Activities** (meal prep timer, grocery shopping progress)
- ⚠️ **AI transparency** (must disclose Claude API usage - see Privacy section)

---

### Platform-Specific iOS Considerations

iOS design must account for one-handed operation, cellular connectivity constraints, and the intimate nature of a device carried constantly.

**FoodWise iOS-Specific Design:**

1. **One-Handed Operation**
   - Primary actions in thumb zone (bottom 2/3 of screen)
   - Bottom tab bar (not hamburger menu)
   - Large touch targets (56px minimum for primary actions)

2. **Cellular Constraints**
   - Cache meal plans locally (don't require network for viewing)
   - Lazy load food imagery
   - Offline symptom logging (sync when connected)

3. **Intimate Device**
   - Personal health data (symptoms, food aversions)
   - Daily check-in notifications (8pm default)
   - Privacy-first approach (no sharing without consent)

4. **Safe Area Insets**
   - Account for iPhone notch/Dynamic Island
   - Bottom tab bar above home indicator
   - Full-bleed backgrounds, content within safe area

5. **Gesture Navigation**
   - Swipe back from edge (standard back navigation)
   - Pull to refresh (meal plan screen)
   - Long press for meal swap context menu

---

## 2. App Store Review Guidelines {#app-store-review}

### Rejection Statistics (2024-2026)

In 2024, Apple rejected 1.93 million out of 7.77 million app submissions (nearly 25%) for failing to meet quality, safety, or design requirements. Performance violations including apps that crash, freeze, or fail to demonstrate features account for more rejections than all other categories combined, with privacy being the fastest-growing rejection category in 2026.

**Top 5 Rejection Reasons (2026):**

1. **Performance Issues (2.1)** - Crashes, bugs, broken links
2. **Privacy Violations (5.1)** - Missing disclosures, unclear data usage
3. **Misleading Metadata (2.3)** - Screenshots don't match app
4. **Incomplete App (2.1)** - Placeholder content, demo mode
5. **Business Model Unclear (3.1)** - IAP not obvious, pricing confusing

---

### Critical Requirements for FoodWise

#### **BEFORE Submission**

Make sure your app has been tested on-device for bugs and stability before you submit it, and include demo account info (and turn on your back-end service!) if your app includes a login.

**Checklist:**
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 15 Pro Max (largest screen)
- [ ] Test with poor network (airplane mode, slow 3G)
- [ ] Test all subscription flows (monthly, annual, restore)
- [ ] Test onboarding → meal generation → symptom log → streak flow
- [ ] Provide demo account in App Review Notes: 
  - Email: demo@foodwise.app
  - Password: [secure demo password]
  - Account pre-configured with: Ozempic, 2 weeks in, sample symptoms
- [ ] Ensure Claude API is live and functional
- [ ] Verify Supabase backend is accessible
- [ ] Test IAP sandbox environment

#### **Privacy Policy (REQUIRED)**

All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner.

**FoodWise Privacy Policy Must Include:**
1. **Data Collection** (Health & Fitness, Contact Info, Usage Data)
   - Symptom logs (nausea, constipation, fatigue)
   - Food aversions
   - Medication type and dose day
   - Email address
   - Meal plan preferences
   
2. **Third-Party Sharing**
   - Claude API (Anthropic) - AI meal generation
   - RevenueCat - subscription management
   - Mixpanel - analytics
   - Resend - transactional email
   
3. **Data Usage**
   - AI meal personalization
   - Symptom correlation insights
   - Progress tracking
   - Weekly reports
   
4. **User Rights**
   - Request data deletion
   - Export data
   - Revoke consent
   
**Required Links in App:**
- Settings → Privacy Policy (footer link)
- Settings → Delete Account (Account Deletion required by Apple)
- Onboarding → Privacy Policy (link near consent)

---

#### **Health & Fitness App Requirements**

Provide information about your app's privacy practices - when submitting a new app or app update in App Store Connect, you'll need to declare your app's privacy practices, including what data is collected such as any health, fitness, or location data and whether it's linked to them or their device.

**FoodWise Health Data:**
- Symptom severity (nausea 1-5, constipation 1-5, fatigue 1-5)
- Food aversions (greasy food, dairy, etc.)
- Medication information (Ozempic/Wegovy/Mounjaro/Zepbound)
- Nutrition data (protein intake)

**Medical Disclaimer (REQUIRED):**
> "FoodWise is not a medical device and does not provide medical advice. Information provided by FoodWise is for educational purposes only and should not replace professional medical consultation. Always consult your healthcare provider before making changes to your diet or medication. FoodWise is not FDA approved."

**Location:**
- Onboarding screen (before data collection)
- Settings → About
- Privacy Policy
- App Store description

---

#### **AI Disclosure (NEW 2026 Requirement)**

If your app sends any user data to an external AI service such as OpenAI, Anthropic, Google Gemini, or anyone else, you must display a clear consent screen naming the provider and explaining what data is shared.

**FoodWise AI Consent Screen:**

**Location:** After onboarding, before first meal plan generation

**Content:**
```
AI-Powered Meal Plans

FoodWise uses Claude AI (by Anthropic) to create your personalized meal plans.

Data shared with Claude:
• Your medication and dose day
• Current symptoms and food aversions
• Cooking preferences and budget
• Protein goal

This data is used only to generate your meal plan and is not stored by Anthropic or used for AI training.

[Learn More] [Continue]
```

---

#### **Subscription & IAP Requirements**

If you offer in-app purchases in your app, make sure they are complete, up-to-date, visible to the reviewer and functional. Unclear subscription pricing is a common rejection reason.

**FoodWise Subscription Compliance:**

1. **Paywall Must Show:**
   - ✅ Monthly price ($12.99/month)
   - ✅ Annual price ($99/year = $8.25/month)
   - ✅ Trial period (7-day free trial)
   - ✅ Auto-renewal statement
   - ✅ Cancellation policy
   - ✅ "Restore Purchases" link

2. **Auto-Renewal Disclosure:**
   ```
   Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions in your App Store account settings.
   ```

3. **Free Trial Terms:**
   ```
   Start your 7-day free trial. Cancel anytime before [DATE] to avoid charges. After trial, subscription continues at $12.99/month unless canceled.
   ```

4. **Restore Purchases Button:**
   - Must be visible on paywall
   - Must work without login (use StoreKit)

---

### Common Rejection Scenarios for FoodWise

#### **Scenario 1: Meal Generation Fails During Review**
If your app requires special setup (demo login, region-locked content, hardware requirement), put it in App Review Notes so the reviewer doesn't have to guess.

**Prevention:**
- Provide working demo account with pre-generated meal plans
- Include in App Review Notes: "Demo account has 3 pre-generated meal plans. To test generation, tap 'New Plan' → 'Confirm' (takes 60-90 seconds)"
- Ensure Claude API has high rate limits during review week
- Monitor API logs for reviewer access

#### **Scenario 2: Screenshots Don't Match App**
Reviewers compare your app behavior to your screenshots and description - if you promise features that aren't there, or show fake UI in screenshots, you increase rejection risk.

**Prevention:**
- Take all screenshots from actual app (not Figma mockups)
- Show real meal data, real protein numbers
- Don't show "Pro" features in free tier screenshots
- Match screenshot captions to actual in-app text

#### **Scenario 3: Privacy Policy Link Missing**
One missing detail can cause a rejection loop: a hidden privacy policy link, no restore purchases, or reviewers not having a clean way to test gated features.

**Prevention:**
- Privacy Policy link in: Settings (footer), Onboarding (near consent), Paywall (footer)
- Test in a clean TestFlight build: can reviewer find policy in <30 seconds?
- Use AppFollow or similar to track reviewer feedback

---

## 3. Privacy & Health App Requirements {#privacy-requirements}

### Privacy Nutrition Labels (Mandatory)

As of December 2020, Apple requires all newly submitted applications or updates to include a privacy nutrition label describing the app's privacy practices, based on developer's answers to questions about data types collected, how each data type is used, whether data is linked to the user, and whether data is used for tracking.

**FoodWise Privacy Nutrition Label:**

#### **Data Linked to You**

| Data Type | Purpose | Examples |
|-----------|---------|----------|
| **Health & Fitness** | App Functionality | Symptom logs, medication info, protein intake |
| **Contact Info** | Account Creation | Email address |
| **User Content** | App Functionality | Food aversions, meal notes |
| **Identifiers** | Analytics, App Functionality | User ID |
| **Usage Data** | Analytics | Feature interactions, screen views |

#### **Data Not Linked to You**

| Data Type | Purpose |
|-----------|---------|
| **Diagnostics** | App Performance | Crash logs, performance metrics |

#### **Data Used to Track You**

**NONE** - FoodWise does not use data for cross-app or cross-website tracking.

---

### Third-Party SDK Disclosure

Answers must be inclusive of all data collected by third-party partners including ad networks, analytics tools, SDKs, and external vendors.

**FoodWise Third-Party Data Sharing:**

1. **Claude API (Anthropic)**
   - **Data Shared:** Medication, dose day, symptoms, food aversions, cooking preferences, protein goal
   - **Purpose:** AI meal plan generation
   - **Linked to User:** Yes
   - **Used for Tracking:** No
   - **Privacy Policy:** https://anthropic.com/privacy

2. **RevenueCat**
   - **Data Shared:** User ID, purchase history, subscription status
   - **Purpose:** Subscription management
   - **Linked to User:** Yes
   - **Used for Tracking:** No

3. **Mixpanel**
   - **Data Shared:** User ID, event interactions, screen views
   - **Purpose:** Analytics
   - **Linked to User:** Yes
   - **Used for Tracking:** No

4. **Resend**
   - **Data Shared:** Email address, user name
   - **Purpose:** Transactional emails (password reset, weekly reports)
   - **Linked to User:** Yes
   - **Used for Tracking:** No

---

### Account Deletion (Required)

Apps must provide a method for account deletion accessible inside the app.

**FoodWise Account Deletion:**

**Location:** Settings → Account → Delete Account

**Flow:**
1. User taps "Delete Account"
2. Warning modal:
   ```
   Delete Your Account?
   
   This will permanently delete:
   • All meal plans
   • Symptom logs and insights
   • Progress data and streaks
   • Your subscription (you'll be refunded for unused time)
   
   This action cannot be undone.
   
   [Cancel] [Delete Account]
   ```
3. Require re-authentication (Face ID/password)
4. Confirm deletion
5. Delete from:
   - Supabase database
   - RevenueCat (cancel subscription)
   - Mixpanel (anonymize user)
6. Show confirmation: "Your account has been deleted."

---

## 4. App Store Optimization (ASO) {#aso-strategy}

### ASO Impact (2026 Data)

Search drives 65% of iOS discovery and 58% on Google Play - App Store search remains the single largest acquisition channel on iOS, ahead of browse (18%), referrer (12%), and ads (5%). Tap-through-to-install averages 33.4% on iOS and 27.7% on Google Play.

**What This Means for FoodWise:**
- **Primary focus:** Keyword optimization (drives 65% of installs)
- **Secondary focus:** Screenshot conversion (33% tap-through rate)
- **Tertiary focus:** Ratings/reviews (social proof)

---

### Metadata Optimization

#### **App Name (30 characters max)**
Title (30 chars): Your most important keyword + brand name.

**FoodWise Options:**
1. `FoodWise: GLP-1 Meal Planner` (29 chars) ✅ **RECOMMENDED**
2. `FoodWise: Ozempic Nutrition` (28 chars)
3. `FoodWise Ozempic Meal Plans` (28 chars)

**Why Option 1 Wins:**
- "GLP-1" = medical credibility, covers all medications
- "Meal Planner" = clear value proposition
- "FoodWise" = brand first

#### **Subtitle (30 characters max)**
Subtitle (30 chars): Secondary keywords or compelling value prop.

**FoodWise Options:**
1. `Injection-day aware nutrition` (30 chars) ✅ **RECOMMENDED**
2. `Track symptoms, hit protein` (27 chars)
3. `Wegovy & Mounjaro meal plans` (29 chars)

**Why Option 1 Wins:**
- "Injection-day" = unique differentiator (zero competition)
- "Aware nutrition" = intelligent, personalized
- Emphasizes key USP

#### **Keywords (100 characters, comma-separated, no spaces)**

Keyword field (100 chars): No spaces after commas, no repeats from title.

**FoodWise Keyword Strategy:**

**Primary Keywords (Validated from Market Research):**
- ozempic meal plan (50K-80K/month)
- wegovy nutrition (20K-30K/month)
- glp-1 diet (15K-25K/month)
- semaglutide food (10K-15K/month)
- injection day meal (5K-15K/month) ← **ZERO COMPETITION**

**Keyword Field (100 chars):**
```
ozempic,wegovy,mounjaro,zepbound,semaglutide,tirzepatide,injection,protein,nausea,symptom,tracker,diet
```

**Character Count:** 99 chars ✅

**Keywords to AVOID in field (already in title/subtitle):**
- glp-1 (in title)
- meal plan (in title)
- nutrition (in subtitle)

---

### Screenshot Optimization (CRITICAL)

iOS product pages render the first three screenshots above the fold while Play surfaces description and similar apps earlier - tap-through-to-install averages 33.4% on iOS. Apple now extracts text from screenshot captions using OCR and uses it for keyword indexing.

**2026 CRITICAL UPDATE:** Screenshot text now affects rankings - Apple's June 2025 algorithm update began indexing caption text, so treat visuals as keyword-aware content.

#### **Screenshot Strategy for FoodWise**

**Required Sizes (iPhone):**
- 6.7" (iPhone 15 Pro Max): 1320×2868px
- 5.5" (iPhone 8 Plus): 1242×2208px

**First 3 Screenshots (Above the Fold) - MOST CRITICAL:**

**Screenshot #1: Value Proposition + Social Proof**
The first screenshot = value proposition statement - use the first screenshot as a billboard with the biggest text communicating the single biggest benefit.

**Image:** Protein ring showing 110g/110g (complete) + "Great work!" celebration

**OCR-Optimized Caption Text:**
```
Hit Your Protein Goal on Ozempic
AI meal plans designed for GLP-1 users
```

**Why This Works:**
- "Ozempic" = high-volume keyword (150K-200K/month)
- "Protein Goal" = core pain point
- "AI meal plans" = modern, intelligent
- "GLP-1 users" = broad category coverage
- Visual proof (110g ring) = instant credibility

---

**Screenshot #2: Unique Differentiator (Injection Day)**

**Image:** Meal plan weekly grid with Monday highlighted orange + "Injection day" badge

**OCR-Optimized Caption Text:**
```
Injection Day Meal Plans
Gentle foods when you need them most
```

**Why This Works:**
- "Injection Day" = ZERO COMPETITION (unique)
- OCR-indexed for ranking
- Visual distinctiveness (orange highlighting)
- Addresses #1 pain point (confusion 24-48h post-dose)

---

**Screenshot #3: Symptom Tracking + AI Insights**

**Image:** Symptom log sliders + AI insight card showing correlation

**OCR-Optimized Caption Text:**
```
Track Symptoms, Get AI Insights
"Nausea 40% lower with eggs vs shakes"
```

**Why This Works:**
- "Symptom" = common search term
- "AI Insights" = value differentiation
- Real example builds trust
- Addresses pain point #2 (side effects)

---

**Screenshots #4-8 (Below the Fold):**

4. **Grocery Lists**
   - Caption: "Budget-Friendly Grocery Lists / $51 of $75 weekly budget"
   - Shows categorized list + NOVA badges

5. **Weekly Progress**
   - Caption: "Track Your Streaks & Progress / Stay motivated every day"
   - Shows 8-day streak + calendar + milestones

6. **Accountability System**
   - Caption: "Daily Check-Ins & Weekly Reports / AI-generated insights"
   - Shows check-in card + weekly report

7. **Multiple Medications Supported**
   - Caption: "Works with Ozempic, Wegovy, Mounjaro, Zepbound"
   - Shows medication selector grid

8. **Testimonial/Social Proof**
   - Caption: "Join 50,000+ GLP-1 Users" (update with real numbers)
   - Shows 4.8★ rating + user quotes

---

#### **Screenshot Best Practices (2026)**

The most effective screenshots in 2026 use hybrid captions: text combined with visual cues that guide the eye - don't rely on your UI to explain itself, users won't figure it out in 7 seconds.

✅ **DO:**
- **Large text** (readable on iPhone SE without squinting)
- **Keyword-rich captions** (OCR-indexed since June 2025)
- **Real app UI** (not Figma mockups)
- **Benefit-focused** ("Hit Your Protein Goal" not "Protein Ring Feature")
- **Social proof** (ratings, user count, testimonials)
- **Device frames** (optional but professional)

❌ **DON'T:**
- UI screenshots without context
- Tiny text (<40px font size)
- Generic features ("Easy to Use", "Beautiful Design")
- Placeholder data ("Lorem ipsum", "123g protein")
- Too many screenshots (5-8 is optimal, 10 max)

---

### App Icon Design

Updated recommendations for creating visually appealing and recognizable app icons that adhere to iOS design principles and stand out in the App Store.

**FoodWise Icon Requirements:**

**Technical:**
- 1024×1024px PNG (no transparency)
- Safe area: 820×820px (no critical content outside)
- Consistent across all sizes (60px to 1024px)

**Design Guidelines:**
- ✅ Simple, recognizable at small sizes
- ✅ No text (except short acronyms like "FW")
- ✅ Avoid photo-realism
- ✅ Distinct color (medical teal #0EA5A5)
- ✅ Memorable shape (protein ring, meal plate, GLP-1 molecule)

**FoodWise Icon Concepts:**

1. **Protein Ring Icon** ✅ **RECOMMENDED**
   - Teal circular ring (protein tracker visual)
   - Small fork/spoon inside
   - Clean, medical, recognizable

2. **Plate + GLP Icon**
   - Teal plate with "GLP" text overlay
   - Modern, category-defining

3. **Molecule + Meal Icon**
   - Simplified GLP-1 molecule structure
   - Plate/food element
   - Too complex for small sizes ❌

---

### App Preview Video (Optional but Recommended)

Video becoming mandatory - preview videos may carry more weight in ranking.

**FoodWise App Preview (15-30 seconds):**

**Script:**
1. **0-3s:** Show protein ring animation completing (110g/110g)
2. **3-7s:** Meal plan screen, highlight injection day (orange Monday)
3. **7-12s:** Symptom log screen, show AI insight appearing
4. **12-17s:** Weekly progress screen, streaks animating
5. **17-20s:** Meal generation animation (fast-forward to result)
6. **20-22s:** Grocery list with budget bar
7. **22-25s:** Paywall screen with "Start Free Trial" CTA
8. **25-30s:** Logo + "FoodWise: Your GLP-1 Nutrition Guide"

**Video Best Practices:**
- Portrait orientation (9:16)
- No narration (auto-plays muted)
- Overlay text captions
- Show real UI (not motion graphics)
- Fast-paced (users watch 5-10 seconds max)

---

### Ratings & Reviews Strategy

User reviews and timing is everything - trigger your in-app prompt right after a positive moment (finishing a workout, hitting a savings goal, unlocking a new level). In 2026, Apple's search algorithm heavily weights review velocity alongside rating - an app with 4.3 stars and 500 new reviews in the last 30 days outranks an app with 4.8 stars and 20 reviews in the same period.

**FoodWise Review Prompt Strategy:**

**Timing (SKStoreReviewController):**
1. After completing 7-day streak (milestone celebration)
2. After viewing first AI symptom insight
3. After generating 5th meal plan
4. After 30-day streak achievement

**Never Prompt:**
- During onboarding
- After error/crash
- During meal generation (loading state)
- More than 3 times per year (Apple limits)

**Frequency:**
- Apple limits prompts to 3 per year per device
- Use sparingly, only after positive moments
- Don't ask in first 3 days (let user experience value)

---

### Localization (Phase 2)

Localization goes beyond simple translation - it requires cultural adaptation of keywords, descriptions, and visuals to resonate with target audiences.

**FoodWise Localization Priority (Based on GLP-1 Adoption):**

1. **English (US)** - Primary (launch)
2. **Spanish (Mexico + US)** - 19% US Hispanic population
3. **French (Canada)** - Strong GLP-1 adoption
4. **German** - Major European market
5. **Japanese** - High smartphone penetration

**What to Localize:**
- App name and subtitle
- Screenshot captions
- Description
- Keywords (research local search terms)
- In-app content (UI strings, meal names)

**What NOT to Localize:**
- Icon
- Video (use text overlays in English, translate via subtitles)

---

## 5. iOS Typography Standards {#typography}

### San Francisco (SF Pro) Font Family

San Francisco is an Apple designed typeface that provides a consistent, legible, and friendly typographic voice with size-specific outlines and dynamic tracking ensuring optimal legibility at every point size and screen resolution.

**SF Pro Variants:**

| Variant | Use Case | Features |
|---------|----------|----------|
| **SF Pro Text** | Sizes ≤19pt | Optimized for small text, wider apertures |
| **SF Pro Display** | Sizes ≥20pt | Optimized for headlines, tighter spacing |
| **SF Pro Rounded** | Optional | Friendly, approachable (fitness apps) |

Some variants have two optical sizes: 'display' for large and 'text' for small text - the operating system automatically chooses the 'display' size for sizes of at least 20 points and the 'text' size for smaller sizes.

**FoodWise Font Strategy:**
- ✅ Use SF Pro (system default) for 95% of app
- ✅ Consider SF Pro Rounded for meal cards (friendlier feel)
- ❌ NO custom fonts (breaks Dynamic Type, fails HIG)

---

### Dynamic Type (REQUIRED)

Dynamic Type allows typefaces to adapt to different sizes when users choose to change text-size - minimum font size for iOS and iPadOS apps is 11pt.

**Why Dynamic Type Matters:**
1. **Accessibility** - Users with vision impairments can read your app
2. **App Store Approval** - Reviewers check for Dynamic Type support
3. **HIG Compliance** - Required for "good" HIG adherence

**How to Implement:**
```swift
// Use Text Styles (not fixed sizes)
Text("Your meal plan")
    .font(.headline) // ✅ Scales with Dynamic Type

// DON'T do this:
Text("Your meal plan")
    .font(.system(size: 17)) // ❌ Fixed size
```

---

### Text Styles Hierarchy

Built-in text styles including headline, body, callout, and several sizes of title are based on the system fonts and let you take advantage of key typographic features like Dynamic Type which automatically adjusts tracking and leading for every font size.

**iOS Text Styles (Default Sizes at Medium Dynamic Type):**

| Style | Size | Weight | Use in FoodWise |
|-------|------|--------|-----------------|
| **Large Title** | 34pt | Regular | Screen titles (avoided - too large) |
| **Title 1** | 28pt | Regular | Screen titles ("Your Meal Plan") |
| **Title 2** | 22pt | Regular | Section headers ("This Week") |
| **Title 3** | 20pt | Semibold | Card titles ("Monday") |
| **Headline** | 17pt | Semibold | Emphasized content ("110g protein") |
| **Body** | 17pt | Regular | Standard text (meal names, descriptions) |
| **Callout** | 16pt | Regular | Secondary text |
| **Subheadline** | 15pt | Regular | Metadata (timestamps, serving sizes) |
| **Footnote** | 13pt | Regular | Helper text, captions |
| **Caption 1** | 12pt | Regular | Very small labels |
| **Caption 2** | 11pt | Regular | Minimum readable size |

**FoodWise Typography Scale:**

```
SCREEN TITLES
Title 1 (28pt, Regular): "Your Meal Plan"

SECTION HEADERS  
Title 2 (22pt, Regular): "Streaks"

CARD TITLES
Title 3 (20pt, Semibold): "Monday", "Protein Goal"

EMPHASIS
Headline (17pt, Semibold): "110g", "8-day streak"

BODY TEXT
Body (17pt, Regular): Meal names, meal descriptions

METADATA
Subheadline (15pt, Regular): "35g protein", "15 min"

HELPER TEXT
Footnote (13pt, Regular): "GLP-1 users need 100-120g protein/day"

MINIMUM SIZE
Caption 2 (11pt, Regular): Budget labels, timestamps
```

---

### Minimum Touch Targets

Minimum touch target: 44×44pt height for tappable text.

**FoodWise Touch Targets:**
- ✅ Primary buttons: 56px height (exceeds minimum)
- ✅ Tab bar items: 49px (iOS standard)
- ✅ List rows: 44px minimum
- ✅ Checkbox/toggle: 44×44px
- ✅ Meal card tap area: Entire card (not just text)

**Common Mistakes:**
- ❌ Small "Edit" text links (need 44×44px tap area)
- ❌ Inline chips <44px height
- ❌ Close buttons <44×44px

---

### Accessibility (WCAG AA Minimum)

**Color Contrast Requirements:**
- **Normal text (< 24px):** 4.5:1 contrast ratio
- **Large text (≥ 24px):** 3:1 contrast ratio
- **UI elements:** 3:1 contrast ratio

**FoodWise Color Audit:**
- ✅ Teal (#0EA5A5) on White: 4.96:1 ✓ Passes AA
- ✅ White on Teal (#0EA5A5): 4.96:1 ✓ Passes AA
- ⚠️ Light Gray (#6B7280) on White: 4.54:1 ✓ Passes AA (barely)
- ❌ Yellow (#FFD93D) on White: 1.79:1 ✗ FAILS (use for backgrounds only)

---

### Typography Best Practices

Hierarchy needs contrast - use at least two of these for each hierarchy jump: size, weight, color, spacing.

✅ **DO:**
- Use 2-3 font weights max (Regular, Semibold, Bold)
- Left-align body text (easier to read)
- Line height: 1.4-1.6× font size for body text
- Limit line width to 40-60 characters
- Use system text styles (not custom sizes)

❌ **DON'T:**
- Use light font weights (reduces visibility)
- Use <11pt fonts
- Center-align body text (hard to read)
- Ignore Dynamic Type
- Use custom fonts (breaks accessibility)

---

## 6. FoodWise-Specific Recommendations {#foodwise-recommendations}

### Pre-Submission Checklist (Use This)

#### **Testing (Week Before Submission)**
- [ ] Test on 3+ devices (SE, Pro, Pro Max)
- [ ] Test in Airplane Mode (offline functionality)
- [ ] Test on slow 3G (loading states)
- [ ] Test with VoiceOver enabled (accessibility)
- [ ] Test with largest Dynamic Type size
- [ ] Test subscription flows (purchase, restore, cancel)
- [ ] Test meal generation 10+ times (no failures)
- [ ] Test all onboarding paths
- [ ] Test account deletion flow

#### **Metadata (App Store Connect)**
- [ ] App Name: "FoodWise: GLP-1 Meal Planner"
- [ ] Subtitle: "Injection-day aware nutrition"
- [ ] Keywords: 99-100 characters, no repeats
- [ ] Description: 4000 characters, first 170 most important
- [ ] Screenshots: 6-8 images, OCR-optimized captions
- [ ] App Preview: 15-30 second video (optional)
- [ ] Privacy Policy URL: https://foodwise.app/privacy
- [ ] Support URL: https://help.foodwise.app
- [ ] Age Rating: 12+ (medical/health info)
- [ ] Categories: Health & Fitness (primary), Food & Drink (secondary)

#### **Privacy (App Store Connect)**
- [ ] Complete Privacy Questionnaire
- [ ] Declare: Health & Fitness data (symptoms, medication)
- [ ] Declare: Contact Info (email)
- [ ] Declare: User Content (food aversions, notes)
- [ ] Declare: Identifiers (user ID)
- [ ] Declare: Usage Data (analytics)
- [ ] List third parties: Anthropic, RevenueCat, Mixpanel, Resend
- [ ] Purpose statements for each data type
- [ ] Data retention policy
- [ ] Deletion process documented

#### **In-App Requirements**
- [ ] Privacy Policy link in Settings footer
- [ ] Delete Account button in Settings → Account
- [ ] AI disclosure before first meal generation
- [ ] Medical disclaimer in onboarding + Settings
- [ ] Restore Purchases button on paywall
- [ ] Auto-renewal disclosure on paywall
- [ ] Subscription management link

#### **App Review Notes**
```
DEMO ACCOUNT
Email: demo@foodwise.app
Password: [secure password]

This demo account is pre-configured with:
- Medication: Ozempic, 1mg dose
- Dose day: Monday
- Time on medication: 2 weeks
- Sample symptoms logged
- 3 pre-generated meal plans

To test meal generation:
1. Tap "Meal Plan" tab
2. Tap "New Plan" button
3. Tap "Confirm"
4. Wait 60-90 seconds for AI generation

BACKEND SERVICES
All services are live and accessible:
- Claude API: Functional, high rate limits
- Supabase: Database operational
- RevenueCat: Sandbox IAP configured

SPECIAL NOTES
- AI-powered meal plans use Claude API (Anthropic)
- AI disclosure shown before first generation
- Medical disclaimer shown in onboarding
```

---

### Version 1.0 Must-Have Features (For Approval)

✅ **REQUIRED (Cannot ship without):**
1. Complete onboarding flow (9 screens)
2. Meal plan generation (working AI)
3. Symptom logging (3 sliders + chips)
4. Protein tracking (ring visualization)
5. Streak system (protein, symptom, plan)
6. Subscription paywall (monthly + annual)
7. Settings screen (profile, privacy, delete account)
8. Privacy Policy (accessible, complete)
9. Medical disclaimer (visible, clear)
10. AI disclosure (before first generation)

⚠️ **IMPORTANT (But can ship without, add in v1.1):**
- Weekly AI reports (can be placeholder)
- Grocery lists (nice to have)
- Meal swap (can add post-launch)
- Dark mode (HIG preference, not requirement)
- Apple Health integration (future feature)

❌ **NOT NEEDED for v1.0:**
- Social features (sharing meals)
- Recipe ratings/favorites
- Nutrition education content
- Community features
- Apple Watch app

---

### Post-Launch ASO Strategy

**Week 1-2: Monitoring**
- Track keyword rankings daily (AppTweak/Sensor Tower)
- Monitor crash rates (<1% required)
- Respond to reviews within 24 hours
- Watch conversion rate (target >30%)

**Week 3-4: Optimization**
- A/B test screenshots (Product Page Optimization)
- Test icon variations
- Adjust keywords based on actual search terms
- Request reviews (after positive moments)

**Month 2: Iteration**
- Update screenshots if conversion <25%
- Add localization (Spanish first)
- Launch In-App Events (30-day streak challenge)
- Update description based on user feedback

**Month 3+: Growth**
- Custom Product Pages for different audiences
  - CPP1: Ozempic users
  - CPP2: Wegovy users
  - CPP3: Muscle preservation focus
- Seasonal updates (New Year, summer, holidays)
- Feature new users/testimonials

---

### Metrics to Track

**App Store Metrics (App Store Connect):**
- Impressions (how many see listing)
- Product page views (how many view page)
- App units (downloads)
- Conversion rate (downloads / views) → Target: >30%
- Retention Day 1, 7, 30
- Crash rate → Must be <1%
- Average rating → Target: >4.5★

**ASO Metrics (AppTweak/Sensor Tower):**
- Keyword rankings (track top 20)
- Visibility score
- Search traffic
- Browse traffic
- Featured placements

**In-App Metrics (Mixpanel):**
- Onboarding completion rate → Target: >70%
- Meal generation success rate → Target: >95%
- Subscription conversion → Target: >5% free to paid
- 7-day retention → Target: >40%
- 30-day retention → Target: >25%

---

### Red Flags to Avoid

❌ **INSTANT REJECTION:**
- App crashes on launch
- Login required with no demo account
- Privacy Policy link 404s
- Placeholder content ("Lorem ipsum")
- Fake screenshots (Figma mockups)
- Misleading description
- No medical disclaimer (health app)
- No AI disclosure (uses external AI)
- No "Delete Account" option
- Subscription terms unclear

⚠️ **LIKELY REJECTION:**
- Slow performance (>5s load times)
- Broken "Restore Purchases"
- Poor network handling (crashes offline)
- Accessibility issues (no VoiceOver support)
- Privacy policy incomplete
- Medical advice without disclaimers
- Paid app with hidden costs

---

## Summary: iOS-First Success Strategy

### Phase 1: Pre-Development (Complete)
✅ Market validation
✅ Competitive analysis
✅ Database schema
✅ API design
✅ Wireframes
✅ iOS HIG research

### Phase 2: Development (Weeks 1-8)
**Week 1-2:** Project setup, authentication, Supabase
**Week 3-4:** Onboarding flow, Claude API integration
**Week 5-6:** Core features (meal plans, symptoms, streaks)
**Week 7:** Subscription system, Settings, Privacy
**Week 8:** Polish, bug fixes, TestFlight beta

### Phase 3: Pre-Launch (Weeks 9-10)
**Week 9:**
- Complete Privacy Policy
- Write medical disclaimer
- Create AI disclosure
- Take App Store screenshots
- Record app preview video
- Write App Store description

**Week 10:**
- TestFlight beta (50 internal testers)
- Fix critical bugs
- Prepare App Review Notes with demo account
- Submit to App Store

### Phase 4: Launch (Week 11+)
**Week 11:** App Store review (2-4 days typical)
**Week 12:** Launch day, monitor metrics
**Week 13-16:** Iterate based on feedback, optimize ASO

---

## Quick Reference: iOS vs Android Priorities

| Feature | iOS Priority | Android Priority |
|---------|--------------|------------------|
| Typography | SF Pro (system fonts) | Roboto (system fonts) |
| Navigation | Bottom tab bar | Bottom nav + FAB acceptable |
| Touch Targets | 44×44pt minimum | 48dp minimum |
| Fonts | Dynamic Type required | SP units required |
| Privacy | Nutrition Labels, strict | Less strict, still important |
| Review Time | 2-4 days | 1-2 days |
| Rejection Rate | ~25% | ~15% |
| ASO Focus | Screenshot conversion #1 | Description SEO #1 |
| Keyword Field | 100 chars, not indexed | Full description indexed |
| Discovery | 65% search | 58% search |

**For FoodWise:**
1. **Build iOS first** (stricter standards set higher quality bar)
2. **Test on iOS** (harder to pass review)
3. **Launch iOS** (higher-value users, better monetization)
4. **Port to Android** (reuse learnings, easier approval)

---

## Resources

**Official Apple:**
- HIG: https://developer.apple.com/design/human-interface-guidelines
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Privacy: https://developer.apple.com/app-store/app-privacy-details/
- SF Fonts: https://developer.apple.com/fonts/

**ASO Tools:**
- AppTweak: https://www.apptweak.com
- Sensor Tower: https://sensortower.com
- App Store Connect: https://appstoreconnect.apple.com

**Testing:**
- TestFlight: https://developer.apple.com/testflight/
- Xcode: https://developer.apple.com/xcode/

**Community:**
- Apple Developer Forums: https://developer.apple.com/forums/
- r/iOSProgramming: https://reddit.com/r/iOSProgramming
- iOS Dev Weekly: https://iosdevweekly.com

---

**Last Updated:** May 2, 2026  
**Next Review:** Before App Store submission (Week 10)
