import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: {
      "/figma-api": {
        target: "https://api.figma.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/figma-api/, ""),
      },
    },
  },
});
