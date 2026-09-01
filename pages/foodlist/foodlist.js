const {
  listDishes,
  listRestaurants,
  addDish,
  addRestaurant,
  updateItem,
  removeItem,
  listHotDishes,
  importHotDish
} = require('../../services/dishes.js');

Page({
  data: {
    tab: 'kitchen',
    keyword: '',
    dishes: [],
    restaurants: [],
    hotDishes: [],
    showForm: false,
    showHot: false,
    editingId: '',
    categories: ['主菜', '汤', '主食'],
    form: {},
    statusBarHeight: 20
  },

  onShow() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    if (this.getTabBar) this.getTabBar().setData({ selected: 1 });
    this.load();
  },

  load() {
    if (this.data.tab === 'kitchen') {
      listDishes(this.data.keyword).then((dishes) => this.setData({ dishes }));
    } else {
      listRestaurants(this.data.keyword).then((restaurants) => this.setData({ restaurants }));
    }
  },

  onTabTap(e) {
    this.setData({ tab: e.currentTarget.dataset.tab }, () => this.load());
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.load();
  },

  openAdd() {
    this.setData({
      showForm: true,
      editingId: '',
      form: this.data.tab === 'kitchen'
        ? { name: '', category: '主菜', cuisine: '', frequent: false }
        : { name: '', address: '', frequent: false, note: '' }
    });
  },

  openEdit(e) {
    const { id, type } = e.currentTarget.dataset;
    const source = type === 'dish' ? this.data.dishes : this.data.restaurants;
    const item = source.find((x) => x._id === id);
    if (!item) return;
    this.setData({
      showForm: true,
      editingId: id,
      form: type === 'dish'
        ? { name: item.name, category: item.category, cuisine: item.cuisine || '', frequent: !!item.frequent }
        : { name: item.name, address: item.address || '', frequent: !!item.frequent, note: item.note || '' }
    });
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCategoryTap(e) {
    this.setData({ 'form.category': this.data.categories[e.currentTarget.dataset.index] });
  },

  onFrequentChange(e) {
    this.setData({ 'form.frequent': e.detail.value });
  },

  closeForm() {
    this.setData({ showForm: false, editingId: '' });
  },

  saveForm() {
    const form = this.data.form;
    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '请填写名称', icon: 'none' });
      return;
    }
    const save = this.data.tab === 'kitchen'
      ? () => addDish(form)
      : () => addRestaurant(form);
    if (this.data.editingId) {
      const collection = this.data.tab === 'kitchen' ? 'dishes' : 'restaurants';
      updateItem(collection, this.data.editingId, form).then((ok) => {
        if (ok) {
          this.closeForm();
          this.load();
        }
      });
    } else {
      save().then((ok) => {
        if (ok) {
          this.closeForm();
          this.load();
        }
      });
    }
  },

  onDelete(e) {
    const { id, type, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除',
      content: `确认删除“${name}”？`,
      success: (res) => {
        if (!res.confirm) return;
        const collection = type === 'dish' ? 'dishes' : 'restaurants';
        removeItem(collection, id).then((ok) => {
          if (ok) this.load();
        });
      }
    });
  },

  openHot() {
    listHotDishes().then((hotDishes) => this.setData({ showHot: true, hotDishes }));
  },

  closeHot() {
    this.setData({ showHot: false });
  },

  onImport(e) {
    const id = e.currentTarget.dataset.id;
    const dish = this.data.hotDishes.find((d) => d._id === id);
    if (!dish) return;
    importHotDish(dish).then((ok) => {
      if (ok) {
        this.setData({ showHot: false });
        this.load();
      }
    });
  }
});
