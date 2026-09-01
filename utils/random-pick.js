const DAY = 24 * 60 * 60 * 1000;

const COMBO_NEEDS = {
  '一菜一汤': { main: 1, soup: 1 },
  '两菜一汤': { main: 2, soup: 1 },
  '三菜一汤': { main: 3, soup: 1 },
  '自由单点': { main: 1, soup: 0 }
};

function scoreByHistory(history, targetId, now, altId) {
  let last = 0;
  for (const h of history || []) {
    const hitDish = h.dishIds && h.dishIds.includes(targetId);
    const hitRestaurant = h.restaurantId && h.restaurantId === targetId;
    const hitAlt = h.restaurantId && altId && h.restaurantId === altId;
    if ((hitDish || hitRestaurant || hitAlt) && h.createdAt > last) {
      last = h.createdAt;
    }
  }
  if (!last) return 1;
  const age = now - last;
  if (age < DAY) return 0;
  if (age < 3 * DAY) return 0.2;
  if (age < 7 * DAY) return 0.5;
  return 1;
}

function pickWeighted(candidates, scoreOf, rng) {
  const weighted = [];
  let total = 0;
  for (const item of candidates) {
    const raw = scoreOf(item);
    const w = raw > 0 ? raw : 0.01;
    total += w;
    weighted.push({ item, w });
  }
  if (!weighted.length) return null;
  let roll = rng() * total;
  for (const entry of weighted) {
    roll -= entry.w;
    if (roll <= 0) return entry.item;
  }
  return weighted[weighted.length - 1].item;
}

function composeMeal(dishes, history, combo, now, rng = Math.random) {
  const needs = COMBO_NEEDS[combo];
  if (!needs) {
    throw new Error(`未知组合：${combo}`);
  }
  const mains = dishes.filter((d) => d.category === '主菜');
  const soups = dishes.filter((d) => d.category === '汤');
  const selected = [];
  let relaxed = false;

  function fillFrom(pool, count, category) {
    let candidates = pool.filter((d) => !selected.includes(d));
    let poolOk = candidates.filter((d) => scoreByHistory(history, d.id, now) > 0);
    if (poolOk.length < count) {
      poolOk = candidates.filter((d) => scoreByHistory(history, d.id, now) >= 0.2);
      if (poolOk.length < count) poolOk = candidates;
      relaxed = true;
    }
    const chosen = [];
    for (let i = 0; i < count; i += 1) {
      const picked = pickWeighted(poolOk, (d) => scoreByHistory(history, d.id, now), rng);
      if (!picked) return;
      chosen.push(picked);
      poolOk = poolOk.filter((d) => d !== picked);
      candidates = candidates.filter((d) => d !== picked);
    }
    selected.push(...chosen.map((d) => ({ id: d.id, name: d.name, category: d.category })));
  }

  fillFrom(mains, needs.main, '主菜');
  const soupMissing = needs.soup > 0 && selected.filter((d) => d.category === '汤').length < needs.soup;
  fillFrom(soups, needs.soup, '汤');
  return {
    dishes: selected,
    relaxed: relaxed || selected.length < needs.main + needs.soup,
    soupMissing: needs.soup > 0 && selected.filter((d) => d.category === '汤').length < needs.soup
  };
}

function pickRestaurant(restaurants, history, now, rng = Math.random) {
  if (!restaurants || !restaurants.length) return null;
  const candidates = restaurants.map((r) => ({ ...r, id: r._id || r.id }));
  const scoreOf = (r) => scoreByHistory(history, r.id, now, r.poiId);
  const positive = candidates.filter((r) => scoreOf(r) > 0);
  const pool = positive.length ? positive : candidates;
  return pickWeighted(pool, scoreOf, rng);
}

function pickOutsideCandidates(pois, favoriteIds, history, now, count = 3, rng = Math.random) {
  const seen = new Set();
  const favorites = [];
  const others = [];
  for (const poi of pois || []) {
    if (seen.has(poi.id || poi.title)) continue;
    seen.add(poi.id || poi.title);
    if (favoriteIds && favoriteIds.includes(poi.id)) {
      favorites.push(poi);
    } else {
      others.push(poi);
    }
  }
  const scoreOf = (poi) => scoreByHistory(history, poi.id, now);
  const ordered = [...favorites, ...others].sort((a, b) => scoreOf(b) - scoreOf(a));
  const chosen = [];
  let pool = ordered.slice();
  while (chosen.length < count && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool[idx]);
    pool = pool.filter((_, i) => i !== idx);
  }
  return chosen;
}

module.exports = {
  composeMeal,
  scoreByHistory,
  pickRestaurant,
  pickOutsideCandidates
};
