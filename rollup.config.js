import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === "production";

const createConfig = format => {
  const name = "vorarbeiter";
  let formatSuffix = { es: "esm", umd: "umd", cjs: "cjs" }[format];

  const config = {
    input: "es/index.js",
    output: {
      file: isProduction ? `dist/${name}.${formatSuffix}.min.js` : `dist/${name}.${formatSuffix}.js`,
      format,
      name,
      sourcemap: true
    },
    plugins: [
      isProduction && terser(),
    ]
  };

  if (format === "cjs") {
    config.output.exports = "named";
  }

  return config;
};

export default [
  createConfig("cjs"),
  createConfig("es"),
  createConfig("umd"),
];
