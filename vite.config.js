import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { shopApiPlugin } from "./server/shopApi.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), shopApiPlugin()],
});
