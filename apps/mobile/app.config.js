const IS_DEV = process.env.APP_VARIANT === "development";

/** Store package — shared by preview (Play Internal) and production (live). */
const STORE_PACKAGE = "com.pratik4230.xaply";

/**
 * Dynamic Expo config.
 * - development → separate package so it can sit beside the store app
 * - preview + production → same package (Play Internal vs Production tracks)
 * @see https://docs.expo.dev/build-reference/variants/
 */
export default ({ config }) => ({
  ...config,
  name: IS_DEV ? "Xaply (Dev)" : "Xaply",
  android: {
    ...config.android,
    package: IS_DEV ? `${STORE_PACKAGE}.dev` : STORE_PACKAGE,
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
