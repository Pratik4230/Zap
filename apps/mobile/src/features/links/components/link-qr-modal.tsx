import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { EncodingType, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  buildShortUrl,
  qrDownloadFilename,
} from "@/features/links/utils/format";
import { colors } from "@/global/theme";
import { BoltSpinner } from "@/global/components/bolt-skeleton";

const QR_SIZE = 220;

type LinkQrModalProps = {
  visible: boolean;
  domain: string;
  slug: string;
  title?: string | null;
  onClose: () => void;
};

type QrSvgRef = {
  toDataURL: (callback: (data: string) => void) => void;
};

/**
 * Per-link QR overlay (RN Modal — SVG can’t live inside Compose Host).
 */
export function LinkQrModal({
  visible,
  domain,
  slug,
  title,
  onClose,
}: LinkQrModalProps) {
  const qrRef = useRef<QrSvgRef | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const shortUrl = buildShortUrl(domain, slug);

  async function copyUrl() {
    await Clipboard.setStringAsync(shortUrl);
    setStatus("Short URL copied");
  }

  async function sharePng() {
    const svg = qrRef.current;
    if (!svg) {
      setStatus("QR not ready yet");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        try {
          svg.toDataURL((data) => resolve(data));
        } catch (error) {
          reject(error);
        }
      });

      const file = new File(Paths.cache, qrDownloadFilename(slug));
      file.create({ intermediates: true, overwrite: true });
      file.write(base64.replace(/(\r\n|\n|\r)/gm, ""), {
        encoding: EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "image/png",
          dialogTitle: "Share QR code",
          UTI: "public.png",
        });
      } else {
        setStatus("Sharing isn’t available on this device");
      }
    } catch {
      setStatus("Couldn’t share QR image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            gap: 16,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              QR code
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {title?.trim()
                ? `Scan to open ${title.trim()}`
                : "Scan to open this short link"}
            </Text>
          </View>

          <View style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <QRCode
                value={shortUrl}
                size={QR_SIZE}
                backgroundColor="#ffffff"
                color="#000000"
                ecl="M"
                getRef={(ref) => {
                  qrRef.current = ref;
                }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: colors.muted,
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {shortUrl}
            </Text>
          </View>

          {status ? (
            <Text style={{ color: colors.primary, fontSize: 13 }}>{status}</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => void copyUrl()}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                Copy URL
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void sharePng()}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? (
                <BoltSpinner size={18} />
              ) : (
                <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>
                  Share PNG
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={{ alignItems: "center", paddingVertical: 4 }}>
            <Text style={{ color: colors.muted, fontWeight: "600" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
