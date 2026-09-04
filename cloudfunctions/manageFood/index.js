const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const ALLOWED_COLLECTIONS = ['dishes', 'restaurants'];

exports.main = async (event) => {
  const { action, collection, id } = event || {};
  if (
    action !== 'remove' ||
    !ALLOWED_COLLECTIONS.includes(collection) ||
    typeof id !== 'string' ||
    !id
  ) {
    return { ok: false };
  }

  try {
    await db.collection(collection).doc(id).remove();
    return { ok: true };
  } catch (err) {
    console.error('[manageFood] remove failed', collection, id, err);
    return { ok: false, message: err.message };
  }
};
