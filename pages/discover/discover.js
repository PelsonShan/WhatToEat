const { getLocation, searchNearby } = require('../../services/lbs.js');
const { favoriteRestaurant, noveltyCandidates, importHotDish } = require('../../services/discover.js');
const { listHotDishes, listDishes } = require('../../services/dishes.js');

Page({
  data: {
    cuisines: ['川菜', '粤菜', '湘菜', '本帮菜', '家常', '火锅', '烧烤'],
    activeCuisine: '川菜',
    hotAll: [],
    hotFiltered: [],
    novelty: [],
    nearby: [],
    nearbyLoading: false
  },

  onLoad() {
    this.loadHot();
  },

  loadHot() {
    listHotDishes().then((hot) => {
      this.setData({ hotAll: hot });
      this.filterCuisine(this.data.activeCuisine, hot);
      this.loadNovelty(hot);
    });
  },

  filterCuisine(cuisine, hot) {
    const pool = hot || this.data.hotAll;
    this.setData({
      activeCuisine: cuisine,
      hotFiltered: pool.filter((d) => d.cuisine === cuisine)
    });
  },

  onCuisineTap(e) {
    this.filterCuisine(e.currentTarget.dataset.cuisine);
  },

  loadNovelty(hot) {
    noveltyCandidates().then((novelty) => this.setData({ novelty }));
  },

  async seeNearby() {
    if (this.data.nearbyLoading) return;
    const location = await getLocation();
    if (!location) return;
    this.setData({ nearbyLoading: true });
    const pois = await searchNearby({ latitude: location.latitude, longitude: location.longitude });
    this.setData({ nearby: pois, nearbyLoading: false });
  },

  onFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const poi = this.data.nearby.find((p) => p.id === id);
    if (!poi) return;
    favoriteRestaurant(poi).then((ok) => {
      if (ok) {
        this.setData({
          nearby: this.data.nearby.map((p) => (p.id === id ? { ...p, favorited: true } : p))
        });
      }
    });
  },

  onImport(e) {
    const id = e.currentTarget.dataset.id;
    const dish = this.data.hotAll.find((d) => d._id === id);
    if (!dish) return;
    importHotDish(dish).then((ok) => {
      if (ok) this.loadNovelty();
    });
  }
});
