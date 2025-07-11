import { diffWords } from 'diff';

export function calculatePronunciationScore(expectedText, spokenText) {
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