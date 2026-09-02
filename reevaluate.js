const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = `You are a strict examiner evaluating a student's answer based on a specific question. Provide a score from 0 to 10 and a brief feedback (maximum 2 sentences). Return ONLY valid JSON in this exact format: {"score": number, "feedback": "string"}`;
const essayQuestionPrompt = "What is multimedia? Briefly explain its core elements.";

async function run() {
  const { data: exams, error } = await supabase.from('exams').select('*').like('ai_feedback', '%Error%');
  if (error) { console.error("Error fetching exams:", error); return; }
  console.log(`Found ${exams.length} exams to re-evaluate.`);

  for (const exam of exams) {
    if (!exam.essay_answer) { console.log(`Skipping ${exam.student_name}: No essay answer.`); continue; }
    try {
      console.log(`Evaluating essay for ${exam.student_name}...`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: exam.essay_answer,
        config: {
          systemInstruction: prompt + "\n\nQuestion: " + essayQuestionPrompt,
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: { score: { type: "INTEGER" }, feedback: { type: "STRING" } }, required: ["score", "feedback"] }
        }
      });
      const result = JSON.parse(response.text);
      const { error: updateError } = await supabase.from('exams').update({ ai_score: result.score, ai_feedback: result.feedback }).eq('id', exam.id);
      if (updateError) console.error(`Error updating ${exam.student_name}:`, updateError);
      else console.log(`Successfully updated ${exam.student_name}: Score ${result.score}`);
    } catch (e) {
      console.error(`Failed to evaluate ${exam.student_name}:`, e.message);
    }
  }
}
run();
