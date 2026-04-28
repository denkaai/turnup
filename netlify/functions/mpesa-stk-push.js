// Netlify Function: M-Pesa Daraja STK Push
// ENV vars needed: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL

exports.handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const { phone, amount, plan, userId } = JSON.parse(event.body)

    if (!phone || !amount || !plan) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) }
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://your-site.netlify.app/api/mpesa-callback'

    // 1. Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    )
    const { access_token } = await tokenRes.json()

    // 2. Build STK push request
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

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
    )

    const stkData = await stkRes.json()

    if (stkData.ResponseCode === '0') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, checkoutRequestId: stkData.CheckoutRequestID }),
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: stkData.errorMessage || 'STK push failed' }),
      }
    }
  } catch (err) {
    console.error('M-Pesa error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
