import { FAQ } from "@/lib/types";

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreTokenOverlap(messageTokens: string[], faqTokens: string[]) {
  const uniqueFaq = new Set(faqTokens);
  const overlap = messageTokens.filter((token) => uniqueFaq.has(token)).length;
  return faqTokens.length ? overlap / faqTokens.length : 0;
}

export function matchFAQ(message: string, faqs: FAQ[]) {
  const messageTokens = tokenize(message);
  const normalizedMessage = message.toLowerCase();
  let bestMatch: { faq: FAQ; score: number; reason: string } | null = null;

  for (const faq of faqs.filter((item) => item.is_active)) {
    const keywordScore = (faq.keywords ?? []).reduce((score, keyword) => {
      return normalizedMessage.includes(keyword.toLowerCase()) ? score + 0.3 : score;
    }, 0);
    const questionTokens = tokenize(faq.question);
    const answerTokens = tokenize(faq.answer);
    const overlapScore = scoreTokenOverlap(messageTokens, [...questionTokens, ...answerTokens.slice(0, 20)]);
    const directQuestionBoost = normalizedMessage.includes(faq.question.toLowerCase()) ? 0.5 : 0;
    const priorityBoost = Math.min(faq.priority / 20, 0.2);
    const totalScore = keywordScore + overlapScore + directQuestionBoost + priorityBoost;

    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = {
        faq,
        score: totalScore,
        reason: keywordScore > overlapScore ? "keyword" : "fuzzy"
      };
    }
  }

  if (!bestMatch || bestMatch.score < 0.45) {
    return null;
  }

  return bestMatch;
}
