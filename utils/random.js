/**
 * Random helpers (seedable for deterministic output)
 */

function hashSeed(input) {
  const str = String(input ?? '');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let t = hashSeed(seed);
  return function rng() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(min, max, decimals = 2, rng = Math.random) {
  const value = min + rng() * (max - min);
  return Number(value.toFixed(decimals));
}

function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickOne(list, rng = Math.random) {
  if (!Array.isArray(list) || list.length === 0) {
    return undefined;
  }
  return list[Math.floor(rng() * list.length)];
}

function pickMany(list, count, rng = Math.random) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const copy = [...list];
  const limit = Math.min(count, copy.length);
  const chosen = [];
  while (chosen.length < limit) {
    const index = Math.floor(rng() * copy.length);
    chosen.push(copy.splice(index, 1)[0]);
  }
  return chosen;
}

module.exports = {
  hashSeed,
  createRng,
  randomBetween,
  randomInt,
  pickOne,
  pickMany
};
