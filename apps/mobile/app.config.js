const IS_DEV = process.env.APP_VARIANT === "development";

/** Android application id — same for development and store builds for now. */
const STORE_PACKAGE = "com.pratik4230.xaply";

/**
 * Dynamic Expo config.
 * - development → display name "Xaply (Dev)" only (same package as store)
 * - preview + production → "Xaply"
 * @see https://docs.expo.dev/build-reference/variants/
 */
export default ({ config }) => ({
  ...config,
  name: IS_DEV ? "Xaply (Dev)" : "Xaply",
  android: {
    ...config.android,
    package: STORE_PACKAGE,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-dev-client",
      {
        // Prefer Expo CLI / QR to open the dev client when developing.
        addGeneratedScheme: IS_DEV,
      },
    ],
  ],
});
