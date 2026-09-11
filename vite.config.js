import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/viresabers-saberbuilder/",
  plugins: [react()],
  server: {
    host: true,
    port: 5177,
  },
});
