# FoodWise — App Store submission runbook

Do these steps **in order**. Items marked 🟡 are manual-only (portal / device / your git credentials).

**Demo account**

| Field | Value |
|-------|--------|
| Email | `demo@foodwise.app` |
| UUID | `2623b22e-b1eb-49b1-b2b5-2fb7b6f285c9` |
| Password | `[SET IN SUPABASE — FILL HERE]` |

---

## 0) CRITICAL — Commit (or build from this machine’s working tree)

Recent fixes live in the **local working tree** and are **not all on `origin/main`**.  
`eas build` uploads your local `mobile/` project (including uncommitted files that aren’t gitignored).

**Strongly recommended before building:**

```bash
cd "/Users/kenny/Documents/FoodWise App"
git status
# Review, then commit everything needed for production (ask Cursor to commit if you want)
git add mobile/ supabase/ APP_STORE_LISTING.md APP_PRIVACY_ANSWERS.md SCREENSHOT_GUIDE.md SUBMISSION_RUNBOOK.md apps/foodwise-legal/
git commit -m "$(cat <<'EOF'
Ship App Store prep: polling generation, onboarding order, meal-plan header, legal + listing docs

EOF
)"
git push origin main
```

If you skip commit, run the EAS build **from this Mac** with the current dirty tree so those files are packaged. Do **not** build from a clean CI checkout of old `main`.

Fixes that must be in the iOS binary source:

| Fix | File(s) | In working tree? | On origin/main? |
|-----|---------|------------------|-----------------|
| Fire-and-forget + DB polling | `mobile/lib/generate-plan.ts` (untracked), used by meal-plan / home / 13-generating | ✅ | ❌ |
| Onboarding: habit before generate | `mobile/constants/onboardingFlow.ts` (untracked) | ✅ | ❌ |
| Meal plan header Grocery (not Fiber) | `mobile/app/(app)/meal-plan.tsx` (modified) | ✅ | ❌ (old has Fiber) |
| meal_key normalize (server) | `supabase/functions/_shared/generate-ingredients.ts` | ✅ | ❌ — already deploy to Supabase separately |

Server `meal_key` fix is **not** part of the iOS binary; confirm edge functions are deployed:

```bash
cd "/Users/kenny/Documents/FoodWise App"
# If unsure whether live functions include normalizeMealKey, redeploy:
./supabase/deploy.sh   # or your usual supabase functions deploy
```

---

## 1) 🟡 Set demo password (Supabase dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project `rxxgkhppeewudzalewgy`  
2. **Authentication → Users** → find `demo@foodwise.app`  
3. Reset / set password (or “Send password recovery” then set known password)  
4. Paste password into the table at the top of this runbook **and** into ASC Review Notes  

Seed data is already applied (plan ready, grocery, symptoms, streak, weights, milestones, recommendation, `is_pro`).

---

## 2) 🟡 Push legal GitHub Pages repo

Source files ready in the monorepo: `apps/foodwise-legal/`

```bash
git clone https://github.com/kmfutrell93/foodwise-legal.git
cd foodwise-legal

FW="/Users/kenny/Documents/FoodWise App/apps/foodwise-legal"
cp "$FW/terms.md" ./terms.md
cp "$FW/support.html" ./support.html
cp "$FW/privacy.md" ./privacy.md

git add terms.md support.html privacy.md
git commit -m "$(cat <<'EOF'
Update Terms pricing to $12.99/$99 and add Support page

EOF
)"
git push origin main
```

**Verify (wait 1–2 min):**

- https://kmfutrell93.github.io/foodwise-legal/terms → $12.99 / $99.00  
- https://kmfutrell93.github.io/foodwise-legal/support → 200  
- https://kmfutrell93.github.io/foodwise-legal/privacy → 200  

---

## 3) 🟡 Production build

```bash
cd "/Users/kenny/Documents/FoodWise App/mobile"
npx tsc --noEmit          # expect 0 errors
npx expo-doctor           # expect 18/18
eas build --platform ios --profile production
```

When the build finishes, optionally:

```bash
eas submit --platform ios --profile production --latest
```

Or download the `.ipa` / use the Expo dashboard → Submit to ASC.

---

## 4) 🟡 Screenshots

Follow **`SCREENSHOT_GUIDE.md`** — 5 full-bleed shots at **1290×2796**, demo account signed in.

---

## 5) 🟡 App Store Connect — listing + privacy + screenshots + review notes

1. Open App Store Connect → FoodWise (`ascAppId` **6770304357**)  
2. Paste copy from **`APP_STORE_LISTING.md`** (name, subtitle, keywords, description, promo, What’s New)  
3. Support URL: `https://kmfutrell93.github.io/foodwise-legal/support`  
4. Privacy Policy URL: `https://kmfutrell93.github.io/foodwise-legal/privacy`  
5. Fill App Privacy questionnaire using **`APP_PRIVACY_ANSWERS.md`**  
6. Upload the 5 screenshots (6.7")  
7. **App Review Information** — demo credentials:

```
Email: demo@foodwise.app
Password: [YOUR DEMO PASSWORD]

See APP_STORE_LISTING.md “App Review notes” for the full review flow text
(not medical advice, core paths to test, Restore Purchases, do not delete demo).
```

8. Attach the production build once processing completes  

---

## 6) 🟡 RevenueCat ↔ ASC IAP wiring

From `TODO_BEFORE_APP_STORE.md`, expanded:

1. **ASC → App Information** → generate **App-Specific Shared Secret**  
2. **ASC → Users and Access → Integrations → In-App Purchase** → create IAP key (`.p8`), note Key ID + Issuer ID  
3. **ASC → Features → In-App Purchases** → ensure Monthly (~$12.99) and Annual (~$99) products exist and are Ready to Submit  
4. **RevenueCat** → iOS app settings:  
   - Paste App-Specific Shared Secret  
   - Upload In-App Purchase key (`.p8` + Key ID + Issuer ID)  
   - Confirm product IDs match StoreKit / paywall offerings  
5. Smoke-test Restore Purchases on a TestFlight / sandbox build if possible  

---

## 7) 🟡 Submit for review

1. Complete Age Rating, Content Rights, Export Compliance (`ITSAppUsesNonExemptEncryption: false` already in app.json)  
2. Select the build → **Add for Review** → **Submit**  
3. Watch for “Waiting for Review”  

---

## Quick checklist

- [ ] Working-tree fixes committed **or** EAS built from this dirty tree  
- [ ] Edge functions (meal_key) confirmed deployed  
- [ ] Demo password set + written in ASC notes  
- [ ] Legal Pages: terms pricing + support live  
- [ ] Production iOS build green  
- [ ] 5 screenshots uploaded  
- [ ] Listing + privacy questionnaire pasted  
- [ ] RevenueCat ↔ ASC wired  
- [ ] Submitted  
