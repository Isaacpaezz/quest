import { redirect } from 'next/navigation'

export default function HomePage() {
  // La página raíz de todo el sitio simplemente redirige al dashboard principal.
  redirect('/sustento-diario')
}
