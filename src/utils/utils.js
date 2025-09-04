// import { diffWords } from 'diff';
const { diffWords } = require('diff');


function calculatePronunciationScore(expectedText, spokenText) {
  const clean = (str) =>
    str.toLowerCase().replace(/[^\w\s]/g, '').trim();

  const expected = clean(expectedText);
  const spoken = clean(spokenText);

  const differences = diffWords(expected, spoken);

  let totalExpected = 0;
  let correct = 0;
  let mistakes = [];

  differences.forEach((part) => {
    const words = part.value.trim().split(/\s+/).filter(Boolean);

    if (!part.added && !part.removed) {
      // Correct words
      correct += words.length;
    }

    if (!part.added) {
      // Only count expected words (not extra spoken ones)
      totalExpected += words.length;
    }

    if (part.removed) {
      // Missing/mispronounced words
      mistakes.push(...words);
    }
  });

  const score = totalExpected === 0 ? 0 : Math.round((correct / totalExpected) * 100);

  return {
    score,
    totalExpected,
    correct,
    mistakes,
  };
}

function calculateMedal(quizScores = [], speechScores = []) {
  let totalQuizScore = 0;
  let totalQuizMax = 0;

  quizScores.forEach((q) => {
    totalQuizScore += q.score;
    totalQuizMax += 100;
  });

  let totalSpeechScore = 0;
  let totalSpeechMax = 0;

  speechScores.forEach((s) => {
    totalSpeechScore += s.score;
    totalSpeechMax += 100;
  });

  const quizPercent = totalQuizMax ? (totalQuizScore / totalQuizMax) * 100 : 0;
  const speechPercent = totalSpeechMax ? (totalSpeechScore / totalSpeechMax) * 100 : 0;

  const avgScore = (quizPercent + speechPercent) / 2;

  if (avgScore >= 90) return 'gold';
  if (avgScore >= 75) return 'silver';
  if (avgScore >= 50) return 'bronze';
  return 'none';
}

module.exports = { calculatePronunciationScore };
