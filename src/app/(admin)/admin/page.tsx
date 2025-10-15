/**
 * Página principal del Panel de Administración.
 * Da la bienvenida al administrador y sirve como punto de entrada a las
 * diferentes funcionalidades de gestión.
 */
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Panel de Control de Administrador</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido. Desde aquí puedes gestionar los planes de lectura, usuarios y la configuración de la aplicación.
      </p>
    </div>
  )
}
