import DashboardPage from './(app)/page'

/**
 * La página raíz de la aplicación.
 * Simplemente renderiza el componente del Dashboard principal,
 * cuya lógica y protección ya están definidas en (app)/page.tsx y (app)/layout.tsx.
 */
export default function HomePage() {
  return <DashboardPage />;
}
