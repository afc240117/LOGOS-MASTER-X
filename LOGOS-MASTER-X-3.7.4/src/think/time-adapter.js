export const TIME_PROFILES={
  20:{points:2,intro:3,context:3,exposition:8,application:3,climax:2,appeal:1,depth:"enxuta"},
  30:{points:3,intro:4,context:4,exposition:11,application:5,climax:4,appeal:2,depth:"média"},
  35:{points:3,intro:4,context:5,exposition:13,application:6,climax:4,appeal:3,depth:"média-ampla"},
  40:{points:4,intro:4,context:6,exposition:16,application:7,climax:4,appeal:3,depth:"ampla"},
  50:{points:4,intro:5,context:7,exposition:20,application:9,climax:5,appeal:4,depth:"ampla"},
  60:{points:5,intro:6,context:8,exposition:24,application:10,climax:7,appeal:5,depth:"profunda"},
  70:{points:5,intro:6,context:10,exposition:28,application:12,climax:8,appeal:6,depth:"profunda-reflexiva"}
};
export function timeProfile(minutes=30){const n=Number(minutes)||30;const keys=Object.keys(TIME_PROFILES).map(Number).sort((a,b)=>a-b);let best=keys[0];for(const k of keys)if(Math.abs(k-n)<Math.abs(best-n))best=k;return {...TIME_PROFILES[best],requested:n,base:best};}
