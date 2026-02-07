/**
 * Layer 1: Global Context Intelligence Agent
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

function detectCity(address, cities) {
  if (!address || !Array.isArray(cities)) return undefined;
  const lower = address.toLowerCase();
  return cities.find((city) => lower.includes(city.toLowerCase()));
}

function summarizeDatasetSignals(dataset, requestData) {
  const safeRequest = requestData && typeof requestData === 'object' ? requestData : {};
  const industry = safeRequest.industry || 'other';
  const wasteItems = Array.isArray(safeRequest.wasteItems) ? safeRequest.wasteItems : [];
  const materials = wasteItems
    .map((item) => (item && item.material ? String(item.material).toLowerCase() : null))
    .filter(Boolean);

  const address = wasteItems[0] && wasteItems[0].location ? wasteItems[0].location.address : '';
  const city =
    safeRequest.city ||
    detectCity(address, dataset.metadata && dataset.metadata.cities ? dataset.metadata.cities : []);

  const companies = Array.isArray(dataset.companies) ? dataset.companies : [];
  const relevant = companies.filter((company) => {
    if (city && company.city !== city) return false;
    if (industry && company.industry !== industry) return false;
    return true;
  });

  const materialCounts = new Map();
  relevant.forEach((company) => {
    if (!Array.isArray(company.wasteItems)) return;
    company.wasteItems.forEach((item) => {
      const material = item && item.material ? String(item.material).toLowerCase() : null;
      if (!material) return;
      materialCounts.set(material, (materialCounts.get(material) || 0) + 1);
    });
  });

  const topMaterials = Array.from(materialCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([material]) => material);

  return {
    city,
    industry,
    materials,
    summary: `Dataset has ${dataset.metadata && dataset.metadata.totalCompanies ? dataset.metadata.totalCompanies : 'N/A'} companies across ${dataset.metadata && dataset.metadata.cities ? dataset.metadata.cities.length : 'N/A'} cities. Matches: ${relevant.length} companies for ${city || 'unknown city'} and ${industry}. Common materials: ${topMaterials.length ? topMaterials.join(', ') : 'varied'}.`
  };
}

function buildPrompt(signalSummary) {
  return [
    'System: You are generating explanatory context, not making decisions.',
    `Dataset context: ${signalSummary.summary}`,
    `Request signals: city=${signalSummary.city || 'unknown'}, industry=${signalSummary.industry || 'unknown'}, materials=${signalSummary.materials.length ? signalSummary.materials.join(', ') : 'unknown'}.`,
    'Task: Summarize global and regional waste context, identify demand signals, and mention sustainability considerations.',
    'Respond in 2-3 concise sentences. Do not hallucinate unknown facts; if unsure, say it is unclear.'
  ].join('\n');
}

function deterministicFallbackText(signalSummary) {
  const cityPart = signalSummary.city ? ` in ${signalSummary.city}` : '';
  const materialPart = signalSummary.materials.length
    ? ` Materials include ${signalSummary.materials.slice(0, 3).join(', ')}.`
    : ' Materials are mixed and not fully specified.';
  return `Context for ${signalSummary.industry || 'general'} operations${cityPart} indicates steady regional activity and routine logistics availability.${materialPart} Sustainability considerations focus on consolidating pickups and reducing transport distance.`;
}

async function analyzeGlobalContext(requestData) {
  const timestamp = new Date().toISOString();

  try {
    const dataset = loadDataset();
    const signalSummary = summarizeDatasetSignals(dataset, requestData);
    const prompt = buildPrompt(signalSummary);
    const text = await generateGeminiText(prompt);

    if (!text) {
      throw new Error('Empty Gemini response');
    }

    return {
      layer: 'layer1',
      title: 'Layer 1: Global Context Intelligence Agent',
      text,
      timestamp
    };
  } catch (error) {
    const dataset = cachedDataset || loadDataset();
    const signalSummary = summarizeDatasetSignals(dataset, requestData);
    return {
      layer: 'layer1',
      title: 'Layer 1: Global Context Intelligence Agent',
      text: deterministicFallbackText(signalSummary),
      timestamp
    };
  }
}

module.exports = {
  analyzeGlobalContext
};
