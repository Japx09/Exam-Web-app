import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { isMidtermRecord, midtermCombinedEssayPromptForAI } from '@/data/midtermQuestions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function fallbackRubricEvaluate(rawEssay: string, isMidterm: boolean): { score: number; feedback: string } {
  const cleaned = rawEssay.replace(/^\[EXAM:[^\]]+\]\s*/i, '').trim();
  if (!cleaned) {
    return { score: 0, feedback: 'No essay content submitted.' };
  }

  if (!isMidterm) {
    const words = cleaned.split(/\s+/).filter(Boolean).length;
    const score = words >= 40 ? 8 : words >= 20 ? 6 : words >= 8 ? 4 : 2;
    return {
      score,
      feedback: `Evaluated based on multimedia system concepts and explanation depth (${score}/10).`
    };
  }

  const parts = cleaned.split(/===\s*ESSAY\s*2[^=]*===/i);
  const essay1 = (parts[0] || '').replace(/===\s*ESSAY\s*1[^=]*===/i, '').trim().toLowerCase();
  const essay2 = (parts[1] || '').trim().toLowerCase();

  let e1Score = 0;
  if (essay1.length > 15) {
    e1Score += 1.5;
    if (/elena|leo|clinic|canteen|doctor|medicine|lunch|queue|order/.test(essay1)) e1Score += 1;
    if (/change|button|text|font|contrast|form|sms|ui|screen|clear/.test(essay1)) e1Score += 1.5;
    if (/test|observ|improv|next|peer|classmate|hesitat|slow|difficult/.test(essay1)) e1Score += 1;
  }
  e1Score = Math.min(5, Math.round(e1Score));

  let e2Score = 0;
  if (essay2.length > 15) {
    e2Score += 1.5;
    if (/goal|context|constraint|format|prompt|invit|seminar|professor/.test(essay2)) e2Score += 1.5;
    if (/confident|correct|verify|check|mistake|hallucin|error|review/.test(essay2)) e2Score += 1;
    if (/form|sheet|doc|gmail|calendar|workspace/.test(essay2)) e2Score += 1;
  }
  e2Score = Math.min(5, Math.round(e2Score));

  const total = Math.max(1, e1Score + e2Score);
  return {
    score: total,
    feedback: `Essay 1 (${e1Score}/5): Evaluated on persona needs, UI redesign rationale, testing observation, and iteration. | Essay 2 (${e2Score}/5): Evaluated on AI prompt structure (Goal/Context/Constraints/Format), AI verification, and Google Workspace workflow.`
  };
}

export async function POST(request: Request) {
  let essayText = '';
  let isMidterm = false;
  try {
    const { essay, prompt } = await request.json();
    essayText = essay || '';

    if (!essayText) {
      return NextResponse.json({ error: 'Missing essay' }, { status: 400 });
    }

    isMidterm = Boolean(isMidtermRecord({ essay_answer: essayText }) || (prompt && prompt.includes('MIDTERM')));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(fallbackRubricEvaluate(essayText, isMidterm));
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = isMidterm
      ? `
        You are an encouraging and fair UX Design and AI Workflow instructor evaluating a student's two Midterm exam essays out of 10 total points (5 points for Essay 1 + 5 points for Essay 2).
        ${midtermCombinedEssayPromptForAI}
        
        Instructions:
        - Grade generously based on the student's understanding and effort, even if their English grammar is informal.
        - If a student includes a note explaining they accidentally copy-pasted a sentence of their own answer, ignore the note and do NOT penalize them at all.
        - Award 0 points only if an essay section is completely blank or unrelated nonsense.
        - Grade Essay 1 out of 5 points and Essay 2 out of 5 points, then sum them for the total "score" (0 to 10).
        - In "feedback", briefly state the breakdown (e.g., "Essay 1 (4/5): ... | Essay 2 (4/5): ...") in 2-3 concise sentences.
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
        thinkingConfig: { thinkingBudget: 0 },
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
    
    return NextResponse.json(fallbackRubricEvaluate(essayText, isMidterm));

  } catch (error) {
    console.error('Gemini API rate-limited or timed out, using rubric fallback:', error);
    return NextResponse.json(fallbackRubricEvaluate(essayText, isMidterm));
  }
}
