import { CSSProperties } from "react";

const BASE = "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/";

export const THINGS = {
  rocket: "image-CCwIWAzE77jGrCqKZB8s5kfubGGoqy.png",
  bulb: "image-1ORQgJEOeHL8zTZtZJnfhRlNAu9Urh.png",
  cathedral: "image-DEBPYh2E6ZC6owRm8hyZ0wvVFJ4vEs.png",
  tree: "image-yLBbZMvacxsSxiNPlvXmLCiHRwgjc9.png",
  worldMap: "image-fQQRud9uyB4mWTDTqu4YvunjZF3ZVx.png",
  padlock: "image-HbfVfsPVsFP2yVgGkNF9SUo9WXLa1I.png",
  brain: "image-6ZyHbxSkOIe4hBm2pcJxRzhwk68edM.png",
  calendar: "image-yPVgnIzgk5q19ZtOnxrli2CrcolmcO.png",
  badge: "image-NKDgSxFTa3J8LnH6iY5yGDgnc7Apgo.png",
  gold: "image-GaeeyujXCwpbx3Z639X5wAfRqvYnSz.png",
  door: "image-Imt1xx7HkFQXVJocDUjphAUTTuogRL.png",
  datacenter: "image-5NGxkUl4LFyWKE10B6RYV6nJnIRFGE.png",
  robot: "image-eMES7lZvD4yVd3wtbx6Wu6jnLmoxPI.png",
  satisfaction: "image-WDNsn3DTzFneLnGcqyJUVyaqr8bsNO.png",
  trail: "image-VGzUjX8kyA837J4Dvm7j9Pa9gMeCxT.png",
  dartboard: "image-tUh2KFWP2S4uuLyPXmyqWKtCrJUOsq.png",
  sunrise: "image-8kBFobjnuIVlXmgFVbJxywAesNVKFV.png",
  hand: "image-1cqPquuIF4oCoAaoeYvMKTvMpu6U9k.png",
  pencilCup: "image-dxqCuojtmDbubsEE37S0uvHBtLXOgC.png",
} as const;

export type ThingName = keyof typeof THINGS;

type Anim = "float" | "wobble" | "spin" | "drift" | "none";

interface ThingIconProps {
  name: ThingName;
  size?: number;
  anim?: Anim;
  delay?: number;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function ThingIcon({
  name,
  size = 80,
  anim = "float",
  delay = 0,
  rotate = 0,
  className = "",
  style,
  alt,
}: ThingIconProps) {
  const animClass =
    anim === "float" ? "thing-float"
    : anim === "wobble" ? "thing-wobble"
    : anim === "spin" ? "thing-spin-slow"
    : anim === "drift" ? "thing-drift"
    : "";

  return (
    <img
      src={`${BASE}${THINGS[name]}`}
      alt={alt || name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`select-none pointer-events-none transition-opacity duration-500 ${animClass} thing-hover ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}ms`,
        ['--tr' as any]: `${rotate}deg`,
        ...style,
      }}
      draggable={false}
    />
  );
}
