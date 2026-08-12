export const Store = {
  prefix: "logosx:",
  get(key, fallback=null) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
    return value;
  },
  remove(key) { localStorage.removeItem(this.prefix + key); },
  list(key) { return this.get(key, []); },
  push(key, item, limit=500) {
    const arr = this.list(key);
    arr.unshift(item);
    this.set(key, arr.slice(0, limit));
    return item;
  },
  exportAll() {
    const out = {};
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) out[k] = localStorage.getItem(k);
    }
    return out;
  },
  importAll(obj) {
    Object.entries(obj||{}).forEach(([k,v]) => {
      if (k.startsWith(this.prefix)) localStorage.setItem(k, v);
    });
  }
};
