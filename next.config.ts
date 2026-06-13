import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz correcta del proyecto para evitar problemas con múltiples lockfiles
  outputFileTracingRoot: path.resolve(__dirname),
  // Next.js 16 usa Turbopack por defecto; config vacía para silenciar el error
  // cuando el plugin PWA inyecta configuración webpack
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // @ts-expect-error: la opción skipWaiting está soportada por el plugin aunque no aparezca en sus tipos
  skipWaiting: true,
  // Intentar extender el SW generado por defecto e inyectar script extra con listeners push
  extendDefaultSW: true,
  workbox: {
    importScripts: ["/sw-extra.js"],
  },
  // Nota: si extendDefaultSW no funciona en tu versión, podemos volver a injectManifest con swSrc
  // swSrc: "src/app/sw.js",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
});

export default withPWA(nextConfig);
