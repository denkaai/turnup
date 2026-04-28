// Netlify Function: M-Pesa Payment Callback
// Safaricom calls this URL after payment is confirmed/failed
// ENV vars needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    const callback = body?.Body?.stkCallback

    if (!callback) {
      return { statusCode: 400, body: 'Invalid callback' }
    }

    const { ResultCode, ResultDesc, CallbackMetadata, MerchantRequestID, CheckoutRequestID } = callback

    // Payment successful
    if (ResultCode === 0) {
      const meta = {}
      CallbackMetadata?.Item?.forEach((item) => {
        meta[item.Name] = item.Value
      })

      const { Amount, MpesaReceiptNumber, PhoneNumber } = meta

      // Determine plan from amount
      let plan = 'free'
      let daysToAdd = 0
      if (Amount === 150) { plan = 'weekly'; daysToAdd = 7 }
      if (Amount === 499) { plan = 'monthly'; daysToAdd = 30 }

      // Update user in Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const premiumUntil = new Date()
      premiumUntil.setDate(premiumUntil.getDate() + daysToAdd)

      // Find user by phone or CheckoutRequestID stored in a payments table
      const { error } = await supabase
        .from('payments')
        .insert({
          checkout_request_id: CheckoutRequestID,
          mpesa_receipt: MpesaReceiptNumber,
          phone: PhoneNumber,
          amount: Amount,
          plan,
          status: 'success',
        })

      if (error) console.error('Supabase insert error:', error)

      console.log(`Payment confirmed: ${MpesaReceiptNumber} - ${Amount} KSh for ${plan}`)
    } else {
      console.log(`Payment failed: ${ResultDesc}`)
    }

    // Always return 200 to Safaricom
    return { statusCode: 200, body: JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }) }
  } catch (err) {
    console.error('Callback error:', err)
    return { statusCode: 200, body: JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }) }
  }
}
