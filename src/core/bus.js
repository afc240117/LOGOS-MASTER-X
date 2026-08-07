export const Bus = {
  listeners: new Map(),
  on(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(fn);
    return () => this.listeners.get(name)?.delete(fn);
  },
  emit(name, payload) {
    (this.listeners.get(name)||[]).forEach(fn => {
      try { fn(payload); } catch(e) { console.error("LOGOS event error", name, e); }
    });
  }
};
