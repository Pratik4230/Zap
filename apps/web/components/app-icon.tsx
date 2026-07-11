import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 32, className }: AppIconProps) {
  return (
    <Image
      src={siteConfig.appIcon}
      alt={siteConfig.name}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
