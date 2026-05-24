const { createClient } = require('@supabase/supabase-js')

exports.handler = async () => {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    // Simple lightweight ping — just count profiles
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Keep-alive ping failed:', error.message)
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) }
    }

    console.log(`Keep-alive ping successful. Profiles count: ${count}`)
    return { statusCode: 200, body: JSON.stringify({ ok: true, profiles: count, time: new Date().toISOString() }) }

  } catch (err) {
    console.error('Keep-alive error:', err)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) }
  }
}
