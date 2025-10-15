import AuthForm from '@/components/auth/auth-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Quest',
  description: 'Inicia sesión o regístrate para comenzar tu senda espiritual diaria',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <div className="absolute inset-0 -z-10 bg-[url('/grid-light.svg')] bg-center opacity-5"></div>
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  )
}