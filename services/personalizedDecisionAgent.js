/**
 * Layer 2: Personalized Decision Agent
 *
 * Gemini-enhanced with deterministic fallback.
 */

const fs = require('fs');
const path = require('path');
const { generateGeminiText } = require('../utils/geminiClient');

let cachedDataset = null;

function loadDataset() {
  if (cachedDataset) return cachedDataset;
  const datasetPath = path.join(__dirname, '..', 'indian_waste_management_dataset.json');
  const raw = fs.readFileSync(datasetPath, 'utf8');
  cachedDataset = JSON.parse(raw);
  return cachedDataset;
}

function summarizeBehavior(dataset, requestData) {
  const safeRequest = requestData && typeof requestData === 'object' ? requestData : {};
  const industry = safeRequest.industry || 'other';
  const companySize = safeRequest.companySize || 'SME';
  const riskAppetite = safeRequest.riskAppetite || 'cost';

  const companies = Array.isArray(dataset.companies) ? dataset.companies : [];
  const relevant = companies.filter((company) => company.industry === industry);

  const riskCounts = new Map();
  relevant.forEach((company) => {
    const risk = company.riskAppetite || 'unknown';
    riskCounts.set(risk, (riskCounts.get(risk) || 0) + 1);
  });

  const topRisk = Array.from(riskCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)
    .map(([risk]) => risk)[0];

  return {
    industry,
    companySize,
    riskAppetite,
    summary: `Industry ${industry} has ${relevant.length} companies in dataset; dominant risk preference is ${topRisk || 'mixed'}.`
  };
}

function buildPrompt(summary) {
  return [
    'System: You are generating explanatory context, not making decisions.',
    `Dataset context: ${summary.summary}`,
    `Request signals: companySize=${summary.companySize}, riskAppetite=${summary.riskAppetite}, industry=${summary.industry}.`,
    'Task: Generate a short adaptive reasoning message tailored to the company profile.',
    'Respond in 2-3 concise sentences. Do not hallucinate unknown facts; if unsure, say it is unclear.'
  ].join('\n');
}

function deterministicFallbackText(summary) {
  return `Adapting pickup strategy for a ${summary.companySize} ${summary.industry} business with a ${summary.riskAppetite} risk appetite. Recommendations remain conservative and transparent given limited historical signals. Decisions prioritize predictable outcomes and operational clarity.`;
}

async function generatePersonalizedDecision(requestData) {
  const timestamp = new Date().toISOString();

  try {
    const dataset = loadDataset();
    const summary = summarizeBehavior(dataset, requestData);
    const prompt = buildPrompt(summary);
    const text = await generateGeminiText(prompt);

    if (!text) {
      throw new Error('Empty Gemini response');
    }

    return {
      layer: 'layer2',
      title: 'Layer 2: Personalized Decision Agent',
      text,
      timestamp
    };
  } catch (error) {
    const dataset = cachedDataset || loadDataset();
    const summary = summarizeBehavior(dataset, requestData);
    return {
      layer: 'layer2',
      title: 'Layer 2: Personalized Decision Agent',
      text: deterministicFallbackText(summary),
      timestamp
    };
  }
}

module.exports = {
  generatePersonalizedDecision
};
