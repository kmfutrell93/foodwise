import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set REVENUECAT_WEBHOOK_SECRET in Supabase secrets (Dashboard → Edge Functions → Secrets)
// Get the value from RevenueCat Dashboard → Project Settings → Integrations → Webhooks → Authorization header
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  // RevenueCat sends POST only — no CORS preflight needed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Fail closed: if the secret is not configured, reject all requests
  // rather than letting them through. Set REVENUECAT_WEBHOOK_SECRET in
  // Supabase Dashboard → Edge Functions → Secrets before deploying.
  if (!WEBHOOK_SECRET) {
    console.error('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET is not set — rejecting request');
    return new Response('Service unavailable', { status: 503 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const event = body.event as Record<string, unknown> | undefined;
  if (!event) return new Response('ok', { status: 200 });

  const eventType = event.type as string;
  const appUserId = event.app_user_id as string | undefined;
  const productId = (event.product_id ?? event.original_transaction_store_product_id) as string | undefined;

  if (!appUserId) return new Response('ok', { status: 200 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  switch (eventType) {
    // Trial started or initial purchase
    case 'INITIAL_PURCHASE':
    case 'TRIAL_STARTED': {
      await admin.from('profiles').update({
        is_pro: true,
        pro_product_id: productId ?? null,
        pro_since: new Date().toISOString(),
      }).eq('id', appUserId);
      break;
    }

    // Trial converted to paid
    case 'RENEWAL':
    case 'PRODUCT_CHANGE': {
      await admin.from('profiles').update({
        is_pro: true,
        pro_product_id: productId ?? null,
      }).eq('id', appUserId);
      break;
    }

    // Subscription cancelled (still active until period end)
    case 'CANCELLATION': {
      const expiresAt = event.expiration_at_ms
        ? new Date(event.expiration_at_ms as number).toISOString()
        : null;
      await admin.from('profiles').update({
        pro_expires_at: expiresAt,
      }).eq('id', appUserId);
      break;
    }

    // Expired, billing issue, or refund — revoke access
    case 'EXPIRATION':
    case 'BILLING_ISSUE':
    case 'REFUND': {
      await admin.from('profiles').update({
        is_pro: false,
        pro_product_id: null,
        pro_expires_at: null,
      }).eq('id', appUserId);
      break;
    }

    default:
      break;
  }

  return new Response('ok', { status: 200 });
});
