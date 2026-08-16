const IS_DEV = process.env.APP_VARIANT === "development";

/** Android application id — same for development and store builds for now. */
const STORE_PACKAGE = "com.pratik4230.xaply";

const APP_LINK_HOST = "xaply.in";

/**
 * Dynamic Expo config.
 * - development → display name "Xaply (Dev)" only (same package as store)
 * - preview + production → "Xaply"
 * @see https://docs.expo.dev/build-reference/variants/
 * @see https://docs.expo.dev/linking/android-app-links/
 */
export default ({ config }) => {
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (plugin === "expo-router") {
      return [
        "expo-router",
        {
          // Used by Android App Links / Expo Router path resolution.
          origin: `https://${APP_LINK_HOST}`,
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    name: IS_DEV ? "Xaply (Dev)" : "Xaply",
    android: {
      ...config.android,
      package: STORE_PACKAGE,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          category: ["BROWSABLE", "DEFAULT"],
          data: [
            {
              scheme: "https",
              host: APP_LINK_HOST,
              pathPrefix: "/links",
            },
            {
              scheme: "https",
              host: APP_LINK_HOST,
              pathPrefix: "/dashboard/links",
            },
            {
              scheme: "https",
              host: APP_LINK_HOST,
              pathPrefix: "/invite",
            },
          ],
        },
      ],
    },
    plugins: [
      ...plugins,
      [
        "expo-dev-client",
        {
          // Prefer Expo CLI / QR to open the dev client when developing.
          addGeneratedScheme: IS_DEV,
        },
      ],
    ],
  };
};
