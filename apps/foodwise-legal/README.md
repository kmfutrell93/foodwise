# Legal Pages — copy these into kmfutrell93/foodwise-legal

Pages repo renders **Markdown** (`privacy.md`, `terms.md`) via GitHub Pages. Keep the same `# Title` + metadata header format as live pages.

## Files to copy (from this folder → legal repo root)

| This monorepo path | Destination in foodwise-legal |
|--------------------|-------------------------------|
| `apps/foodwise-legal/terms.md` | `terms.md` (pricing: **$12.99/month**, **$99.00/year**) |
| `apps/foodwise-legal/support.html` | `support.html` (new Support URL) |
| `apps/foodwise-legal/privacy.md` | `privacy.md` (optional sync; no pricing; safe to overwrite) |

Do **not** need HTML for privacy/terms — live site already uses `.md`.

## Exact git commands

```bash
# 1. Clone (or cd into your existing clone)
git clone https://github.com/kmfutrell93/foodwise-legal.git
cd foodwise-legal

# 2. Copy files from the FoodWise App monorepo
FW="/Users/kenny/Documents/FoodWise App/apps/foodwise-legal"
cp "$FW/terms.md" ./terms.md
cp "$FW/support.html" ./support.html
cp "$FW/privacy.md" ./privacy.md   # optional but recommended

# 3. Commit + push
git status
git add terms.md support.html privacy.md
git commit -m "$(cat <<'EOF'
Update Terms pricing to $12.99/$99 and add Support page

EOF
)"
git push origin main
```

## Verify after push (wait ~1–2 min for Pages)

- https://kmfutrell93.github.io/foodwise-legal/terms → must show **$12.99/month** and **$99.00/year**
- https://kmfutrell93.github.io/foodwise-legal/support → FAQ + support@foodwise.app (**200**)
- https://kmfutrell93.github.io/foodwise-legal/privacy → still **200**, no $11.99/$59.99
