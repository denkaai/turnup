// Netlify Function: Validate profile photo containing human face using NVIDIA NIM Vision model
// ENV vars needed: NVIDIA_API_KEY

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
    const { image } = JSON.parse(event.body)

    if (!image) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Missing required field: image' }) 
      }
    }

    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }) 
      }
    }

    // Prepare image data URL if it's just raw base64
    const imageDataUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.2-90b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a profile picture verification bot. Analyse if this image contains a clear profile photo of a real human face.
                Strictly reject images that are objects, logos, text, cartoons, animal photos, scenery/landscapes, AI-generated/abstract art, or blank. 
                The face must be clearly visible and recognizable as a human person.
                
                Respond ONLY with a valid JSON object.
                Format:
                {
                  "valid": boolean,
                  "reason": "short explanation"
                }`
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ],
        max_tokens: 256,
        temperature: 0.1,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NVIDIA API Error:', errorText)
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: 'NVIDIA API request failed', details: errorText }) 
      }
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Attempt to parse JSON from response content (stripping markdown if present)
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (parseErr) {
      console.error('Failed to parse NVIDIA response:', content)
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Invalid response format from AI', raw: content }) 
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }

  } catch (err) {
    console.error('Face validation function error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: err.message }),
    }
  }
}
