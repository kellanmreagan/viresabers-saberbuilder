import React from "react";
import { createRoot } from "react-dom/client";
import { useGLTF } from "@react-three/drei";
import App from "./App.jsx";
import { GHOST_MODELS, REAL_MODELS } from "./lib/realModels.js";
import "./styles.css";

for (const id of Object.values(GHOST_MODELS)) {
  const url = REAL_MODELS[id]?.url;
  if (url) useGLTF.preload(url);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

queueMicrotask(() => {
  Object.values(REAL_MODELS).forEach((spec) => useGLTF.preload(spec.url));
});
