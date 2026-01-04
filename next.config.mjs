/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar Turbopack para evitar conflictos
  experimental: {
    turbo: false
  },
  // Configuración de PWA
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  },
  // Configuración de imágenes
  images: {
    domains: ['localhost'], // Añade aquí los dominios de tus imágenes
  },
  // Configuración de redirecciones si es necesario
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sustento-diario',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
