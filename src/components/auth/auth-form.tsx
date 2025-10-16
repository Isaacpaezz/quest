'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
        // Pasamos los metadatos aquí para que el trigger los pueda usar
        data: {
          nombre_usuario: username,
        },
      },
    })
    if (error) {
      setError(error.message)
    } else {
      // Supabase envía un correo de confirmación. Informamos al usuario.
      // Podríamos redirigir o mostrar un mensaje. Por ahora, redirigimos.
      // En un futuro, aquí irá un mensaje de "Verifica tu email".
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
    <div className="w-full p-8 space-y-6 bg-card rounded-3xl shadow-lg backdrop-blur-2xl border border-border/40">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {isNewUser ? 'Crea tu Cuenta' : 'Bienvenido a Quest'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isNewUser ? 'Únete a la misión.' : 'Inicia sesión para continuar tu senda.'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewUser && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="username">
              Nombre de Usuario
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre en la comunidad"
              required
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={isNewUser ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" className="w-full mt-2">
          {isNewUser ? 'Registrarse' : 'Iniciar Sesión'}
        </Button>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </form>

      <div className="text-center text-sm">
        {isNewUser ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
        <button
          onClick={() => setIsNewUser(!isNewUser)}
          className="font-semibold text-primary hover:underline"
        >
          {isNewUser ? 'Inicia Sesión' : 'Regístrate'}
        </button>
      </div>
    </div>
  )
}
