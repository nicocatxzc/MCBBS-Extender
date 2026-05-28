import url from "@rollup/plugin-url";
import { readFileSync } from "fs";

const metadata = readFileSync("src/meta.js", "utf-8");

export default {
    input: "src/index.js",
    output: {
        file: "dist/mcbbs-extender.user.js",
        format: "iife",
        compact: false,
        indent: true,
        freeze: false,
        banner: metadata,
    },
    plugins: [
        url({
            include: ["**/*.png", "**/*.jpg", "**/*.gif", "**/*.svg"],
            limit: Infinity,
            publicPath: "",
            emitFiles: false,
        }),
    ],
};
