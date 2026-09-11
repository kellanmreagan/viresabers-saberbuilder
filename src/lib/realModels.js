// Fang grip male-thread radius in model units, with the grip body at 1.5" OD.
const FANG_GRIP_BODY_R = 0.294296;
const FANG_GRIP_THREAD_R = 0.258;
export const STANDARD_THREAD_RADIUS = (FANG_GRIP_THREAD_R * 0.75) / FANG_GRIP_BODY_R;
export const PLACEHOLDER_MALE = 0.12;

export const REAL_MODELS = {
  "fang-emitter": {
    url: "/models/fang-emitter/model.glb",
    modelHeight: 1,
    // Female opening at ymin — mating thread, not the body flare.
    threadRadius: 0.15,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black and Polished",
    doubleSide: true,
  },
  "mantis-emitter": {
    url: "/models/mantis-emitter/model.glb",
    modelHeight: 1,
    threadRadius: 0.194,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Default Title",
    doubleSide: true,
  },
  "slicer-emitter": {
    url: "/models/slicer-emitter/model.glb",
    modelHeight: 1,
    threadRadius: 0.14,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black and Polished",
    doubleSide: true,
  },
  "fang-grip": {
    url: "/models/fang-grip/model.glb",
    modelHeight: 1.90337,
    threadRadius: FANG_GRIP_THREAD_R,
    threadBottom: 0.12,
    threadTop: 0.19,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Rose Gold and Polished",
    doubleSide: true,
  },
  "sentinel-handle": {
    url: "/models/sentinel-grip/model.glb",
    modelHeight: 1,
    threadRadius: 0.116,
    threadBottom: 0.04,
    threadTop: 0.05,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black and Polished",
    doubleSide: true,
  },
  "padawan-grip": {
    url: "/models/padawan-grip/model.glb",
    modelHeight: 1,
    threadRadius: 0.122,
    threadBottom: 0.05,
    threadTop: 0.08,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Frosted",
    solidRecolor: true,
    doubleSide: true,
  },
  "throttle-grip": {
    url: "/models/throttle-grip/model.glb",
    modelHeight: 1,
    threadRadius: 0.122,
    threadBottom: 0.1,
    threadTop: 0.12,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black",
    solidRecolor: true,
    doubleSide: true,
  },
  "kam-pommel": {
    url: "/models/kam-pommel/model.glb",
    modelHeight: 1.749632,
    // Female inner at the grip-facing end, not the outer flare.
    threadRadius: 0.78,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Frosted and Polished",
    doubleSide: true,
  },
  "sentinel-pommel": {
    url: "/models/sentinel-pommel/model.glb",
    modelHeight: 1,
    // Female opening at ymax toward the grip.
    threadRadius: 0.395,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Frosted",
    doubleSide: true,
  },
  "d-guardian-double-connector-pommel": {
    url: "/models/guardian-double-connector/model.glb",
    modelHeight: 0.870047,
    // Inner bore of the F-F ring, not the outer flare.
    threadRadius: 0.804,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Chrome",
    doubleSide: true,
  },
  "rook-pommel": {
    url: "/models/rook-pommel/model.glb",
    modelHeight: 1.089533,
    // Thin-walled locknut: cylinder radius is the female thread size.
    threadRadius: 0.63,
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black",
    doubleSide: true,
  },
  "a-emitter-guardian-black": {
    url: "/models/guardian-emitter/model.glb",
    modelHeight: 1,
    // Female opening at ymin — mating thread, not the body flare.
    threadRadius: 0.156,
    // Rim sits on the part below; switch male goes inside the bore.
    threadBottom: 0,
    threadTop: 0,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Frosted",
    doubleSide: true,
  },
  "rook-switch-usb-c": {
    url: "/models/rook-switch/model.glb",
    modelHeight: 1,
    // Female/thread at ymin, not the body flare.
    threadRadius: 0.232,
    threadBottom: 0,
    // Male stub at the top; first unthreaded collar is the contact plane.
    threadTop: 0.07,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Frosted",
    doubleSide: true,
  },
  "type-c-sentinel-2-0-switch": {
    url: "/models/sentinel-switch/model.glb",
    modelHeight: 1,
    // Male thread OD, not the body/flare.
    threadRadius: 0.229,
    // Female opening is at ymin — sit the rim on the part below so only
    // that part's male threads go inside. Do not sink the housing over the body.
    threadBottom: 0,
    // Top male: first unthreaded collar is the contact plane for the next part.
    threadTop: 0.07,
    rotation: [0, 0, 0],
    keepMap: true,
    bakedColor: "Black and Polished",
    doubleSide: true,
  },
};

export const GHOST_MODELS = {
  pommel: "rook-pommel",
  grip: "throttle-grip",
  switch: "rook-switch-usb-c",
  emitter: "a-emitter-guardian-black",
};

const ASSET_BASE = import.meta.env.BASE_URL || "/";
for (const spec of Object.values(REAL_MODELS)) {
  spec.url = `${ASSET_BASE}${String(spec.url).replace(/^\//, "")}`;
}

export function realModel(part) {
  return part?.id ? REAL_MODELS[part.id] : null;
}

export function partFit(part, slot) {
  const spec = realModel(part) || (part ? null : REAL_MODELS[GHOST_MODELS[slot]]);
  if (spec) {
    const scale = spec.scale != null
      ? spec.scale
      : STANDARD_THREAD_RADIUS / spec.threadRadius;
    const height = spec.modelHeight * scale;
    const threadBottom = (spec.threadBottom || 0) * scale;
    const threadTop = (spec.threadTop || 0) * scale;
    return {
      spec,
      scale,
      height,
      threadBottom,
      threadTop,
      stackHeight: Math.max(0.05, height - threadBottom - threadTop),
      radius: STANDARD_THREAD_RADIUS,
    };
  }

  const height = placeholderHeight(part, slot);
  const hasMale =
    slot !== "blade" &&
    slot !== "electronics" &&
    slot !== "pommel" &&
    slot !== "accessory";
  const threadBottom = hasMale ? PLACEHOLDER_MALE : 0;
  return {
    spec: null,
    scale: 1,
    height,
    threadBottom,
    threadTop: 0,
    stackHeight: Math.max(0.05, height - threadBottom),
    radius: 0.75,
  };
}

function placeholderHeight(part, slot) {
  if (!part) {
    if (slot === "blade") return 0;
    if (slot === "grip") return 2.8;
    if (slot === "switch") return 1.55;
    if (slot === "emitter") return 1.7;
    if (slot === "pommel") return 0.9;
    return 0.45;
  }
  const t = part.title.toLowerCase();
  if (slot === "blade") {
    if (t.includes("5\"") || t.includes("cross blade")) return 5;
    if (t.includes("36")) return 36;
    if (t.includes("32")) return 32;
    if (t.includes("28")) return 28;
    if (t.includes("whip") || t.includes("noodle")) return 40;
    if (t.includes("katana")) return 36;
    if (t.includes("heavy")) return 36;
    return 28;
  }
  if (slot === "emitter") {
    if (t.includes("combo") || t.includes("switch")) return 2.5;
    if (t.includes("thin neck")) return 2.15;
    if (t.includes("phoenix") || t.includes("helix") || t.includes("slicer")) return 2.15;
    return 1.55;
  }
  if (slot === "switch") {
    if (t.includes("combo") || t.includes("grip")) return 2.6;
    return 1.45;
  }
  if (slot === "grip") return 2.9;
  if (slot === "pommel") {
    if (t.includes("disk") || t.includes("disc")) return 0.38;
    return 0.85;
  }
  if (slot === "electronics") return 0;
  return 0.5;
}
