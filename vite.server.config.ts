import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@shared": path.resolve(__dirname, "shared"),
            "@": path.resolve(__dirname, "src/client/src"),
            // 필요에 따라 더 추가
        },
    },
    build: {
        ssr: true,
        target: "node20",
        outDir: path.resolve(__dirname, "dist/server"),
        rollupOptions: {
            input: path.resolve(__dirname, "server/index.ts"),
            output: {
                format: "esm",
            },
        },
    },
});