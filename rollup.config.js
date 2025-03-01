import buble from "rollup-plugin-buble";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";
import resolve from "rollup-plugin-node-resolve";
import { uglify } from "rollup-plugin-uglify";

const banner =
`/*!
 * Ahoy.js
 * ${pkg.description}
 * ${pkg.repository.url}
 * v${pkg.version}
 * ${pkg.license} License
 */
`;

const minBanner = `/*! Ahoy.js v${pkg.version} | ${pkg.license} License */`;

const input = "src/index.js";
const outputName = "ahoy";

export default [
  {
    input: input,
    output: {
      name: outputName,
      file: pkg.main,
      format: "umd",
      banner: banner
    },
    plugins: [
      resolve(),
      commonjs(),
      buble()
    ]
  },
  {
    input: input,
    output: {
      name: outputName,
      file: "dist/ahoy.min.js",
      format: "umd",
      banner: minBanner
    },
    plugins: [
      resolve(),
      commonjs(),
      buble(),
      uglify({
        output: {
          comments: /^!/
        }
      })
    ]
  },
  {
    input: input,
    output: {
      file: pkg.module,
      format: "es",
      banner: banner
    },
    plugins: [
      buble()
    ]
  }
];
