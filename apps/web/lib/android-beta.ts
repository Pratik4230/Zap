/**
 * Closed-beta Android distribution.
 *
 * Host the APK on Google Drive (Anyone with the link → Viewer), then paste
 * that share URL into `apkUrl`. Prefer the uc?export=download form when possible.
 *
 * Drive share link → direct-ish download:
 *   https://drive.google.com/uc?export=download&id=FILE_ID
 * (FILE_ID from the share URL: .../file/d/FILE_ID/view?...)
 *
 * Large files may still show a Drive confirm page — if BillDesk rejects that,
 * use the normal “anyone with the link” view URL on this page instead.
 */
export const androidBeta = {
  packageName: "com.pratik4230.xaply",
  /** Keep in sync with apps/mobile version */
  versionName: "1.0.0",
  versionCode: 1,
  /**
   * Public Google Drive link to the latest APK (folder or file share).
   * Prefer a single-file share / uc?export=download when BillDesk wants a direct APK URL.
   */
  apkUrl:
    "https://drive.google.com/drive/folders/15k1oYR2e7Ysl8bXuYLXCqdHyZmzAp6zM?usp=sharing",
  lastUpdated: "2026-08-02",
  statusLabel: "Closed beta",
  pagePath: "/android",
  hostLabel: "Google Drive",
} as const;

export type AndroidBetaConfig = typeof androidBeta;
