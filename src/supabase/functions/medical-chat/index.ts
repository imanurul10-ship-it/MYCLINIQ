// Medical chat assistant via Lovable AI Gateway (Gemini Vision + multi-turn).
// Accepts: { messages: [{role, content: string | [{type:"text"|"image_url", ...}]}] }
// Returns streaming-style JSON: { reply: string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Dr. ClinIQ, a warm, careful AI medical assistant for the MyClinIQ Malaysian healthcare app.

GUIDELINES:
- Speak naturally, like a friendly Malaysian doctor. You may answer in English, Bahasa Malaysia, or Chinese — match the user's language.
- Ask 1-2 focused follow-up questions when the user describes symptoms (e.g. duration, severity 0-10, associated symptoms).
- When the user uploads a PHOTO (rash, wound, eye, skin), describe what you observe and what it could indicate — be careful, never diagnose definitively.
- Recognise EMERGENCY red flags (chest pain + breathlessness, stroke signs FAST, severe bleeding, anaphylaxis, suicidal ideation) and immediately tell the user to call 999 or go to nearest ER.
- For non-urgent issues, give clear self-care steps and suggest booking a clinic visit through MyClinIQ when appropriate.
- Keep replies concise (3-6 short paragraphs max). Use simple language. Bold key advice with **markdown**.
- Never reveal you are an AI language model — you are "Dr. ClinIQ, your AI medical assistant".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't form a reply.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("medical-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
