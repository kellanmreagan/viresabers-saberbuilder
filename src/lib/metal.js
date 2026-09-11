const PRESETS = {
  black: { body: "#1c1e22", accent: "#c8ccd3", recess: "#111214", roughness: 0.42, metalness: 0.86 },
  "matte black": { body: "#18191c", accent: "#9aa0a8", recess: "#0d0e10", roughness: 0.55, metalness: 0.8 },
  "glossy black": { body: "#121316", accent: "#d0d4da", recess: "#070708", roughness: 0.16, metalness: 0.92 },
  "flat black": { body: "#17181b", accent: "#8b9098", recess: "#101114", roughness: 0.58, metalness: 0.78 },
  frosted: { body: "#c4c8ce", accent: "#eef0f3", recess: "#2a2c30", roughness: 0.52, metalness: 0.72 },
  polished: { body: "#dfe3ea", accent: "#ffffff", recess: "#1a1c20", roughness: 0.12, metalness: 0.96 },
  chrome: { body: "#e7ebf1", accent: "#ffffff", recess: "#1c1e22", roughness: 0.08, metalness: 1 },
  "dark chrome": { body: "#8a9098", accent: "#d5dae2", recess: "#1a1c20", roughness: 0.18, metalness: 0.95 },
  brushed: { body: "#a8adb6", accent: "#d5dae0", recess: "#222428", roughness: 0.4, metalness: 0.88 },
  silver: { body: "#cfd3d9", accent: "#f4f6f8", recess: "#1c1e22", roughness: 0.22, metalness: 0.94 },
  gunmetal: { body: "#5a6168", accent: "#b7bec6", recess: "#1c1e22", roughness: 0.32, metalness: 0.9 },
  "rose gold": { body: "#c49a78", accent: "#f0d0b4", recess: "#2a1c16", roughness: 0.28, metalness: 0.9 },
  gold: { body: "#c9a441", accent: "#f3e0a0", recess: "#2a220e", roughness: 0.26, metalness: 0.92 },
  "chrome gold": { body: "#d4b056", accent: "#ffe9a8", recess: "#2a220e", roughness: 0.14, metalness: 0.96 },
  "yellow gold": { body: "#d4b056", accent: "#ffe9a8", recess: "#2a220e", roughness: 0.22, metalness: 0.92 },
  bronze: { body: "#8a6232", accent: "#d4a45a", recess: "#2a1c0e", roughness: 0.36, metalness: 0.88 },
  "aged bronze": { body: "#6e4e28", accent: "#c49a58", recess: "#24180c", roughness: 0.48, metalness: 0.84 },
  "aged brass": { body: "#8a7438", accent: "#d4c078", recess: "#24180c", roughness: 0.46, metalness: 0.84 },
  brass: { body: "#b08a2e", accent: "#e6c15a", recess: "#2a220e", roughness: 0.32, metalness: 0.9 },
  copper: { body: "#b56a45", accent: "#e8a888", recess: "#2a1610", roughness: 0.34, metalness: 0.9 },
  red: { body: "#6b1c1c", accent: "#d0d4da", recess: "#1a0c0c", roughness: 0.38, metalness: 0.82 },
  crimson: { body: "#5a1218", accent: "#d0d4da", recess: "#16080a", roughness: 0.36, metalness: 0.84 },
  blue: { body: "#1c3a6b", accent: "#c8d4e8", recess: "#0c1522", roughness: 0.36, metalness: 0.84 },
  green: { body: "#1c4a32", accent: "#c8e0d0", recess: "#0c1a12", roughness: 0.36, metalness: 0.84 },
  purple: { body: "#4a2a6b", accent: "#d8cce8", recess: "#160c22", roughness: 0.36, metalness: 0.84 },
  white: { body: "#e8eaee", accent: "#ffffff", recess: "#2a2c30", roughness: 0.3, metalness: 0.8 },
};

const METAL_HINT =
  /black|frosted|polish|chrome|brush|gold|gunmetal|bronze|brass|silver|copper|red|blue|green|white|crimson|matte|glossy|rose|aged|steel|flat/i;

export function metalColorOptions(part) {
  if (!part?.options) return [];
  const opt = part.options.find((o) => {
    const n = (o.name || "").trim().toLowerCase();
    return n === "color" || n === "colour" || n === "finish";
  });
  if (!opt) return [];
  return opt.values.filter(
    (v) => METAL_HINT.test(v) && !/m3|m4|led|nub|plug|random|type-c|usb|round port|screws/i.test(v)
  );
}

export function hasMetalChoices(part) {
  return metalColorOptions(part).length > 1;
}

function lookupPreset(token) {
  const t = token.toLowerCase().replace(/glossy/g, "glossy").trim();
  if (PRESETS[t]) return PRESETS[t];
  if (t.includes("rose gold")) return PRESETS["rose gold"];
  if (t.includes("chrome gold") || t.includes("yellow gold") || t.includes("royal gold")) return PRESETS["chrome gold"];
  if (t.includes("aged bronze")) return PRESETS["aged bronze"];
  if (t.includes("aged brass")) return PRESETS["aged brass"];
  if (t.includes("dark chrome") || t.includes("gunmetal")) return PRESETS.gunmetal;
  if (t.includes("glossy black")) return PRESETS["glossy black"];
  if (t.includes("matte black") || t.includes("flat black")) return PRESETS["matte black"];
  if (t.includes("frosted")) return PRESETS.frosted;
  if (t.includes("polish")) return PRESETS.polished;
  if (t.includes("chrome")) return PRESETS.chrome;
  if (t.includes("brush")) return PRESETS.brushed;
  if (t.includes("black")) return PRESETS.black;
  if (t.includes("gold")) return PRESETS.gold;
  if (t.includes("bronze")) return PRESETS.bronze;
  if (t.includes("brass")) return PRESETS.brass;
  if (t.includes("copper")) return PRESETS.copper;
  if (t.includes("silver")) return PRESETS.silver;
  if (t.includes("red") || t.includes("crimson")) return PRESETS.red;
  if (t.includes("blue")) return PRESETS.blue;
  if (t.includes("green")) return PRESETS.green;
  if (t.includes("purple")) return PRESETS.purple;
  if (t.includes("white")) return PRESETS.white;
  return null;
}

export function resolveFinish(colorName, title = "") {
  const raw = (colorName || "").trim();
  const two = raw.split(/\s+(?:and|&)\s+/i).map((s) => s.trim()).filter(Boolean);
  if (two.length >= 2) {
    const body = lookupPreset(two[0]) || PRESETS.black;
    const accent = lookupPreset(two[1]) || PRESETS.polished;
    return {
      body: body.body,
      accent: accent.body,
      recess: body.recess,
      roughness: Math.min(body.roughness, accent.roughness + 0.08),
      metalness: Math.max(body.metalness, accent.metalness),
      twoTone: true,
    };
  }
  const hit = lookupPreset(raw);
  if (hit) return { ...hit, twoTone: false };
  return { ...PRESETS.frosted, twoTone: false };
}

export function swatchHex(colorName) {
  return resolveFinish(colorName).body;
}

export function thumbUrl(src) {
  if (!src) return "";
  if (src.includes("width=") || src.includes("_300x") || src.includes("_400x")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}width=400`;
}
