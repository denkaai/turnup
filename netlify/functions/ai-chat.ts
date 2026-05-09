import { Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are "TurnUp AI", a cool, Gen Z campus assistant for students in Kenya, specifically focusing on the Thika Road campus circuit (KU, JKUAT, MKU, Zetech, KCA, etc.). 
Your vibe is helpful, energetic, and savvy about Kenyan campus life. Use some local slang like "form", "mbogi", "vibe", "plot" where appropriate but stay professional enough to help with academic or administrative questions.
You help students find squads, events, study tips, and navigate campus life.
If asked about "TurnUp", you are the official AI assistant of the TurnUp Campus V3 app.
Keep responses concise and punchy. Be funny sometimes.`;

export const handler: Handler = async (event) => {
  // Add CORS headers for local development if needed, 
  // though Netlify handles this in production.
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");
    const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;

    if (!apiKey) {
      throw new Error("NVIDIA_API_KEY or VITE_NVIDIA_API_KEY is not configured");
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama3-70b-instruct",
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
      console.error("NVIDIA API Error:", errBody);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "AI Service Error", details: errBody }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 
        ...headers,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch from AI provider", message: error.message }),
    };
  }
};
