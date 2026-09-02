const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function searchNearby(location, keyword = '美食', radius = 5000) {
  const key = process.env.TENCENT_LBS_KEY;
  if (!key) throw new Error('TENCENT_LBS_KEY 未配置');
  const base = 'https://apis.map.qq.com/ws/place/v1/explore';
  const boundary = `nearby(${location.latitude},${location.longitude},${radius})`;
  const url = `${base}?keyword=${encodeURIComponent(keyword)}&boundary=${encodeURIComponent(boundary)}&page_size=20&page_index=1&orderby=_distance&key=${encodeURIComponent(key)}`;
  const body = JSON.parse(await httpGet(url));
  if (body.status !== 0) throw new Error(body.message || '附近检索失败');
  return (body.data || []).map((raw) => ({
    id: raw.id || raw.title,
    title: raw.title || raw.name || '未命名馆子',
    address: raw.address || '',
    location: { latitude: (raw.location || {}).lat, longitude: (raw.location || {}).lng },
    category: raw.category || '',
    rating: raw.rating || raw.score || 0,
    distance: raw._distance || 0
  }));
}

module.exports = { searchNearby };
