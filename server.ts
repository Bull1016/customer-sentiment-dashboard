import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please configure it in your Secrets/Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST route for sentiment analysis
app.post("/api/analyze-sentiment", async (req, res) => {
  try {
    const { reviewsText } = req.body;
    if (!reviewsText || typeof reviewsText !== "string" || reviewsText.trim().length === 0) {
      res.status(400).json({ error: "No reviews text content found to analyze." });
      return;
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyErr: any) {
      res.status(500).json({
        error: "Google Gemini API Key is missing. Please define your GEMINI_API_KEY in the Secrets panel in AI Studio Settings.",
        details: keyErr.message,
      });
      return;
    }

    const systemPrompt = `You are a professional customer experience analytics engine. 
Analyze the provided customer reviews and extract structural insights.

1. Overall Stats: Calculate average sentiment (0 to 100), total reviews, and breakdown percentages (positive, negative, neutral).
2. Trend Line Over Time: Map reviews chronologically. If explicit dates are mentioned (e.g., 'May 20', '2026-05-15', 'two days ago'), extract and group them. If timestamps are absent, assign logical chronological dates/timesteps (e.g. over the last 30 days) so we can plot a timeline. Double check chronological order (from past to recent).
3. Executive Summary: Write a clear narrative analytical summary with 1-2 powerful short paragraphs of feedback trends.
4. Actionable Improvements: Focus on exactly 3 areas. For each, write a concise title, describe the concrete complaints, assign a severity ('high', 'medium', or 'low'), and write a specific recommendation.
5. Word/Tag Cloud: Find 15-25 high-frequency keywords or phrases and classify them as 'praise' or 'complaint', with their frequency count and score (0-100).
6. Parsed Reviews Listing: Parse up to 40 individual reviews, returning a snippet, date, sentiment label, score, and a brief one-sentence summary.`;

    const userPrompt = `Here is the batch of raw customer reviews:
---
${reviewsText}
---

Perform the complete sentiment analysis and output the result in the requested JSON structure. Ensure all percentages and sentiment values represent realistic, detailed customer experience data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
                averageSentiment: { type: Type.NUMBER, description: "Average sentiment score from 0 (very negative) to 100 (very positive)" },
                totalReviewsParsed: { type: Type.INTEGER },
                positivePercent: { type: Type.NUMBER, description: "Percentage of positive reviews (0-100)" },
                negativePercent: { type: Type.NUMBER, description: "Percentage of negative reviews (0-100)" },
                neutralPercent: { type: Type.NUMBER, description: "Percentage of neutral reviews (0-100)" },
              },
              required: ["averageSentiment", "totalReviewsParsed", "positivePercent", "negativePercent", "neutralPercent"]
            },
            executiveSummary: { type: Type.STRING, description: "A detailed markdown analysis describing the general customer feeling, major bottlenecks, and top takeaways." },
            topActionableAreas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The name of the action point" },
                  description: { type: Type.STRING, description: "Details of what customers complained about" },
                  severity: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
                  recommendation: { type: Type.STRING, description: "Exact proposed business solution" },
                },
                required: ["title", "description", "severity", "recommendation"]
              },
              description: "Must contain exactly 3 critical areas."
            },
            sentimentTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD or readable interval like 'Week 1', ordered chronologically" },
                  sentimentScore: { type: Type.NUMBER, description: "0-100 average sentiment score for this interval" },
                  volume: { type: Type.INTEGER, description: "Number of reviews in this interval" },
                },
                required: ["date", "sentimentScore", "volume"]
              },
              description: "Chronological points for the trend line chart (ideally 5 to 10 intervals)."
            },
            wordCloud: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The keyword or short phrase (1-3 words)" },
                  type: { type: Type.STRING, description: "Must be 'praise' or 'complaint'" },
                  count: { type: Type.INTEGER, description: "How frequently the theme occurs (relative scale, e.g. 2 to 50)" },
                  sentimentScore: { type: Type.NUMBER, description: "0-100 average sentiment score specifically for this word context" }
                },
                required: ["text", "type", "count", "sentimentScore"]
              },
              description: "Top 15-25 keywords/themes for praise and complaints to plot in the word cloud."
            },
            parsedReviews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The original review snippet or text" },
                  date: { type: Type.STRING, description: "Extracted or assigned date/time for this review" },
                  sentiment: { type: Type.STRING, description: "Must be 'positive', 'neutral', or 'negative'" },
                  score: { type: Type.NUMBER, description: "0-100 individual confidence/sentiment score" },
                  summary: { type: Type.STRING, description: "A one-sentence summary of the user's feedback" }
                },
                required: ["text", "date", "sentiment", "score", "summary"]
              },
              description: "List of processed individual reviews (up to 40 items)."
            }
          },
          required: ["overallStats", "executiveSummary", "topActionableAreas", "sentimentTrend", "wordCloud", "parsedReviews"]
        }
      }
    });

    const outputText = response.text;
    res.setHeader("Content-Type", "application/json");
    res.send(outputText);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      error: "Error processing reviews with Gemini.",
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
