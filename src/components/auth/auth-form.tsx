"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'

export default function AuthForm() {
  const [isNewUser, setIsNewUser] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_usuario: username,
        },
      },
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleSignIn = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isNewUser) {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }

  return (
    <div className="w-full bg-transparent">
  <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
        {/* Username */}
        {isNewUser && (
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre en la comunidad"
              required
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-300 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@ejemplo.com"
            required
            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-300 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete={isNewUser ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-300 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* CTA */}
        <button
          type="submit"
          className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isNewUser ? 'Registrarse' : 'Ingresar'}
          <ArrowRight className="h-4 w-4" />
        </button>

        {error && <p className="text-center text-sm text-rose-600">{error}</p>}

        <div className="text-center text-sm">
          {isNewUser ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
          <button
            type="button"
            onClick={() => setIsNewUser(!isNewUser)}
            className="font-semibold text-indigo-600 hover:underline"
          >
            {isNewUser ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </div>
      </form>
    </div>
  )
}
