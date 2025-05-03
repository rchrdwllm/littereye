import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import Unfonts from "unplugin-fonts/vite";

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
});
