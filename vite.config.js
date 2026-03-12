import { defineConfig } from "vite";
import anywidget from "@anywidget/vite";

export default defineConfig({
  build: {
    outDir: "speckle_widgets/static",
    emptyOutDir: true,
    lib: {
      entry: { auth: "src/auth.js", viewer: "src/viewer.js" },
      formats: ["es"],
    },
  },
  plugins: [anywidget()],
});
