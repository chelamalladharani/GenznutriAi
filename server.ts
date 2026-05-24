import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client custom helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it using Settings > Secrets.");
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

// API: Analyze food nutrition using Gemini-3.5-flash and a strict JSON schema
app.post("/api/nutrition/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ error: "Please enter a valid food name." });
      return;
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze the following food item or meal query: "${query.trim()}". Return the exact nutrition details for a standard household portion. If multiple foods are mentioned, sum their nutrition values.`,
      config: {
        systemInstruction: "You are an expert culinary scientist and nutritionist. Estimate calories (kcal), protein (g), carbohydrates (g), fat (g), and dietary fiber (g) for standard food servings or user queries. If the query does not appear to be food or a meal at all, set isValidFood to false.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidFood: {
              type: Type.BOOLEAN,
              description: "Whether the query represents real food, meal descriptions, or ingredients.",
            },
            name: {
              type: Type.STRING,
              description: "The standardized name/title of the food item or summarized meal.",
            },
            calories: {
              type: Type.NUMBER,
              description: "The estimated calories in kcal.",
            },
            protein: {
              type: Type.NUMBER,
              description: "The estimated protein content in grams.",
            },
            carbs: {
              type: Type.NUMBER,
              description: "The estimated total carbohydrates in grams.",
            },
            fat: {
              type: Type.NUMBER,
              description: "The estimated total fat in grams.",
            },
            fiber: {
              type: Type.NUMBER,
              description: "The estimated dietary fiber in grams.",
            },
            servingSize: {
              type: Type.STRING,
              description: "Standard portion size analyzed (e.g., '1 cup', '100g', '1 slice', '1 medium egg').",
            },
            description: {
              type: Type.STRING,
              description: "Concise description of the nutrition estimation or meal composition.",
            },
          },
          required: ["isValidFood", "name", "calories", "protein", "carbs", "fat", "fiber", "servingSize", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(502).json({ error: "Empty response from Gemini AI." });
      return;
    }

    const parsedData = JSON.parse(text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini nutrition error:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze food nutrition. Please check your network or API keys.",
    });
  }
});

// Setup Vite and Static file routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for general paths in SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GenZNutriAI server running on port ${PORT}`);
  });
}

startServer();
