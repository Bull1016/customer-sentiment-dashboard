import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";

dotenv.config(); // loads .env
dotenv.config({ path: ".env.local", override: true }); // loads .env.local (overrides if same key exists)

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Lazy-initialized OpenRouter Client
let openRouterClient: OpenAI | null = null;
function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in the environment.");
    }
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Sentiment Pulse",
      }
    });
  }
  return openRouterClient;
}

const systemPrompt = `You are a professional customer experience analytics engine.
Analyze the provided customer reviews and extract structural insights.

1. Overall Stats: Calculate average sentiment (0 to 100), total reviews, and breakdown percentages (positive, negative, neutral).
2. Trend Line Over Time: Map reviews chronologically. If explicit dates are mentioned (e.g., 'May 20', '2026-05-15', 'two days ago'), extract and group them. If timestamps are absent, assign logical chronological dates/timesteps (e.g. over the last 30 days) so we can plot a timeline. Double check chronological order (from past to recent).
3. Executive Summary: Write a clear narrative analytical summary with 1-2 powerful short paragraphs of feedback trends.
4. Actionable Improvements: Focus on exactly 3 areas. For each, write a concise title, describe the concrete complaints, assign a severity ('high', 'medium', or 'low'), and write a specific recommendation.
5. Word/Tag Cloud: Find 15-25 high-frequency keywords or phrases and classify them as 'praise' or 'complaint', with their frequency count and score (0-100).
6. Parsed Reviews Listing: Parse up to 40 individual reviews, returning a snippet, date, sentiment label, score, and a brief one-sentence summary.

IMPORTANT: You MUST respond ONLY with a valid JSON object matching this structure:
{
  "overallStats": {
    "averageSentiment": number,
    "totalReviewsParsed": number,
    "positivePercent": number,
    "negativePercent": number,
    "neutralPercent": number
  },
  "executiveSummary": "string (markdown)",
  "topActionableAreas": [
    { "title": "string", "description": "string", "severity": "high" | "medium" | "low", "recommendation": "string" }
  ],
  "sentimentTrend": [
    { "date": "string", "sentimentScore": number, "volume": number }
  ],
  "wordCloud": [
    { "text": "string", "type": "praise" | "complaint", "count": number, "sentimentScore": number }
  ],
  "parsedReviews": [
    { "text": "string", "date": "string", "sentiment": "positive" | "neutral" | "negative", "score": number, "summary": "string" }
  ]
}`;

// REST route for sentiment analysis
app.post("/api/analyze-sentiment", async (req, res) => {
  try {
    const { reviewsText, provider = "gemini", model } = req.body;

    if (!reviewsText || typeof reviewsText !== "string" || reviewsText.trim().length === 0) {
      res.status(400).json({ error: "No reviews text content found to analyze." });
      return;
    }

    const userPrompt = `Here is the batch of raw customer reviews:
---
${reviewsText}
---

Perform the complete sentiment analysis and output the result in the requested JSON structure. Ensure all percentages and sentiment values represent realistic, detailed customer experience data.`;

    let outputText = "";

    if (provider === "gemini") {
      const ai = getGeminiClient();
      const geminiModel = model || "gemini-2.0-flash";

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallStats: {
                type: Type.OBJECT,
                properties: {
                  averageSentiment: { type: Type.NUMBER },
                  totalReviewsParsed: { type: Type.INTEGER },
                  positivePercent: { type: Type.NUMBER },
                  negativePercent: { type: Type.NUMBER },
                  neutralPercent: { type: Type.NUMBER },
                },
                required: ["averageSentiment", "totalReviewsParsed", "positivePercent", "negativePercent", "neutralPercent"]
              },
              executiveSummary: { type: Type.STRING },
              topActionableAreas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                  },
                  required: ["title", "description", "severity", "recommendation"]
                }
              },
              sentimentTrend: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    sentimentScore: { type: Type.NUMBER },
                    volume: { type: Type.INTEGER },
                  },
                  required: ["date", "sentimentScore", "volume"]
                }
              },
              wordCloud: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    type: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    sentimentScore: { type: Type.NUMBER }
                  },
                  required: ["text", "type", "count", "sentimentScore"]
                }
              },
              parsedReviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    date: { type: Type.STRING },
                    sentiment: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    summary: { type: Type.STRING }
                  },
                  required: ["text", "date", "sentiment", "score", "summary"]
                }
              }
            },
            required: ["overallStats", "executiveSummary", "topActionableAreas", "sentimentTrend", "wordCloud", "parsedReviews"]
          }
        }
      });
      outputText = response.text;
    } else if (provider === "openrouter") {
      const ai = getOpenRouterClient();
      const orModel = model || "google/gemini-2.0-flash-001"; // Default for OpenRouter

      const response = await ai.chat.completions.create({
        model: orModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      outputText = response.choices[0].message.content || "";
    } else {
      res.status(400).json({ error: `Unsupported provider: ${provider}` });
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.send(outputText);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      error: "Error processing reviews with AI.",
      details: error.message || String(error),
    });
  }
});

// Configure Vite middleware or production static routing
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
