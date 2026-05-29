import { ChevronLeft, MessageCircle, Instagram } from 'lucide-react'
import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/perfil" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Ayuda y Soporte</h1>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          ¿Tienes alguna duda o problema? Contacta directamente con Isaac.
        </p>

        <a 
          href="https://wa.me/584245852916" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">WhatsApp</h3>
              <p className="text-sm text-slate-500">+58 424-5852916</p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 rotate-180 text-slate-300" />
        </a>

        <a 
          href="https://instagram.com/isaacpaezz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Instagram className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Instagram</h3>
              <p className="text-sm text-slate-500">@isaacpaezz</p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 rotate-180 text-slate-300" />
        </a>
      </div>
    </div>
  )
}
