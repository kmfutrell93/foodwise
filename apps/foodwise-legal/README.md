# Legal Pages — copy these into kmfutrell93/foodwise-legal

Pages repo renders **Markdown** (`privacy.md`, `terms.md`) via GitHub Pages — same `# Title` + metadata header as live pages. `support.html` is plain HTML (fine alongside).

**Do not change domains** — keep `https://kmfutrell93.github.io/foodwise-legal/...` everywhere until a custom domain is ready.

## Files to copy (this folder → legal repo root)

| This monorepo path | Destination |
|--------------------|-------------|
| `terms.md` | `terms.md` — **$12.99/month**, **$99.00/year** |
| `support.html` | `support.html` — FAQ + support@foodwise.app |
| `privacy.md` | `privacy.md` — optional sync; no pricing |

## Exact git commands

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

## Verify after push (wait 1–2 min)

```bash
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/support
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/terms
curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" https://kmfutrell93.github.io/foodwise-legal/privacy
```

All three must be **200**. Terms page must show **$12.99/month** and **$99.00/year** (not $11.99 / $59.99).
