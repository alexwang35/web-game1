import { GoogleGenAI } from "@google/genai";
import { GameState, GameConfig, EngineOutput } from "../types";
import { SYSTEM_PROMPT, DEVELOPER_PROMPT, USER_PROMPT_TEMPLATE } from "../constants";

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        // Safe check for process.env
        const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
        if (!apiKey) {
           console.error("API Key not found in process.env");
        }
        ai = new GoogleGenAI({ apiKey: apiKey || '' });
    }
    return ai;
};

export async function generateNextTurn(
  state: GameState,
  config: GameConfig,
  lastAction: string
): Promise<EngineOutput> {
  const aiInstance = getAI();

  // Construct the prompt
  let prompt = USER_PROMPT_TEMPLATE;
  prompt = prompt.replace("{{STATE_JSON}}", JSON.stringify(state));
  prompt = prompt.replace("{{CONFIG_JSON}}", JSON.stringify(config));
  prompt = prompt.replace("{{USER_ACTION}}", lastAction);

  // Combine instructions
  const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${DEVELOPER_PROMPT}`;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Optimized for speed/cost as game engine
      contents: prompt,
      config: {
        systemInstruction: fullSystemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }

    try {
      const jsonResponse = JSON.parse(text) as EngineOutput;
      return jsonResponse;
    } catch (e) {
      console.error("Failed to parse AI JSON:", text);
      throw new Error("Invalid JSON response from AI Engine");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}