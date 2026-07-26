const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

/**
 * Expo SDK 52+ auto-configures Metro for pnpm monorepos via getDefaultConfig.
 * Do not add manual watchFolders / nodeModulesPaths unless something breaks.
 * Uniwind: cssEntryFile is under src/ — add @source in global.css only when
 * scanning packages outside that tree (see https://docs.uniwind.dev/monorepos.md).
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});

module.exports = uniwindConfig;
