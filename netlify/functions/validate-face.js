exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  try {
    const { image } = JSON.parse(event.body)
    if (!image) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required field: image' }) }

    const apiKey = process.env.NVIDIA_API_KEY
    // Fail open if key not configured — do not block users from uploading photos
    if (!apiKey) {
      console.warn('NVIDIA_API_KEY not set — skipping face validation, allowing upload')
      return { statusCode: 200, headers, body: JSON.stringify({ valid: true, reason: 'Validation skipped: API key not configured' }) }
    }

    const imageDataUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nvidia/llama-3.2-90b-vision-instruct',
        messages: [{ role: 'user', content: [
          { type: 'text', text: `You are a profile picture verification bot. Analyse if this image contains a clear profile photo of a real human face. Strictly reject objects, logos, text, cartoons, animals, scenery, AI-generated art, or blank images. Respond ONLY with valid JSON: { "valid": boolean, "reason": "short explanation" }` },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]}],
        max_tokens: 256, temperature: 0.1, stream: false
      })
    })

    // Fail open on API errors so users are never hard-blocked
    if (!response.ok) {
      console.warn('NVIDIA API failed — failing open')
      return { statusCode: 200, headers, body: JSON.stringify({ valid: true, reason: 'Validation unavailable, upload allowed' }) }
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      return { statusCode: 200, headers, body: JSON.stringify({ valid: true, reason: 'Could not parse validation response' }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify(result) }
  } catch (err) {
    console.error('Face validation error:', err)
    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, reason: 'Validation error — upload allowed' }) }
  }
}
