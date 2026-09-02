"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app/web/static/app-381-v133.js"), "utf8");
const start = source.indexOf("window.LMXStudioGoStep=function(n){");
const end = source.indexOf("\n  };", start);
assert(start >= 0 && end > start, "controlador de etapas 5.3.9 não encontrado");

const state = {
  studioStep: 1,
  studioGenerationRequest: {},
  studioProcessing: {},
};
const events = [];
const renders = [];

global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
};
global.window = {
  dispatchEvent(event) { events.push(event); },
};
global.Store = {
  get(key, fallback) { return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback; },
  set(key, value) { state[key] = value; return value; },
};
global.render = view => renders.push(view);

eval(source.slice(start, end + 5));

window.LMXStudioGoStep(4);
assert.strictEqual(state.studioStep, 4);
assert.strictEqual(renders.at(-1), "studio");
assert.strictEqual(events.at(-1).detail.to, 4);

window.LMXStudioGoStep(6);
assert.strictEqual(state.studioStep, 6);
assert.strictEqual(state.studioProcessing.previewOnly, true);
assert.strictEqual(state.studioProcessing.status, "idle");
assert.match(state.studioProcessing.message, /só começa após confirmar/i);

state.studioStep = 5;
state.studioGenerationRequest = { status: "ready" };
state.studioProcessing = { status: "idle", marker: "preservado" };
window.LMXStudioGoStep(6);
assert.strictEqual(state.studioProcessing.marker, "preservado");

window.LMXStudioGoStep(7);
assert.strictEqual(state.studioStep, 7);
assert.strictEqual(state.studioResultTab, "mensagem");

console.log("studio step navigation v5.3.9 runtime: ok");
