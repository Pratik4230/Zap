"use client";

import { useCallback, useRef } from "react";
import { Copy, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildShortUrl, qrDownloadFilename } from "@/lib/short-url";
import { toast } from "sonner";

const QR_SIZE = 256;
const QR_DOWNLOAD_SIZE = 512;

interface LinkQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  slug: string;
  title?: string | null;
}

export function LinkQrDialog({
  open,
  onOpenChange,
  domain,
  slug,
  title,
}: LinkQrDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shortUrl = buildShortUrl(domain, slug);

  const copyUrl = useCallback(() => {
    void navigator.clipboard.writeText(shortUrl);
    toast.success("Short URL copied");
  }, [shortUrl]);

  const downloadPng = useCallback(() => {
    const source = canvasRef.current;
    if (!source) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = QR_DOWNLOAD_SIZE;
    exportCanvas.height = QR_DOWNLOAD_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, QR_DOWNLOAD_SIZE, QR_DOWNLOAD_SIZE);
    ctx.drawImage(source, 0, 0, QR_DOWNLOAD_SIZE, QR_DOWNLOAD_SIZE);

    const url = exportCanvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = qrDownloadFilename(slug);
    anchor.click();
    toast.success("QR code downloaded");
  }, [slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR code</DialogTitle>
          <DialogDescription>
            {title ? (
              <>
                Scan to open <span className="font-medium text-foreground">{title}</span>
              </>
            ) : (
              "Scan to open this short link"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <QRCodeCanvas
              ref={canvasRef}
              value={shortUrl}
              size={QR_SIZE}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#000000"
              title={`QR code for ${shortUrl}`}
            />
          </div>
          <p className="max-w-full truncate text-center font-mono text-xs text-muted-foreground">
            {shortUrl}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={copyUrl}>
            <Copy size={14} />
            Copy URL
          </Button>
          <Button type="button" className="gap-2" onClick={downloadPng}>
            <Download size={14} />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
