import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { essay, prompt } = await request.json();

    if (!essay || !prompt) {
      return NextResponse.json({ error: 'Missing essay or prompt' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a strict and objective exam evaluator checking a multimedia exam essay out of 10 points.
      The prompt was: "${prompt}"
      
      Criteria:
      - 0 points if it is completely off-topic or likely AI-generated nonsense.
      - Evaluate based on how well it answers the prompt.
      - Provide a score (0 to 10) and a short 1-2 sentence feedback.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: essay,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: {
              type: "INTEGER",
              description: "The score out of 10"
            },
            feedback: {
              type: "STRING",
              description: "1 to 2 sentences of feedback"
            }
          },
          required: ["score", "feedback"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return NextResponse.json(parsed);
    }
    
    return NextResponse.json({ score: 0, feedback: "AI evaluation failed to return text." });

  } catch (error) {
    console.error('Error evaluating essay:', error);
    return NextResponse.json({ score: 0, feedback: "Error connecting to AI." }, { status: 500 });
  }
}
