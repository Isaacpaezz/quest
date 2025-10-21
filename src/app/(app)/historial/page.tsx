import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from './_components/history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: planes } = await supabase
    .from('planes_lectura')
    .select('*')
    .eq('estado', 'completado')
    .order('fecha_fin', { ascending: false })

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Historial</h1>
        <p className="text-muted-foreground">Un registro de los libros que hemos estudiado.</p>
      </header>
      <HistoryClient planes={planes || []} />
    </div>
  )
}
