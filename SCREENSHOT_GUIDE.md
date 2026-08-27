# FoodWise — App Store screenshot capture guide

Capture on a **physical iPhone** signed in as the demo account. App is **iPhone-only** (`supportsTablet: false`).

---

## Required sizes

Upload at least the **6.7"** set (required for modern iPhone apps):

| Display | Resolution (portrait) | Typical devices |
|---------|----------------------|-----------------|
| **6.7"** (required) | **1290 × 2796** | iPhone 15/16 Pro Max, 14 Pro Max |
| 6.5" (optional if ASC asks) | 1284 × 2778 | iPhone 11 Pro Max / XS Max |
| 6.1" (optional) | 1179 × 2556 | iPhone 15/16 Pro, 14 Pro |

**How to get 1290×2796:** Use an iPhone 15/16 Pro Max (or Max). Screenshots on those devices are already the right pixel size. If you only have a 6.1" Pro, capture there and upscale carefully in a design tool to 1290×2796 — or borrow a Max for submission day.

**Frame vs bleed:** Upload **full-bleed screenshots** (no fake device bezel). Apple / ASC marketing layouts can add frames later. Overlay the caption headline in a tool (Figma, Apple’s screenshot templates, or Shotbot) — keep the app UI clean underneath.

---

## Before you start

1. Sign in: `demo@foodwise.app` + your demo password  
2. Confirm Home shows today’s meals, Meal Plan has 7 days, Grocery has sections + total ~$72.50  
3. Turn on **Do Not Disturb** / hide Dynamic Island notifications  
4. Prefer **light mode** (app is `userInterfaceStyle: light`)  
5. Close any paywall overlays before capturing feature screens  

---

## The 5 screens (in order)

### 1 — Home  
**Caption:** Meals that know your injection schedule  

**State:** Demo signed in; Home tab. Prefer a day that shows meals (if today is Monday, injection banner is a plus).  

**Visible:** Nori / today meals, protein progress, clear “today” meals list.  
**Scroll:** Top of Home — don’t scroll past the first meal cards.  
**Avoid:** Empty states, error toasts, “generating…”  

---

### 2 — Meal Plan  
**Caption:** Personalized to your medication  

**State:** Meal Plan tab. Select **Monday** (injection day) so the injection banner shows.  

**Visible:** Injection-day banner, day pills (Mon–Sun), Protein / Calories / Grocery macros, 2–3 meal cards with names + protein.  
**Scroll:** Just enough that macros + first 2 meals are on screen.  
**Avoid:** Swap modal open, empty week, Fiber label (should say Grocery).  

---

### 3 — Symptom Tracker  
**Caption:** Track symptoms, get smarter plans  

**State:** Symptom Tracker. Scroll so the **insight / recommendation card** is visible (demo has `latest_symptom_recommendation`).  

**Visible:** Insight text + recent log history (14 days seeded).  
**Scroll:** Insight card + a few log rows.  
**Avoid:** Empty insight, keyboard open.  

---

### 4 — Grocery List  
**Caption:** Shopping lists that stay in budget  

**State:** Grocery tab. List loaded with sections.  

**Visible:** Estimated total (~$72.50), at least 2 category sections (e.g. Proteins, Produce), checkable items.  
**Scroll:** Header with total + first section fully visible.  
**Avoid:** “Generating grocery…” spinner, empty sections.  

---

### 5 — Progress  
**Caption:** Build streaks. See progress.  

**State:** Progress tab.  

**Visible:** **7-day streak**, weight trend (198 → 191-ish), milestones (first_log, 7day_streak, first_insight).  
**Scroll:** Streak + weight chart/cards in first viewport if possible.  
**Avoid:** Empty progress / zero streak.  

---

## How to capture on a physical iPhone

1. Navigate to the screen and compose the scroll position.  
2. **iPhone with Face ID:** Side button + Volume Up together.  
3. Screenshot lands in **Photos → Recents** (also appears as a thumbnail briefly).  
4. AirDrop / cable to Mac → save as PNG.  
5. Optional: overlay caption in Figma at 1290×2796, export PNG for ASC.  

**File naming (suggested):**

```
01-home-injection.png
02-meal-plan-monday.png
03-symptoms-insight.png
04-grocery-budget.png
05-progress-streak.png
```

---

## Caption headlines (copy-paste)

1. Meals that know your injection schedule  
2. Personalized to your medication  
3. Track symptoms, get smarter plans  
4. Shopping lists that stay in budget  
5. Build streaks. See progress.  
