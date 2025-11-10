import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Tailwind v3 不需要另外掛 PostCSS plugin
export default defineConfig({
  plugins: [react()],
});
