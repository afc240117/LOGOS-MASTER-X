"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");

class ClassList {
  constructor(...names) { this.names = new Set(names); }
  add(...names) { names.forEach(name => this.names.add(name)); }
  remove(...names) { names.forEach(name => this.names.delete(name)); }
  contains(name) { return this.names.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.names.has(name) : Boolean(force);
    if (on) this.names.add(name); else this.names.delete(name);
    return on;
  }
}

const makeStyle = () => ({
  values: {},
  setProperty(name, value) { this.values[name] = String(value); },
  removeProperty(name) { delete this.values[name]; },
});

const panel = id => ({
  dataset: { biblePanel: id },
  classList: new ClassList(id === "reader" ? "active" : ""),
  hidden: id !== "reader",
  style: makeStyle(),
  scrollIntoView() {},
  querySelector() { return null; },
});

const reader = panel("reader");
const maps = panel("maps");
const panels = [reader, maps];
const shell = {
  dataset: {},
  classList: new ClassList(),
  scrollTop: 0,
  requestFullscreenCalls: 0,
  async requestFullscreen() {
    this.requestFullscreenCalls += 1;
    document.fullscreenElement = this;
  },
};

const button = (id, icon, title, description) => ({
  dataset: { bibleSection: id },
  clickCalls: 0,
  click() { this.clickCalls += 1; },
  querySelector(selector) {
    return { textContent: selector === "i" ? icon : selector === "b" ? title : description };
  },
});
const readerButton = button("reader", "📖", "Bíblia", "Leitura");
const mapsButton = button("maps", "🗺️", "Mapas X", "Atlas");
const pageButtons = [readerButton, mapsButton];

const selectListeners = {};
const select = {
  dataset: {}, options: [], value: "reader", innerHTML: "",
  addEventListener(type, fn) { selectListeners[type] = fn; },
  scrollIntoView() {}, focus() {}, click() {},
};
const zoomReset = { textContent: "100%", setAttribute() {} };
const fullButton = { hidden: false, setAttribute() {} };
const exitButton = { hidden: true };
const heading = { textContent: "" };
const listeners = {};

global.window = global;
global.CSS = { escape: value => String(value), supports: () => true };
window.CSS = global.CSS;
global.Store = {
  values: {},
  get(key, fallback) { return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : fallback; },
  set(key, value) { this.values[key] = value; },
};
global.escapeHtml = value => String(value);
global.MutationObserver = class { observe() {} };
global.document = {
  fullscreenElement: null,
  webkitFullscreenElement: null,
  body: { classList: new ClassList() },
  documentElement: { classList: new ClassList() },
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
  async exitFullscreen() { this.fullscreenElement = null; },
  querySelector(selector) {
    if (selector === ".bible-x-shell") return shell;
    if (selector === ".bible-x-shell [data-bible-panel].active:not([hidden])") {
      return panels.find(item => item.classList.contains("active") && !item.hidden) || null;
    }
    const panelMatch = selector.match(/data-bible-panel="([^"]+)"/);
    if (panelMatch) return panels.find(item => item.dataset.biblePanel === panelMatch[1]) || null;
    const pageMatch = selector.match(/data-bible-section="([^"]+)"/);
    if (pageMatch) return pageButtons.find(item => item.dataset.bibleSection === pageMatch[1]) || null;
    return ({
      "#bxPageSelect": select,
      "#bxPageZoomReset": zoomReset,
      "#bxPageFullBtn": fullButton,
      "#bxPageExitFullBtn": exitButton,
      "#bxPageTitle": heading,
      "#bxPageDescription": heading,
      "#bxPageStage": heading,
    })[selector] || null;
  },
  querySelectorAll(selector) {
    if (selector === ".bible-x-nav [data-bible-section]") return pageButtons;
    if (selector === ".bible-x-shell [data-bible-panel]") return panels;
    if (selector === "#bxMobileBottomNav [data-bxm]") return [];
    return [];
  },
};

const source = fs.readFileSync(
  path.join(__dirname, "..", "app", "web", "static", "app-381-v133.js"),
  "utf8",
);
const start = source.indexOf("/* Bíblia X — páginas exclusivas");
const end = source.indexOf("/* =========================================================", start);
assert(start >= 0 && end > start, "controlador universal não encontrado");
vm.runInThisContext(source.slice(start, end), { filename: "bible-x-controls.js" });

window.LMXBXPages.sync("reader");
assert.strictEqual(reader.style.values.zoom, "100%");

const action = name => ({
  dataset: { bxPageAction: name },
  closest() { return this; },
});
const fireClick = name => listeners.click[0]({
  target: action(name), preventDefault() {}, stopImmediatePropagation() {},
});

fireClick("larger");
assert.strictEqual(reader.style.values.zoom, "110%");
assert.strictEqual(zoomReset.textContent, "110%");
fireClick("smaller");
assert.strictEqual(reader.style.values.zoom, "100%");

fireClick("fullscreen");
assert(shell.classList.contains("bx-page-full"));
assert(document.body.classList.contains("bx-page-lock"));
assert.strictEqual(shell.requestFullscreenCalls, 1);
fireClick("exit");
assert(!shell.classList.contains("bx-page-full"));

select.value = "maps";
selectListeners.change();
assert.strictEqual(mapsButton.clickCalls, 1, "o seletor deve acionar o botão real do módulo");

console.log("BIBLIA_X_CONTROLS_RUNTIME_OK");
