import { redirect } from 'next/navigation'

/**
 * La página raíz de la aplicación.
 * Redirige a la página de sustento diario.
 */
export default function HomePage() {
  redirect('/sustento-diario')
}
