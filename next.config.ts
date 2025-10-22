import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Deshabilitar PWA en desarrollo para evitar problemas de cache
  register: true,
});

export default withPWA(nextConfig);
