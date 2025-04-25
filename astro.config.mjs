// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import solidJs from "@astrojs/solid-js";
import node from '@astrojs/node';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    integrations: [
        react({
            include: ["**/react/*"],
        }),
        solidJs({
            include: ["**/solid/*", "**/node_modules/@suid/material/**"],
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
    output: 'server',
    adapter: node({
      mode: "standalone",
    }),
});