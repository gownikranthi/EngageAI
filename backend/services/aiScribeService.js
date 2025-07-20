const Event = require('../models/Event');
const EventSummary = require('../models/EventSummary');
const { GoogleGenerativeAI } = require('@langchain/google-genai');

async function generateEventSummary(eventId) {
  // 1. Fetch event and Q&A
  const event = await Event.findById(eventId).lean();
  if (!event) throw new Error('Event not found');
  const questions = event.questions || [];

  // 2. Build prompt
  const qaLog = questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n');
  const prompt = `You are an expert AI analyst. I will provide you with the full Q&A log from a live event titled "${event.name}". Your task is to analyze this data and return a structured JSON object.\n\nHere is the Q&A Log:\n${qaLog}\n\nBased on the log, perform the following tasks and provide the output in a single JSON object with the keys "summary", "themes", and "faq":\n1. summary: Write a concise, one-paragraph summary of the main topics and concerns raised in the Q&A.\n2. themes: Identify the top 3-5 recurring themes or topics from the questions. Return them as a JSON array of strings.\n3. faq: Group similar or duplicate questions together. For each group, formulate a single, clear question and provide a comprehensive answer that synthesizes the information. Return this as a JSON array of objects, where each object has a "question" and "answer" key.`;

  // 3. Call Gemini API
  const llm = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await llm.invoke(prompt);
  let parsed;
  try {
    parsed = typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    throw new Error('Failed to parse AI response');
  }

  // 4. Save summary
  const summary = await EventSummary.findOneAndUpdate(
    { eventId },
    {
      eventId,
      generatedSummary: parsed.summary,
      keyThemes: parsed.themes,
      smartFAQ: parsed.faq,
    },
    { upsert: true, new: true }
  );
  return summary;
}

module.exports = { generateEventSummary }; 