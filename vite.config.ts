import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import Unfonts from "unplugin-fonts/vite";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    Unfonts({
      custom: {
        families: [
          {
            name: "Geist",
            src: "./src/fonts/Geist/*.ttf",
          },
          {
            name: "GeistMono",
            src: "./src/fonts/GeistMono/*.ttf",
          },
        ],
      },
    }),
  ],
  define: {
    "process.env.VITE_PROJECT_URL": JSON.stringify(
      process.env.VITE_PROJECT_URL
    ),
    "process.env.VITE_ROBOFLOW_PRIVATE_KEY": JSON.stringify(
      process.env.VITE_ROBOFLOW_PRIVATE_KEY
    ),
  },
});
