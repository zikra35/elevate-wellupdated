import { cn } from "@/lib/utils";

export type AvatarConfig = {
  bodyType?: string;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
  top?: string;
  bottom?: string;
  aesthetic?: string;
  gender?: "female" | "male" | "other" | string;
};

// DiceBear Avataaars API - Free, gender-aware bitmoji-style avatars
export function buildAvatarUrl(seed: string, config: AvatarConfig = {}) {
  const params = new URLSearchParams({
    seed: seed || "elevate",
    // Gender-specific clothing and accessories
    ...(config.gender === "female" ? {
      clotheType: "graphicShirt",
      eyebrowType: "default",
      mouthType: "default",
    } : config.gender === "male" ? {
      clotheType: "blazerAndShirt",
      eyebrowType: "default",
      mouthType: "default",
    } : {}),
  });

  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

export function UserAvatar({
  seed,
  config,
  size = 40,
  className,
}: {
  seed: string;
  config?: AvatarConfig;
  size?: number;
  className?: string;
}) {
  const url = buildAvatarUrl(seed, config);
  return (
    <img
      src={url}
      alt="Avatar"
      width={size}
      height={size}
      className={cn(
        "rounded-2xl bg-primary-soft ring-2 ring-primary/20 object-contain p-1",
        className,
      )}
    />
  );
}

