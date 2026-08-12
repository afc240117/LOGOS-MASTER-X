import { Store } from "./store.js";
import { Bus } from "./bus.js";
import { Router } from "./router.js";
import { qualityGate } from "./quality-gate.js";

export const LOGOS = {
  name:"LOGOS MASTER X",
  version:"X.0-foundation",
  Store, Bus, Router, qualityGate,
  state: {
    dnaIntensity: Store.get("settings:dnaIntensity",3),
    duration: Store.get("settings:duration",30),
    cult: Store.get("settings:cult","Avivamento")
  },
  configure(next={}) {
    Object.assign(this.state,next);
    Object.entries(next).forEach(([k,v])=>Store.set("settings:"+k,v));
    Bus.emit("config:changed",this.state);
  }
};
window.LOGOS = LOGOS;
