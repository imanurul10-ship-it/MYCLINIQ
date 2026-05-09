// Symptom analysis via Lovable AI Gateway (Gemini Vision + text)
// CORS-enabled, accepts { text?: string, imageBase64?: string, mime?: string }
// Returns { summary, severity, possibleConditions[], recommendation }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, imageBase64, mime } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any[] = [];
    if (text && text.trim()) userContent.push({ type: "text", text: `Patient describes: ${text}` });
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime || "image/jpeg"};base64,${imageBase64}` },
      });
    }
    if (userContent.length === 0) {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a careful clinical triage assistant for a Malaysian healthcare app called MyClinIQ.
Analyze the patient's described symptoms and any image (skin, wound, rash, eye etc.).
NEVER diagnose definitively. Return structured triage guidance.
Always recommend in-person care for red-flag symptoms (chest pain, breathing difficulty, severe bleeding, stroke signs, severe allergic reaction).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_triage",
            description: "Return structured triage analysis.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence plain-language summary." },
                severity: { type: "string", enum: ["low", "moderate", "high", "emergency"] },
                possibleConditions: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-4 common possibilities, NOT a diagnosis.",
                },
                recommendation: { type: "string", description: "What the patient should do next." },
                redFlags: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "severity", "possibleConditions", "recommendation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_triage" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
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
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-symptoms error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
