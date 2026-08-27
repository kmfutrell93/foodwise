# FoodWise — App Store submission runbook

**Status (as of Aug 27, 2026):** Production build **finished**. EAS submit **`6e320e18…` → status `in queue`** (binary → ASC for build `123ae1fa…`). Remaining work: ASC metadata, legal Pages push, IAP wiring, screenshots, demo password.

**Demo account**

| Field | Value |
|-------|--------|
| Email | `demo@foodwise.app` |
| UUID | `2623b22e-b1eb-49b1-b2b5-2fb7b6f285c9` |
| Password | `[SET IN SUPABASE — FILL HERE]` |

**Production build to attach**

| Field | Value |
|-------|--------|
| Build ID | `123ae1fa-dc15-4659-afc4-788fcfba3fe8` |
| Version / build | `1.0.0` (3) |
| Profile | `production` · store · channel `production` |
| Commit | `690867740ea9d511d238bb9111d5edaea48311a0` |
| Logs | https://expo.dev/accounts/kmfutrell93/projects/foodwise/builds/123ae1fa-dc15-4659-afc4-788fcfba3fe8 |

---

## ✅ Already done (do not redo)

- [x] Critical fixes committed + pushed to `main` (`6908677`)
- [x] Edge functions redeployed (`meal-plans-generate`, `grocery-list-generate`) with `normalizeMealKey`
- [x] Demo account seeded (plan ready, grocery, symptoms, streak, weights, milestones, `is_pro`)
- [x] Production iOS build **finished** (`123ae1fa…`)
- [x] App source uses only live GitHub Pages privacy + terms URLs (no custom domain)

---

## What’s left (do in this order)

### 1) 🟡 Push legal GitHub Pages repo

Source files: `apps/foodwise-legal/` in the FoodWise App monorepo (Markdown matches live Pages).

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

**Verify (wait 1–2 min) — all must return HTTP 200:**

```bash
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/support
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/terms
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/privacy
```

Also open terms and confirm prices show **$12.99/month** and **$99.00/year**.

---

### 2) 🟡 Set demo password (Supabase dashboard)

1. [Supabase Dashboard](https://supabase.com/dashboard) → project `rxxgkhppeewudzalewgy`  
2. **Authentication → Users** → `demo@foodwise.app`  
3. Set / reset password  
4. Paste into this runbook table **and** into `APP_STORE_LISTING.md` App Review notes (look for the ⚠️ reminder)

---

### 3) 🟡 Take 5 screenshots

Follow **`SCREENSHOT_GUIDE.md`** — full-bleed **1290×2796**, demo account signed in.

Captions: injection schedule · medication · symptom/meal notes · grocery budget · streaks/progress.

---

### 4) 🟡 RevenueCat ↔ ASC IAP wiring (required for first submission)

Do this **before** submitting the version — first-app submission needs IAP subscriptions attached to the version.

1. **ASC → My Apps → FoodWise → App Information**  
   Generate **App-Specific Shared Secret** (Subscriptions). Copy it.  
2. **ASC → Users and Access → Integrations → In-App Purchase**  
   Create an In-App Purchase Key → download `.p8` → note **Key ID** + **Issuer ID**.  
3. **ASC → Features → In-App Purchases** (or Subscriptions)  
   Confirm Monthly (~$12.99) and Annual (~$99) auto-renewable subscriptions exist, localized, and are **Ready to Submit**.  
4. **RevenueCat → Project → iOS app (app.foodwise.ios)**  
   - Paste App-Specific Shared Secret  
   - Upload In-App Purchase key (`.p8` + Key ID + Issuer ID)  
   - Confirm product IDs match StoreKit / RC offerings used by the paywall  
5. **ASC → version 1.0**  
   Attach both subscription products to this version (first submission requirement).

---

### 5) 🟡 App Store Connect — version 1.0 checklist

1. Open ASC → FoodWise (`ascAppId` **6770304357**) → create/open **1.0** version  
2. Paste listing from **`APP_STORE_LISTING.md`** (name, subtitle, keywords, description, promo, What’s New)  
3. Support URL: `https://kmfutrell93.github.io/foodwise-legal/support` *(only after §1 shows 200)*  
4. Privacy Policy: `https://kmfutrell93.github.io/foodwise-legal/privacy`  
5. App Privacy questionnaire → **`APP_PRIVACY_ANSWERS.md`**  
6. Upload 5 screenshots (6.7")  
7. **Build:** select / attach **`123ae1fa-dc15-4659-afc4-788fcfba3fe8`** (1.0.0 build 3) once processed in ASC  
8. **IAP:** attach Monthly + Annual subscriptions to this version  
9. **App Review Information** — paste full notes from `APP_STORE_LISTING.md` with real demo password  
10. Age Rating / Content Rights / Export Compliance (encryption: non-exempt = No; already in `app.json`)  
11. **Add for Review → Submit**

If `eas submit` already uploaded the binary, you only need to wait for ASC processing, then select that build on the version.

Check submit status:

```bash
cd "/Users/kenny/Documents/FoodWise App/mobile"
npx eas-cli@latest submit:list -p ios --limit 5
```

---

## Quick “only left” checklist

- [ ] Push `foodwise-legal` (terms pricing + support.html) + verify 3 URLs = 200  
- [ ] Set demo password → paste into review notes  
- [ ] 5 screenshots  
- [ ] ASC/RevenueCat IAP wiring + attach subs to version 1.0  
- [ ] ASC: paste listing + privacy answers + screenshots + build `123ae1fa…` + review notes  
- [ ] Submit for review  
