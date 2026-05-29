import { ChevronLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/perfil" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Acerca de Quest</h1>
      </div>

      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 shadow-xl">
          <span className="font-display text-5xl font-bold text-white">Q</span>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-slate-900">Tu compañero espiritual diario</h2>
          <p className="leading-relaxed text-slate-600">
            Quest nace con el propósito de ayudarte a construir hábitos espirituales sólidos. 
            A través de la lectura bíblica constante y la oración intencional, buscamos que cada día 
            sea una oportunidad para acercarte más a Dios y crecer en tu fe.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 p-4 text-indigo-700">
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">Versión 1.0.0 (Beta)</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Diseñado y desarrollado con ❤️ por Isaac Paez
        </p>
      </div>
    </div>
  )
}
