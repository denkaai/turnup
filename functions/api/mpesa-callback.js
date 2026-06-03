import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const headers = { 'Content-Type': 'application/json' };

  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return new Response('Invalid callback', { status: 400 });
    }

    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = callback;

    // Payment successful
    if (ResultCode === 0) {
      const meta = {};
      CallbackMetadata?.Item?.forEach((item) => {
        meta[item.Name] = item.Value;
      });

      const { Amount, MpesaReceiptNumber, PhoneNumber } = meta;

      // Determine plan from amount
      let plan = 'free';
      let daysToAdd = 0;
      if (Amount === 150) { plan = 'weekly'; daysToAdd = 7; }
      if (Amount === 499) { plan = 'monthly'; daysToAdd = 30; }

      // Update user in Supabase using service role key (backend bypass)
      const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
          .from('payments')
          .insert({
            checkout_request_id: CheckoutRequestID,
            mpesa_receipt: MpesaReceiptNumber,
            phone: PhoneNumber,
            amount: Amount,
            plan,
            status: 'success',
          });

        if (error) {
          console.error('Supabase insert error in payment callback:', error);
        } else {
          console.log(`Payment confirmed and saved: ${MpesaReceiptNumber} - ${Amount} KSh for ${plan}`);
        }
      } else {
        console.error('Supabase configuration missing in payment callback');
      }
    } else {
      console.log(`Payment failed callback received: ${ResultDesc}`);
    }

    // Always return 200 to Safaricom
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Callback error:', err);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers }
    );
  }
}
