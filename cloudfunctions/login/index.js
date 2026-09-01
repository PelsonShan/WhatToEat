const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const col = db.collection('users');
  const found = await col.where({ openid: OPENID }).get();
  if (found.data.length) {
    return { openid: OPENID, user: found.data[0] };
  }
  const user = {
    openid: OPENID,
    nickname: '',
    avatar: '',
    familyRole: '',
    createdAt: Date.now()
  };
  await col.add({ data: user });
  return { openid: OPENID, user };
};
