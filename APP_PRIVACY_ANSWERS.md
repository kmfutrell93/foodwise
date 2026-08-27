# FoodWise — App Privacy (App Store Connect) answers

Based on what the **code actually collects and sends** as of the pre-submission audit. Update if you add HealthKit, ATT, or new SDKs.

---

## Do you or your third-party partners collect data from this app?

**Yes**

---

## Data types collected

### 1. Contact Info

| Subtype | Collect? | Linked to identity? | Used for tracking? | Purposes |
|---------|----------|---------------------|--------------------|----------|
| **Email Address** | Yes (optional — create-account / sign-in) | **Yes** (account) | **No** | App Functionality, Account Management |
| Name | Yes (optional first name / profile) | **Yes** | **No** | App Functionality |
| Phone Number | **No** | — | — | — |
| Physical Address | **No** | — | — | — |

**Notes:** Anonymous auth is default; email is only stored when the user creates an account (`auth.updateUser` + `profiles.email`).

---

### 2. Health & Fitness

| Subtype | Collect? | Guidance |
|---------|----------|----------|
| **Health** | **Declare carefully** | We collect **self-reported** medication type, dose, injection day, appetite, food aversions, dietary restrictions, and **symptom logs** (nausea, fatigue, etc.). This is **not** HealthKit data and is **not** clinical records. |
| **Fitness** | Optional / No | Weight logs are optional (`weight_logs`). If you declare Fitness → Weight, mark Linked to Identity = Yes, Tracking = No, Purpose = App Functionality. |

**Recommended ASC mapping (honest, conservative):**

- Declare **Health** → Other Health Data (or “Other User Content” if you prefer to avoid “Health” — but Apple reviewers often expect health-adjacent disclosure for symptom/medication apps).
- **Linked to User:** Yes  
- **Used for Tracking:** No  
- **Purposes:** App Functionality (personalize meal plans / insights)  
- **Not** used for Advertising, **not** sold.

Do **not** claim HealthKit / Clinical Health Records — HealthKit is not integrated.

---

### 3. Purchases

| Subtype | Collect? | Linked? | Tracking? | Purposes |
|---------|----------|---------|-----------|----------|
| **Purchase History** | Yes (via RevenueCat / Apple) | Yes (RC app user id ↔ Supabase user) | No | App Functionality, Analytics (subscription status) |

We do **not** store payment card numbers. Apple processes IAP; RevenueCat receives anonymous/app user id + entitlement events; webhook may set `is_pro` via service role.

---

### 4. Identifiers

| Subtype | Collect? | Linked? | Tracking? | Purposes |
|---------|----------|---------|-----------|----------|
| **User ID** | Yes (Supabase auth UUID) | Yes | No | App Functionality |
| **Device ID** | Indirect (Expo push token if notifications enabled) | Yes | No | App Functionality (push delivery) |
| **Advertising Data / IDFA** | **No** | — | — | Mixpanel configured without ATT/IDFA; no `NSUserTrackingUsageDescription` |

---

### 5. Usage Data

| Subtype | Collect? | Linked? | Tracking? | Purposes |
|---------|----------|---------|-----------|----------|
| **Product Interaction** | Yes (Mixpanel events: onboarding steps, meals viewed, symptoms logged, paywall shown, etc.) | Yes (identified with user id after login) | **No** (not cross-app advertising) | Analytics, App Functionality / product improvement |
| **Advertising Data** | No | — | — | — |
| **Other Usage Data** | Same as above | Yes | No | Analytics |

**Tracking definition (Apple):** “Tracking” = linking data with third-party data for advertising / sharing with data brokers. FoodWise does **not** do that. Answer **Used for Tracking = No** for Mixpanel usage events.

---

### 6. Diagnostics

| Subtype | Collect? | Notes |
|---------|----------|-------|
| Crash Data | Possibly via Expo / OS | If you enable a crash reporter later, update this. Default Expo may not send identifiable crash reports to you. |
| Performance Data | No dedicated APM found in code | — |
| Other Diagnostic Data | No | — |

---

### 7. Sensitive Info / Other

| Type | Collect? |
|------|----------|
| Financial Info (beyond IAP via Apple) | No |
| Location | No |
| Contacts / Photos / Camera / Mic | No |
| Browsing History | No |
| Search History | No |

**User Content:** Meal plans, grocery lists, symptom notes, AI-generated insights — declare as **User Content** / Other User Content if asked; Linked = Yes; Tracking = No; Purpose = App Functionality.

---

## Third parties that receive data

| Partner | Data | Purpose |
|---------|------|---------|
| **Supabase** | Profile, logs, plans, auth | Backend / storage |
| **Anthropic** | Medication, preferences, symptoms (per request for generation) | AI meal plans & insights — not for Anthropic training per their API terms; still disclose as processing |
| **RevenueCat** | App user id, subscription events | Purchases |
| **Mixpanel** | User id + product events (no symptom payload in most track calls — verify over time) | Analytics |
| **Apple / Expo** | Push token, IAP | Notifications / billing |

---

## Privacy Policy URL

`https://kmfutrell93.github.io/foodwise-legal/privacy`  
(Must match “Privacy Policy” in App Store Connect and in-app.)

---

## Quick checklist for the ASC form

1. Collect data? → **Yes**  
2. Tracking? → **No** (no ATT, no IDFA, no ad networks)  
3. Email → Yes, linked, not tracking  
4. Health-adjacent (medication/symptoms) → Yes, linked, not tracking, App Functionality  
5. Purchases → Yes via Apple/RC  
6. Product Interaction (Mixpanel) → Yes, linked, not tracking, Analytics  
7. Data used to track user? → **No** for all types  

If Apple’s questionnaire wording changes, map to the same facts: **we personalize nutrition features; we don’t sell data or track across apps.**
