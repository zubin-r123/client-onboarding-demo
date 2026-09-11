exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { bizName, specialty, location, tone, services } = body;

  if (!bizName || !specialty || !services) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing business name, specialty, or services" }),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server is not configured with an API key" }),
    };
  }

  const prompt = `You are a marketing copywriter at a digital marketing agency that builds websites for small local businesses (dental, healthcare, legal, aesthetics, and similar practices).

Draft starter website copy for a new client with these details:
- Business Name: ${bizName}
- Specialty: ${specialty}
- Location: ${location || "Not specified"}
- Services: ${services}
- Tone: ${tone || "Professional and trustworthy"}

Produce these sections, clearly labeled with headers:
1. Homepage Headline (under 12 words)
2. Homepage Subheadline (one sentence)
3. About Us blurb (2-3 sentences)
4. Service descriptions (1-2 sentences each, one per service listed)
5. SEO Meta Description (under 160 characters)

Keep the copy warm, credible, and specific to the specialty. Avoid generic filler a client would immediately want to rewrite.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errText }) };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to reach Groq API" }) };
  }
};
