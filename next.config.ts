import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz correcta del proyecto para evitar problemas con múltiples lockfiles
  outputFileTracingRoot: path.resolve(__dirname),
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // @ts-expect-error: la opción skipWaiting está soportada por el plugin aunque no aparezca en sus tipos
  skipWaiting: true,
  swSrc: "src/app/sw.ts", // usar nuestro Service Worker en TS
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

export default withPWA(nextConfig);
