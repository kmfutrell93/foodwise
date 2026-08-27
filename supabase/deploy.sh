#!/usr/bin/env bash
# Deploy FoodWise Supabase backend
# Prerequisites: supabase CLI installed, logged in, project linked

set -e

# Auto-load secrets from .env.local if present (never commit that file)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.local" ]; then
  set -a
  source "$SCRIPT_DIR/.env.local"
  set +a
  echo "→ Loaded secrets from .env.local"
fi

PROJECT_REF="rxxgkhppeewudzalewgy"
IMPORT_MAP="/Users/kenny/Documents/FoodWise App/supabase/functions/import_map.json"

echo "→ Linking project..."
supabase link --project-ref $PROJECT_REF

echo "→ Setting secrets..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "  ⚠️  ANTHROPIC_API_KEY not set — run: export ANTHROPIC_API_KEY=sk-ant-..."
else
  supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
  echo "  ✓ ANTHROPIC_API_KEY set"
fi

if [ -z "$REVENUECAT_WEBHOOK_SECRET" ]; then
  echo "  ⚠️  REVENUECAT_WEBHOOK_SECRET not set — run: export REVENUECAT_WEBHOOK_SECRET=..."
  echo "     Get it from: RC Dashboard → Project Settings → Integrations → Webhooks"
else
  supabase secrets set REVENUECAT_WEBHOOK_SECRET="$REVENUECAT_WEBHOOK_SECRET"
  echo "  ✓ REVENUECAT_WEBHOOK_SECRET set"
fi

echo "→ Deploying edge functions..."
# AI / meal functions (require user JWT)
supabase functions deploy meal-plans-generate    --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy meal-plans-swap        --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy symptoms-insights      --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy grocery-list-generate  --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy weekly-report          --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy recipe-generate        --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy recipes                --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy delete-account         --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy emergency-meal         --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy escalation-status      --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy weight-logs            --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy smart-fridge           --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt

# Webhook (no JWT — RevenueCat calls this directly)
supabase functions deploy revenuecat-webhook     --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt

# Cron / push functions (called by pg_cron with service role — no user JWT)
supabase functions deploy push-weekly-report     --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy push-injection-day     --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt
supabase functions deploy push-reengagement      --project-ref $PROJECT_REF --import-map "$IMPORT_MAP" --no-verify-jwt

echo ""
echo "✅ Deployment complete ($(date '+%Y-%m-%d %H:%M'))."
echo ""
echo "Remaining manual steps:"
echo "  1. Run add-pro-columns.sql in Supabase SQL editor"
echo "  2. Set up pg_cron jobs (see comments inside each push-* function)"
echo "  3. Configure RC webhook URL in RevenueCat dashboard:"
echo "     https://$PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook"
echo "  4. Run seed-demo-account.sql after creating demo@foodwise.app"
echo ""
echo "Then: cd apps/mobile && npx expo start --ios"
