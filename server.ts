import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const PERSONA_PROMPTS: Record<string, string> = {
  omni: `You are "4life", the universal AI companion engineered to answer any question imaginable with boundless depth, crystalline clarity, empathy, and intellectual rigor.
Whether the user asks about quantum physics, the meaning of existence, complex code architecture, fitness & longevity, relationship nuance, historical mysteries, breaking global news, or everyday practical hacks—you deliver an exceptional, nuanced, and actionable response.
Style requirements:
- Use clear markdown structure: engaging introductory hook, headers (## / ###), bullet points, and bold key takeaways.
- Provide concrete examples, analogies, or code blocks whenever applicable.
- If the question touches on subjective life choices or philosophy, present balanced, wise, and practical perspectives.
- Always conclude with a special section labeled exactly:
### 🔮 Explore Next with 4life
Followed by 3 fascinating, thought-provoking follow-up prompts or angles related to the user's inquiry, formatted as bullet points starting with "- ".`,

  philosophical: `You are "4life" in Deep Philosophical & Existential Mode.
You contemplate the deepest queries of consciousness, metaphysics, ethics, destiny, stoicism, existential wonder, and the human condition.
Draw insight from Socrates, Marcus Aurelius, Nietzsche, Eastern philosophies (Taoism, Zen), modern cognitive science, and astrophysics. Be wise, poetic, yet grounded and comforting.
Conclude with:
### 🔮 Explore Next with 4life
followed by 3 profound follow-up questions.`,

  code_architect: `You are "4life" in Elite Software Architect & Engineer Mode.
You specialize in computer science, software design patterns, TypeScript/Python/Rust/Go, algorithms, debugging, DevOps, and systems engineering.
Provide elegant, robust, production-ready code with concise explanations of design decisions and edge cases.
Conclude with:
### 🔮 Explore Next with 4life
followed by 3 next technical explorations.`,

  life_coach: `You are "4life" in Compassionate Life & Growth Coach Mode.
You specialize in personal habits, emotional intelligence, career navigation, mental clarity, physical wellness, focus, and relationships.
Your advice is empathetic, highly practical, non-judgmental, and structured into realistic steps.
Conclude with:
### 🔮 Explore Next with 4life
followed by 3 inspiring follow-up reflections.`,

  explain_like_5: `You are "4life" in Genius Simplifier (ELI5) Mode.
You explain any concept—no matter how labyrinthine, scientific, or abstract—in simple, vivid, entertaining metaphors that anyone can instantly grasp and remember forever.
Conclude with:
### 🔮 Explore Next with 4life
followed by 3 fun follow-up questions.`,
};

function formatErrorMessage(err: any): string {
  const rawMsg = err?.message || String(err);
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('Too Many Requests')) {
    return '4life is currently experiencing high demand or free-tier quota limits (429 RESOURCE_EXHAUSTED). To increase your limits, select a billing-enabled API key in Settings > Secrets, or wait a minute for the rate limit to reset.';
  }
  if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('403')) {
    return 'Invalid or missing API key. Please verify your Gemini API key in the Settings > Secrets panel.';
  }
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
      const innerMsg = parsed.error.message;
      if (innerMsg.includes('quota') || innerMsg.includes('RESOURCE_EXHAUSTED')) {
        return '4life is currently experiencing high demand or free-tier quota limits. Please select a billing-enabled key in Settings > Secrets or retry shortly.';
      }
      return innerMsg;
    }
  } catch {}
  return rawMsg;
}

// Helper to sanitize message contents to strictly satisfy Gemini alternating role and non-empty rules
function buildSanitizedContents(messages: any[], prompt?: string) {
  const rawList: { role: 'user' | 'model'; text: string }[] = [];

  if (Array.isArray(messages) && messages.length > 0) {
    for (const m of messages) {
      const text = typeof m.text === 'string' ? m.text.trim() : '';
      if (text) {
        rawList.push({
          role: m.role === 'model' ? 'model' : 'user',
          text,
        });
      }
    }
  } else if (prompt && typeof prompt === 'string' && prompt.trim()) {
    rawList.push({ role: 'user', text: prompt.trim() });
  }

  if (rawList.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  // Ensure conversation starts with user role
  while (rawList.length > 0 && rawList[0].role !== 'user') {
    rawList.shift();
  }
  if (rawList.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  // Merge consecutive messages of same role
  const normalized: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const item of rawList) {
    if (normalized.length > 0 && normalized[normalized.length - 1].role === item.role) {
      normalized[normalized.length - 1].parts[0].text += `\n\n${item.text}`;
    } else {
      normalized.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    }
  }

  return normalized;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Helper to execute generation with automatic search fallback & multi-model cascade
async function generateWithCascade(contents: any[], systemInstruction: string, enableSearch: boolean) {
  // 1. Try gemini-3.8-flash with search (if requested)
  if (enableSearch) {
    try {
      const config: any = {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }],
      };
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config,
        }),
        4000
      );
      return { response, model: 'gemini-3.8-flash' };
    } catch (err: any) {
      console.warn('Search tool or 3.8-flash timed out/failed, falling back to core reasoning...', err?.message);
    }
  }

  // 2. Try gemini-3.8-flash without search tools with a 3.5s timeout
  try {
    const config: any = {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    };
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config,
      }),
      3500
    );
    return { response, model: 'gemini-3.8-flash' };
  } catch (flashErr: any) {
    console.warn('3.8-flash timed out or unavailable, using fast gemini-3.1-flash-lite fallback...', flashErr?.message);
    // 3. Fallback to gemini-3.1-flash-lite (fast, high availability)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: { systemInstruction },
      });
      return { response, model: 'gemini-3.1-flash-lite' };
    } catch (liteErr: any) {
      console.warn('3.1-flash-lite failed, trying gemini-flash-latest fallback...', liteErr?.message);
      // 4. Fallback to gemini-flash-latest
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents,
          config: { systemInstruction },
        });
        return { response, model: 'gemini-flash-latest' };
      } catch (lastErr) {
        throw flashErr;
      }
    }
  }
}

// Standard chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], prompt, mode = 'omni', enableSearch = false } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'A question or message is required.' });
    }

    const systemInstruction = PERSONA_PROMPTS[mode] || PERSONA_PROMPTS.omni;
    const contents = buildSanitizedContents(messages, prompt);

    const { response, model } = await generateWithCascade(contents, systemInstruction, enableSearch);

    const responseText = response.text || 'I pondered your question, but could not produce words. Please ask again!';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    const sources = groundingChunks
      .filter((chunk: any) => chunk?.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || chunk.web.uri,
        uri: chunk.web.uri,
      }));

    return res.json({
      text: responseText,
      sources,
      searchQueries,
      model,
      mode,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// SSE Streaming chat endpoint for low latency experience
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { messages = [], prompt, mode = 'omni', enableSearch = false } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'A question or message is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const systemInstruction = PERSONA_PROMPTS[mode] || PERSONA_PROMPTS.omni;
    const contents = buildSanitizedContents(messages, prompt);

    // Stream helper with first-chunk timeout race to prevent hanging
    async function tryStreamWithRace(modelName: string, config: any, firstChunkTimeoutMs = 3500): Promise<boolean> {
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config,
      });

      const iterator = stream[Symbol.asyncIterator]();
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('FIRST_CHUNK_TIMEOUT')), firstChunkTimeoutMs);
      });

      // Race the first chunk
      const firstChunkResult = await Promise.race([iterator.next(), timeoutPromise]).finally(() => clearTimeout(timer));

      let completeText = '';
      let sources: any[] = [];
      let searchQueries: string[] = [];
      let hasSentAnyChunk = false;

      // Handle first chunk
      if (firstChunkResult && !firstChunkResult.done && firstChunkResult.value) {
        const firstText = firstChunkResult.value.text || '';
        if (firstText) {
          hasSentAnyChunk = true;
          completeText += firstText;
          res.write(`data: ${JSON.stringify({ text: firstText })}\n\n`);
        }

        const gChunks = firstChunkResult.value.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (gChunks) {
          const extracted = gChunks
            .filter((c: any) => c?.web?.uri)
            .map((c: any) => ({
              title: c.web.title || c.web.uri,
              uri: c.web.uri,
            }));
          if (extracted.length > 0) sources = extracted;
        }
      }

      // Stream the remaining chunks
      try {
        while (true) {
          const next = await iterator.next();
          if (next.done) break;

          const chunkText = next.value.text || '';
          if (chunkText) {
            hasSentAnyChunk = true;
            completeText += chunkText;
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }

          const gChunks = next.value.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (gChunks) {
            const extracted = gChunks
              .filter((c: any) => c?.web?.uri)
              .map((c: any) => ({
                title: c.web.title || c.web.uri,
                uri: c.web.uri,
              }));
            if (extracted.length > 0) sources = extracted;
          }

          const q = next.value.candidates?.[0]?.groundingMetadata?.webSearchQueries;
          if (q) searchQueries = q;
        }

        res.write(
          `data: ${JSON.stringify({
            done: true,
            fullText: completeText,
            sources,
            searchQueries,
          })}\n\n`
        );
        res.end();
        return true;
      } catch (remainingErr: any) {
        if (hasSentAnyChunk) {
          res.write(
            `data: ${JSON.stringify({
              done: true,
              fullText: completeText,
              sources,
              searchQueries,
            })}\n\n`
          );
          res.end();
          return true;
        }
        throw remainingErr;
      }
    }

    // Cascade sequence
    let streamSucceeded = false;

    // 1. Try 3.8-flash with search (if requested)
    if (enableSearch) {
      try {
        const configWithSearch = {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: [{ googleSearch: {} }],
        };
        await tryStreamWithRace('gemini-3.8-flash', configWithSearch, 4000);
        streamSucceeded = true;
      } catch (searchErr: any) {
        console.warn('Search stream failed/timed out, falling back to core model...', searchErr?.message);
      }
    }

    // 2. Try 3.8-flash without search (fast race)
    if (!streamSucceeded) {
      try {
        const baseConfig = {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        };
        await tryStreamWithRace('gemini-3.8-flash', baseConfig, 3500);
        streamSucceeded = true;
      } catch (flashErr: any) {
        console.warn('3.8-flash stream timed out or hit spike, streaming from gemini-3.1-flash-lite...', flashErr?.message);
        // 3. Fallback to gemini-3.1-flash-lite (instant response)
        try {
          await tryStreamWithRace('gemini-3.1-flash-lite', { systemInstruction }, 15000);
          streamSucceeded = true;
        } catch (liteErr: any) {
          console.warn('3.1-flash-lite stream failed, trying gemini-flash-latest...', liteErr?.message);
          // 4. Fallback to gemini-flash-latest
          try {
            await tryStreamWithRace('gemini-flash-latest', { systemInstruction }, 15000);
            streamSucceeded = true;
          } catch (lastErr: any) {
            console.error('All model streams failed:', lastErr?.message);
            throw flashErr;
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error in /api/chat/stream:', error);
    const friendlyMsg = formatErrorMessage(error);
    if (!res.headersSent) {
      res.status(500).json({ error: friendlyMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: friendlyMsg })}\n\n`);
      res.end();
    }
  }
});

// App status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    name: '4life AI',
    status: 'online',
    version: '1.0.0',
    capabilities: [
      'universal-question-answering',
      'google-search-grounding',
      'multi-mode-personas',
      'streaming-responses',
    ],
  });
});

// Vite middleware or static serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`4life AI server active on port ${port} [mode: ${isProd ? 'production' : 'development'}]`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
