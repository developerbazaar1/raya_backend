const axios = require('axios');
const { NVIDIA_API_KEY, NVIDIA_INVOKE_URL, NVIDIA_MODEL } = require('../config/env');
const AppError = require('../utils/appError');

const buildPrompt = ({ description, quizCount, sourceText, title, versionNumber }) => `
You are creating a business training module from SOP/source text.

Return ONLY valid JSON. No markdown. No explanations outside JSON.

Rules:
- Create a clear video script for training version ${versionNumber}.
- recommendedPassScore must be a number from 50 to 100.
- Generate exactly ${quizCount} quiz questions only when quizCount is greater than 0.
- Each quiz question must have exactly 4 options and exactly one correct option.
- Keep content faithful to the source. Do not invent policy details.

JSON shape:
{
  "title": "string",
  "description": "string",
  "learningObjectives": ["string"],
  "videoScript": "string",
  "transcription": "string",
  "recommendedPassScore": 70,
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Training title: ${title}
Training description: ${description || ''}

Source text:
${sourceText}
`;

const parseJsonResponse = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new AppError('AI response did not include valid JSON.', 502);
    }

    return JSON.parse(match[0]);
  }
};

const normalizeTrainingGeneration = (payload, quizCount) => {
  const quiz = Array.isArray(payload.quiz) ? payload.quiz.slice(0, quizCount) : [];
  return {
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    learningObjectives: Array.isArray(payload.learningObjectives)
      ? payload.learningObjectives.map((item) => String(item).trim()).filter(Boolean)
      : [],
    videoScript: String(payload.videoScript || '').trim(),
    transcription: String(payload.transcription || payload.videoScript || '').trim(),
    recommendedPassScore: Number(payload.recommendedPassScore || 70),
    quiz: quiz.map((question) => ({
      question: String(question.question || '').trim(),
      options: Array.isArray(question.options)
        ? question.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 4)
        : [],
      correctAnswer: String(question.correctAnswer || '').trim(),
      explanation: String(question.explanation || '').trim()
    }))
  };
};

const generateTrainingContent = async ({ description, quizCount, sourceText, title, versionNumber }) => {
  if (!NVIDIA_API_KEY) {
    throw new AppError('NVIDIA_API_KEY is required for training generation.', 500);
  }

  const startedAt = Date.now();
  const prompt = buildPrompt({ description, quizCount, sourceText, title, versionNumber });

  console.log(
    `[training:llm] request start model=${NVIDIA_MODEL} url=${NVIDIA_INVOKE_URL} title="${title}" version=${versionNumber} sourceChars=${sourceText.length} promptChars=${prompt.length} quizCount=${quizCount}`
  );

  const response = await axios.post(
    NVIDIA_INVOKE_URL,
    {
      model: NVIDIA_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 16384,
      temperature: 0.6,
      top_p: 0.95,
      stream: false,
      chat_template_kwargs: {
        enable_thinking: true
      }
    },
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  console.log(
    `[training:llm] response received status=${response.status} durationMs=${Date.now() - startedAt} contentChars=${content ? content.length : 0}`
  );

  if (!content) {
    throw new AppError('AI provider returned an empty response.', 502);
  }

  const parsed = parseJsonResponse(content);
  const normalized = normalizeTrainingGeneration(parsed, quizCount);

  console.log(
    `[training:llm] response parsed titleChars=${normalized.title.length} scriptChars=${normalized.videoScript.length} quizItems=${normalized.quiz.length} passScore=${normalized.recommendedPassScore}`
  );

  return normalized;
};

module.exports = {
  generateTrainingContent
};
