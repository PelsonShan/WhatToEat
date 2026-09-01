const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function cleanPoi(raw) {
  const loc = raw.location || {};
  return {
    id: raw.id || raw.title || '',
    title: raw.title || raw.name || '未命名馆子',
    address: raw.address || '',
    location: { latitude: loc.lat, longitude: loc.lng },
    category: raw.category || '',
    rating: raw.rating || raw.score || 0,
    distance: raw._distance || 0
  };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

exports.main = async (event) => {
  const { location, keyword = '美食', radius = 5000 } = event || {};
  const key = process.env.TENCENT_LBS_KEY;
  if (!key) {
    throw new Error('TENCENT_LBS_KEY 未配置');
  }
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('缺少定位信息');
  }
  const base = 'https://apis.map.qq.com/ws/place/v1/explore';
  const url = `${base}?keyword=${encodeURIComponent(keyword)}&location=${location.latitude},${location.longitude}&radius=${radius}&page_size=20&page_index=1&orderby=_distance&key=${key}`;
  const body = JSON.parse(await httpGet(url));
  if (body.status !== 0) {
    throw new Error(body.message || '附近检索失败');
  }
  return {
    pois: (body.data || []).map(cleanPoi),
    location
  };
};
