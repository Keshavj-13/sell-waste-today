/**
 * Request Normalizer
 * Ensures the pipeline can run even with missing fields by applying defaults.
 */

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

  const companyId = typeof requestData.companyId === 'string' && requestData.companyId.trim()
    ? requestData.companyId
    : `ANON-${Math.floor(rng() * 1e8).toString(36).toUpperCase()}`;
  if (!requestData.companyId) {
    warnings.push('companyId missing; generated anonymous companyId');
  }

  const companySize = requestData.companySize ? requestData.companySize : 'SME';
  if (!requestData.companySize) {
    warnings.push('companySize missing; defaulted to SME');
  }

  const industry = requestData.industry ? requestData.industry : 'other';
  if (!requestData.industry) {
    warnings.push('industry missing; defaulted to other');
  }

  const riskAppetite = requestData.riskAppetite ? requestData.riskAppetite : 'cost';
  if (!requestData.riskAppetite) {
    warnings.push('riskAppetite missing; defaulted to cost');
  }

  const wasteItems = normalizeWasteItems(requestData.wasteItems, warnings, rng);

  return {
    request: {
      companyId,
      companySize,
      industry,
      riskAppetite,
      wasteItems
    },
    warnings
  };
}

module.exports = {
  normalizeRequest
};
