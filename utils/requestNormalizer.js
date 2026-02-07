/**
 * Request Normalizer
 * Ensures the pipeline can run even with missing fields by applying defaults.
 */

const fs = require('fs');
const path = require('path');
const { pickOne, randomInt, createRng } = require('./random');

const defaultLocations = [
  {
    lat: 40.7128,
    lon: -74.0060,
    address: 'Lower Manhattan, New York, NY'
  },
  {
    lat: 34.0522,
    lon: -118.2437,
    address: 'Downtown Los Angeles, CA'
  },
  {
    lat: 41.8781,
    lon: -87.6298,
    address: 'The Loop, Chicago, IL'
  },
  {
    lat: 29.7604,
    lon: -95.3698,
    address: 'Downtown Houston, TX'
  },
  {
    lat: 47.6062,
    lon: -122.3321,
    address: 'Seattle, WA'
  }
];

const defaultMaterials = [
  'mixed recyclables',
  'cardboard boxes',
  'plastic film',
  'food-grade packaging',
  'metal scrap'
];

let cachedDataset = null;

function loadDataset() {
  if (cachedDataset) return cachedDataset;
  const datasetPath = path.join(__dirname, '..', 'indian_waste_management_dataset.json');
  const raw = fs.readFileSync(datasetPath, 'utf8');
  cachedDataset = JSON.parse(raw);
  return cachedDataset;
}

function pickCompanyFromDataset(rng) {
  try {
    const dataset = loadDataset();
    const companies = Array.isArray(dataset.companies) ? dataset.companies : [];
    if (companies.length === 0) return null;
    return pickOne(companies, rng);
  } catch (error) {
    return null;
  }
}

function buildDefaultLocation(rng) {
  const choice = pickOne(defaultLocations, rng);
  return {
    lat: choice.lat,
    lon: choice.lon,
    address: choice.address
  };
}

function normalizeLocation(locationInput, warnings, rng) {
  if (!locationInput || typeof locationInput !== 'object') {
    warnings.push('location missing; default location applied');
    return buildDefaultLocation(rng);
  }

  const fallback = buildDefaultLocation(rng);
  const lat = typeof locationInput.lat === 'number' ? locationInput.lat : fallback.lat;
  const lon = typeof locationInput.lon === 'number' ? locationInput.lon : fallback.lon;
  const address = typeof locationInput.address === 'string' && locationInput.address.trim()
    ? locationInput.address
    : fallback.address;

  if (lat === fallback.lat && lon === fallback.lon && address === fallback.address) {
    warnings.push('location incomplete; missing fields defaulted');
  }

  return { lat, lon, address };
}

function normalizeWasteItems(wasteItemsInput, warnings, rng) {
  const items = Array.isArray(wasteItemsInput) ? wasteItemsInput : [];
  if (items.length === 0) {
    warnings.push('wasteItems missing or empty; generated default items');
    const count = randomInt(1, 2, rng);
    return Array.from({ length: count }).map(() => ({
      material: pickOne(defaultMaterials, rng),
      quantity: randomInt(80, 400, rng),
      unit: 'kg',
      location: buildDefaultLocation(rng)
    }));
  }

  return items.map((item) => {
    const safeItem = item && typeof item === 'object' ? item : {};
    const material = typeof safeItem.material === 'string' && safeItem.material.trim()
      ? safeItem.material
      : pickOne(defaultMaterials, rng);
    if (!safeItem.material) {
      warnings.push('material missing; default material applied');
    }

    const quantity = typeof safeItem.quantity === 'number' && Number.isFinite(safeItem.quantity)
      ? safeItem.quantity
      : randomInt(80, 400, rng);
    if (typeof safeItem.quantity !== 'number') {
      warnings.push('quantity missing; default quantity applied');
    }

    const unit = typeof safeItem.unit === 'string' && safeItem.unit.trim()
      ? safeItem.unit
      : 'kg';
    if (!safeItem.unit) {
      warnings.push('unit missing; default unit applied');
    }

    const location = normalizeLocation(safeItem.location, warnings, rng);

    return {
      material,
      quantity,
      unit,
      location
    };
  });
}

function normalizeRequest(input, seed) {
  const requestData = input && typeof input === 'object' ? input : {};
  const warnings = [];
  const rng = createRng(seed ?? JSON.stringify(requestData));

  const hasInputFields = Object.keys(requestData).length > 0;
  if (!hasInputFields) {
    const pickedCompany = pickCompanyFromDataset(rng);
    if (pickedCompany) {
      warnings.push('empty request; hydrated from dataset company');
      return {
        request: {
          companyId: pickedCompany.companyId,
          companySize: pickedCompany.companySize || 'SME',
          industry: pickedCompany.industry || 'other',
          riskAppetite: pickedCompany.riskAppetite || 'cost',
          city: pickedCompany.city,
          state: pickedCompany.state,
          wasteItems: Array.isArray(pickedCompany.wasteItems) && pickedCompany.wasteItems.length > 0
            ? pickedCompany.wasteItems
            : normalizeWasteItems([], warnings, rng)
        },
        warnings
      };
    }
  }

  const fallbackCompany = pickCompanyFromDataset(rng);

  const companyId = typeof requestData.companyId === 'string' && requestData.companyId.trim()
    ? requestData.companyId
    : fallbackCompany && fallbackCompany.companyId
      ? fallbackCompany.companyId
      : `ANON-${Math.floor(rng() * 1e8).toString(36).toUpperCase()}`;
  if (!requestData.companyId) {
    warnings.push(fallbackCompany && fallbackCompany.companyId
      ? 'companyId missing; hydrated from dataset'
      : 'companyId missing; generated anonymous companyId');
  }

  const companySize = requestData.companySize
    ? requestData.companySize
    : fallbackCompany && fallbackCompany.companySize
      ? fallbackCompany.companySize
      : 'SME';
  if (!requestData.companySize) {
    warnings.push(fallbackCompany && fallbackCompany.companySize
      ? 'companySize missing; hydrated from dataset'
      : 'companySize missing; defaulted to SME');
  }

  const industry = requestData.industry
    ? requestData.industry
    : fallbackCompany && fallbackCompany.industry
      ? fallbackCompany.industry
      : 'other';
  if (!requestData.industry) {
    warnings.push(fallbackCompany && fallbackCompany.industry
      ? 'industry missing; hydrated from dataset'
      : 'industry missing; defaulted to other');
  }

  const riskAppetite = requestData.riskAppetite
    ? requestData.riskAppetite
    : fallbackCompany && fallbackCompany.riskAppetite
      ? fallbackCompany.riskAppetite
      : 'cost';
  if (!requestData.riskAppetite) {
    warnings.push(fallbackCompany && fallbackCompany.riskAppetite
      ? 'riskAppetite missing; hydrated from dataset'
      : 'riskAppetite missing; defaulted to cost');
  }

  const wasteItemsInput = requestData.wasteItems && Array.isArray(requestData.wasteItems)
    ? requestData.wasteItems
    : fallbackCompany && Array.isArray(fallbackCompany.wasteItems)
      ? fallbackCompany.wasteItems
      : [];

  if (!requestData.wasteItems) {
    warnings.push(fallbackCompany && Array.isArray(fallbackCompany.wasteItems)
      ? 'wasteItems missing; hydrated from dataset'
      : 'wasteItems missing; defaulted to generated items');
  }

  const wasteItems = normalizeWasteItems(wasteItemsInput, warnings, rng);

  return {
    request: {
      companyId,
      companySize,
      industry,
      riskAppetite,
      city: requestData.city || (fallbackCompany ? fallbackCompany.city : undefined),
      state: requestData.state || (fallbackCompany ? fallbackCompany.state : undefined),
      wasteItems
    },
    warnings
  };
}

module.exports = {
  normalizeRequest
};
