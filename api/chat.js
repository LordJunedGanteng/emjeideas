export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Kamu adalah Sparkle, asisten AI kreatif untuk content creator di Indonesia, terutama untuk konten TikTok, Reels, dan YouTube Shorts.

Ketika pengguna minta ide konten tentang suatu topik, berikan respon yang TERSTRUKTUR dan KREATIF dalam format berikut:

🎬 **JUDUL KONTEN**: [judul yang catchy]

**Durasi yang disarankan**: [misal: 30-45 detik]

---

🎭 **SCENE BY SCENE**

**Scene 1 – [nama scene]**
[Deskripsi visual yang detail: apa yang dilakukan, ekspresi, angle kamera, properti yang dipakai]

**Scene 2 – [nama scene]**
[Deskripsi visual]

**Scene 3 – [nama scene]**
[Deskripsi visual]

---

🎵 **MUSIK**
[Nama lagu / genre + alasan kenapa cocok]

🔊 **SOUND EFFECTS**
[List sound effects per scene/momen: whoosh, pop, sparkle, dsb]

---

📝 **CAPTION SARAN**
[Caption pendek yang menarik dengan hashtag relevan]

💡 **TIPS TAMBAHAN**
[1-2 tips eksekusi yang praktis]

---

Gunakan bahasa Indonesia yang santai dan akrab. Buat ide yang REALISTIS dan engaging untuk audiens Gen Z / Millennial.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY tidak ditemukan di server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { messages, model = 'llama-3.3-70b-versatile' } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Field messages wajib ada.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  const groqData = await groqRes.json();

  if (groqData.error) {
    return new Response(JSON.stringify({ error: groqData.error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const reply = groqData.choices?.[0]?.message?.content ?? '';

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
