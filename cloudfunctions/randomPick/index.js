const cloud = require('wx-server-sdk');
const { composeMeal, pickRestaurant, pickOutsideCandidates } = require('./utils/random-pick.js');
const { isJackpotAllowed, jackpotRate } = require('./utils/time.js');
const { searchNearby } = require('./lbs.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function haversine(a, b) {
  const R = 6371000;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const lat1 = rad(a.latitude);
  const lat2 = rad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

async function loadCollection(name) {
  const res = await db.collection(name).limit(100).get();
  return res.data || [];
}

async function loadHistory() {
  const res = await db.collection('pick_history').orderBy('createdAt', 'desc').limit(100).get();
  return res.data || [];
}

function withDistance(restaurant, location) {
  if (!location || !restaurant || !restaurant.location) return restaurant;
  const distance = haversine(location, restaurant.location);
  const distanceText = distance >= 1000 ? `${(distance / 1000).toFixed(1)} 公里` : `${distance}m`;
  return { ...restaurant, distance, distanceText };
}

exports.main = async (event) => {
  const { mode, combo, location } = event || {};
  const now = Date.now();
  const history = await loadHistory();

  if (mode === 'jackpot' && isJackpotAllowed(new Date())) {
    const restaurants = await loadCollection('restaurants');
    const restaurant = pickRestaurant(restaurants, history, now);
    if (!restaurant) {
      return { jackpot: true, restaurant: null, empty: true };
    }
    return {
      jackpot: true,
      restaurant: withDistance({ ...restaurant, id: restaurant._id || restaurant.id }, location)
    };
  }

  if (mode === 'outside') {
    const restaurants = await loadCollection('restaurants');
    const pois = await searchNearby(location);
    const favoriteIds = restaurants.map((r) => r.poiId).filter(Boolean);
    const candidates = pickOutsideCandidates(pois, favoriteIds, history, now, 3);
    return {
      outside: true,
      candidates: candidates.map((poi) => ({
        ...poi,
        distance: haversine(location, poi.location || {}),
        isFavorite: favoriteIds.includes(poi.id)
      })),
      location
    };
  }

  const current = new Date();
  if (isJackpotAllowed(current) && Math.random() < jackpotRate(current)) {
    const restaurants = await loadCollection('restaurants');
    const restaurant = pickRestaurant(restaurants, history, now);
    if (restaurant) {
      return {
        jackpot: true,
        restaurant: withDistance({ ...restaurant, id: restaurant._id || restaurant.id }, location)
      };
    }
  }

  const dishes = await loadCollection('dishes');
  const result = composeMeal(
    dishes.map((d) => ({ id: d._id, name: d.name, category: d.category })),
    history,
    combo || '三菜一汤',
    now
  );
  return result;
};
