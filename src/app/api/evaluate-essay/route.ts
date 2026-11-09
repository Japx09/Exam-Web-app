import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { isMidtermRecord, midtermCombinedEssayPromptForAI } from '@/data/midtermQuestions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { essay, prompt } = await request.json();

    if (!essay) {
      return NextResponse.json({ error: 'Missing essay' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const isMidterm = isMidtermRecord({ essay_answer: essay }) || (prompt && prompt.includes('MIDTERM'));

    const systemInstruction = isMidterm
      ? `
        You are an objective UX Design and AI Workflow instructor evaluating a student's two Midterm exam essays out of 10 total points (5 points for Essay 1 + 5 points for Essay 2).
        ${midtermCombinedEssayPromptForAI}
        
        Instructions:
        - Award 0 points if an essay is completely off-topic or nonsense.
        - Grade Essay 1 out of 5 points and Essay 2 out of 5 points, then sum them for the total "score" (0 to 10).
        - In "feedback", briefly state the breakdown (e.g., "Essay 1 (4/5): ... | Essay 2 (5/5): ...") in 2-3 concise sentences.
      `
      : `
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
              description: "The total score out of 10"
            },
            feedback: {
              type: "STRING",
              description: "Concise constructive feedback with score breakdown if Midterm"
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
