"use client";

import { ColorModeContext } from "@/app/providers";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useContext } from "react";

type DataraLogoVariant = "lockup" | "mark" | "responsive";

type DataraLogoProps = {
  alt?: string;
  className?: string;
  sx?: SxProps<Theme>;
  variant?: DataraLogoVariant;
};

const getLogoSrc = (
  mode: "dark" | "light",
  variant: Exclude<DataraLogoVariant, "responsive">
) => {
  const tone = mode === "dark" ? "dark" : "light";
  return variant === "mark"
    ? `/datara-mark-${tone}.svg`
    : `/datara-logo-${tone}.svg`;
};

export default function DataraLogo({
  alt = "Datara Revenue Analytics",
  className,
  sx,
  variant = "lockup",
}: DataraLogoProps) {
  const { resolvedMode } = useContext(ColorModeContext);
  const lockupSrc = getLogoSrc(resolvedMode, "lockup");
  const markSrc = getLogoSrc(resolvedMode, "mark");

  if (variant === "responsive") {
    return (
      <Box component="picture" sx={{ display: "block", flex: "0 0 auto" }}>
        <source media="(max-width: 599.95px)" srcSet={markSrc} />
        <Box
          alt={alt}
          className={className}
          component="img"
          decoding="async"
          draggable={false}
          src={lockupSrc}
          sx={{
            display: "block",
            height: 40,
            width: "auto",
            ...sx,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      alt={alt}
      className={className}
      component="img"
      decoding="async"
      draggable={false}
      src={variant === "mark" ? markSrc : lockupSrc}
      sx={{
        display: "block",
        flex: "0 0 auto",
        height: variant === "mark" ? 34 : 40,
        width: "auto",
        ...sx,
      }}
    />
  );
}
