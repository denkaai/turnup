export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { phone, amount, plan, userId } = await request.json();

    if (!phone || !amount || !plan) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
    }

    const consumerKey = env.MPESA_CONSUMER_KEY;
    const consumerSecret = env.MPESA_CONSUMER_SECRET;
    const shortcode = env.MPESA_SHORTCODE || '174379';
    const passkey = env.MPESA_PASSKEY;
    const callbackUrl = env.MPESA_CALLBACK_URL || 'https://turnup-4bl.pages.dev/api/mpesa-callback';

    if (!consumerKey || !consumerSecret || !passkey) {
      return new Response(
        JSON.stringify({ error: 'M-Pesa payment configuration missing' }),
        { status: 500, headers }
      );
    }

    // 1. Get access token using btoa for base64 encoding (native in Cloudflare Workers)
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('M-Pesa Auth Error:', errorText);
      return new Response(JSON.stringify({ error: 'M-Pesa authentication failed' }), { status: tokenRes.status, headers });
    }

    const { access_token } = await tokenRes.json();

    // 2. Build STK push request
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phone,
          PartyB: shortcode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: `TURNUP-${userId || 'user'}`,
          TransactionDesc: `TurnUp ${plan} plan`,
        }),
      }
    );

    if (!stkRes.ok) {
      const errorText = await stkRes.text();
      console.error('M-Pesa STK Error:', errorText);
      return new Response(JSON.stringify({ error: 'M-Pesa STK request failed', details: errorText }), { status: stkRes.status, headers });
    }

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      return new Response(
        JSON.stringify({ success: true, checkoutRequestId: stkData.CheckoutRequestID }),
        { status: 200, headers }
      );
    } else {
      return new Response(
        JSON.stringify({ error: stkData.CustomerMessage || stkData.errorMessage || 'STK push failed' }),
        { status: 400, headers }
      );
    }
  } catch (err) {
    console.error('M-Pesa error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
}
