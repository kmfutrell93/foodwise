# FoodWise celebration Lottie assets

Calm, moderate celebration animations used by `<Celebration />` on Home (and Symptom Tracker for log success).

## License summary

| File | Source | License | Notes |
|------|--------|---------|-------|
| `confetti.json` | **Original FoodWise asset** (generated for this app) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Teal/mint/amber confetti fall — play once |
| `success.json` | **Original FoodWise asset** (generated for this app) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Teal circle + white check pop |
| `streak-flame.json` | **Original FoodWise asset** (generated for this app) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Soft flame scale pulse |

These originals were authored in-repo because automated download from LottieFiles CDN returned 403 in our environment. They are intentionally simple and free of third-party claims.

### Optional LottieFiles Simple License swaps

If you prefer community art under the [Lottie Simple License](https://lottiefiles.com/page/license), replace the JSON files above with downloads from:

| Role | Free LottieFiles page (Simple License) |
|------|----------------------------------------|
| Confetti / success | [Success Checkmark Celebration – Confetti Confirmation](https://lottiefiles.com/free-animation/success-checkmark-celebration-confetti-confirmation-OaZF9h03PS) by Shreyas Mookamale |
| Checkmark + confetti | [Checkmark with confetti](https://lottiefiles.com/free-animation/checkmark-with-confetti-IDnMD1kYEN) by Adela Trifan |
| Flame / fire | Search LottieFiles for free “flame” / “fire” animations marked **Free to use under the Lottie Simple License**, then save as `streak-flame.json` |

Keep filenames the same (`confetti.json`, `success.json`, `streak-flame.json`) so `Celebration` imports stay valid.

## Usage rules

- Event-triggered only (no loops, no autoplay on mount).
- Respect `reduceMotion`: no playback — static final frame or nothing.
- Requires a **new native build** after adding `lottie-react-native` (not OTA-safe for first install).
