import AuthForm from '@/components/auth/auth-form'
import { Metadata } from 'next'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Quest',
  description: 'Inicia sesión o regístrate para comenzar tu senda espiritual diaria',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50/40 to-white p-6">
      <div className="absolute inset-0 -z-10 bg-[url('/grid-light.svg')] bg-center opacity-5"></div>

  <main className="w-full max-w-md sm:max-w-lg md:max-w-xl px-4 py-8">
        {/* Logo */}
        <div className="mb-6">
          <div className="size-16 w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center relative shadow-xl shadow-slate-900/20 mb-4 mx-auto">
            <span className="font-display text-4xl font-bold text-white">Q</span>
            <Sparkles className="absolute -top-2 -right-2 text-amber-400 h-5 w-5" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 text-center mb-2">Bienvenido a Quest</h1>
          <p className="text-slate-500 text-center mb-10">Tu comunidad de crecimiento espiritual.</p>
        </div>

        <AuthForm />

        <footer className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Quest · Términos y privacidad
        </footer>
      </main>
    </div>
  )
}