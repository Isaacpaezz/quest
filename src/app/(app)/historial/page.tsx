import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from './_components/history-client'
import { Trophy } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: planes } = await supabase
    .from('planes_lectura')
    .select('*')
    .eq('estado', 'completado')
    .order('fecha_fin', { ascending: false })

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Trophy className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Historial de Lectura</h1>
        </div>
        <p className="text-slate-500">Un registro de los libros que hemos estudiado juntos como comunidad.</p>
      </header>
      
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <HistoryClient planes={planes || []} />
      </div>
    </div>
  )
}
