import products from "../products.json";

export const CATEGORIES = [
  { id: "blade", label: "Blade", hint: "Where the plasma lives", single: true },
  { id: "emitter", label: "Emitter", hint: "Top of the hilt", single: true },
  { id: "switch", label: "Switch", hint: "Controls & charge port", single: true },
  { id: "grip", label: "Grip", hint: "The handle", single: true },
  { id: "pommel", label: "Pommel", hint: "End cap", single: true },
  { id: "vhc", label: "Specialty VHC", hint: "Extensions, chokes, couplers", single: false },
  { id: "accessory", label: "Add-ons", hint: "Tsubas, shrouds, clips", single: false },
  { id: "electronics", label: "Electronics", hint: "Sound & color core", single: true },
];

export const SLOT_ORDER = [
  "blade",
  "emitter",
  "vhc",
  "switch",
  "grip",
  "pommel",
  "accessory",
  "electronics",
];

export function getProducts(category) {
  return [...(products[category] || [])].sort(
    (a, b) => Number(b.available) - Number(a.available) || a.title.localeCompare(b.title)
  );
}

export function formatPrice(n) {
  return `$${Number(n).toFixed(2)}`;
}

export function isDoubleConnectorPommel(part) {
  if (!part) return false;
  const t = `${part.id} ${part.title}`.toLowerCase();
  return t.includes("double connector") || t.includes("double-connector");
}

export function classifyAccessory(title) {
  const t = title.toLowerCase();
  if (t.includes("tsuba") || t.includes("bunny")) return "tsuba";
  if (t.includes("shroud") || t.includes("sleeve")) return "shroud";
  if (t.includes("clip") || t.includes("covertec") || t.includes("d-ring") || t.includes("wheel")) return "clip";
  if (t.includes("choke")) return "choke";
  if (t.includes("coupler") || t.includes("adapter") || t.includes("extension")) return "coupler";
  if (t.includes("chamber")) return "chamber";
  return "ring";
}

export function metalFinish(title) {
  const t = title.toLowerCase();
  if (/(phoenix|gold|brass|crown|oracle)/.test(t)) {
    return { body: "#b08a2e", accent: "#e6c15a", roughness: 0.32 };
  }
  if (/(void|dark|menace|apoc|fallen|inquisitor|executioner)/.test(t)) {
    return { body: "#1c1d20", accent: "#6d7178", roughness: 0.42 };
  }
  if (/(guardian|sentinel|rook|bishop|padawan)/.test(t)) {
    return { body: "#8c9198", accent: "#d5d8de", roughness: 0.28 };
  }
  if (/(cyborg|helix|infiltrator)/.test(t)) {
    return { body: "#4a5158", accent: "#9aa3ad", roughness: 0.22 };
  }
  return { body: "#9aa0a8", accent: "#dfe3ea", roughness: 0.3 };
}
