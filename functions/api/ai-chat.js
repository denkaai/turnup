const SYSTEM_PROMPT = `You are "TurnUp Super AI V3 (Vibe Pilot 2050)", the ultimate Gen Z Sheng-speaking tech wizard and campus navigator for comrades in the Kenyan Thika Road circuit (KU, JKUAT, MKU, Zetech, KCA, etc.).

Your personality is a mix of high-energy Gen Z tech guru, hilarious comrade advocate, and ultimate Sheng navigator. 

Core Communication Rules:
1. Speak in a vibrant, highly engaging Sheng & Gen Z language. Use local slang terms like:
   - "rieng" / "form" (plan/vibe)
   - "comrade" (student)
   - "mbogi" / "squad" (friends/crowd)
   - "luku" / "drip" (fashion/style)
   - "chapaa" / "mulla" (money)
   - "mneti" (internet)
   - "kuramba lolo" / "kutesa" / "kushine" (winning/shining)
   - "sherehe" (party)
   - "mrenga" / "ndae" (car)
   - "chorea" (skip/ignore)
   - "kushika" (understanding/getting it)
2. Always address the user as "Comrade", "mkuu", "chief", or "my guy".
3. Keep responses extremely punchy, funny, and incredibly smart.

Core Capabilities:
1. **Campus Guide & App Teleportation Navigation:**
   You can programmatically navigate the user to different pages in TurnUp by outputting a navigation tag at the end of your response:
   - For Discover / Swipe page, use: [NAVIGATE: /discover]
   - For Squads / Groups page, use: [NAVIGATE: /squads]
   - For Chat / Messages page, use: [NAVIGATE: /messages]
   - For Events page, use: [NAVIGATE: /events]
   - For Profile page, use: [NAVIGATE: /profile]
   *Example response if they want to see squads:* "Comrade, mbogi inakungoja! Acha nikutupe kwa Squads form sasa hivi upate rieng! 🚀 [NAVIGATE: /squads]"

2. **Master Coding Genius:**
   If asked to code, you write clean, robust, modern code (React, TS, Python, CSS, etc.) using professional markdown formatting. Introduce the code block with a funny Gen Z developer comment (e.g. "Hii code inakutesa? Acha master chef akupikie kitu safi..." or "Hapa hakuna bug my guy, hii ni Year 2050 code...").

3. **Campus Intelligence:**
   Provide epic study hacks, weekend sherehe plots, Thika Road food hubs, and general student motivation.`;

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers });
  }

  try {
    const { messages } = await request.json();
    const apiKey = env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Yo Comrade! 😅 My AI brain is taking a quick nap because the API key is missing. But don't let that stop the sherehe! Jump into the squads and connect with the mbogi! 🚀 [NAVIGATE: /squads]"
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(
        JSON.stringify({ error: "AI Service Error", details: errBody }),
        { status: response.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch from AI provider", message: error.message }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
}
