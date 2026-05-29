'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { aplicarPagoAction, crearPenalizacionManualAction } from '@/app/(app)/admin/penalizaciones/actions'
import { Toaster } from '@/components/ui/sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { ShieldCheck, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import Link from 'next/link'

type UserDebt = {
  usuario_id: string
  nombre_usuario: string
  dias_pendientes: number
  deuda_total: number
}

type Member = {
  id: string
  nombre_usuario: string
}

export function PenaltiesClient({ users: initialUsers, allMembers }: { users: UserDebt[]; allMembers: Member[] }) {
  const [users] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<UserDebt | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const manualAmountRef = useRef<HTMLInputElement>(null)
  const manualMotivoRef = useRef<HTMLInputElement>(null)
  const [manualUserId, setManualUserId] = useState('')

  useEffect(() => setMounted(true), [])
  const isDark = !mounted ? true : resolvedTheme === 'dark'
  const cardBg = isDark ? 'rgba(21,25,37,0.44)' : 'rgba(255,255,255,0.91)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)'
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  const textSecondary = isDark ? '#5A6075' : '#8C9099'
  const modalBg = isDark ? '#151925' : '#FFFFFF'
  const accent = isDark ? '#2DDAB0' : '#1AAF8B'
  const labelColor = isDark ? '#9CA0B5' : '#6B7080'

  const handleApplyPayment = async () => {
    if (!selectedUser || !amountRef.current) return
    const amount = parseFloat(amountRef.current.value)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Monto inválido', { description: 'Por favor, introduce un número positivo.' })
      return
    }
    setIsLoading(true)
    const result = await aplicarPagoAction(selectedUser.usuario_id, amount)
    if (result.error) toast.error('Error', { description: result.error })
    else { toast.success('Éxito', { description: result.message }); setSelectedUser(null) }
    setIsLoading(false)
  }

  const handleCreatePenalty = async () => {
    if (!manualUserId || !manualAmountRef.current || !manualMotivoRef.current) return
    const amount = parseFloat(manualAmountRef.current.value)
    const motivo = manualMotivoRef.current.value
    if (isNaN(amount) || amount <= 0) {
      toast.error('Monto inválido')
      return
    }
    if (!motivo.trim()) {
      toast.error('El motivo es requerido')
      return
    }
    setIsLoading(true)
    const result = await crearPenalizacionManualAction(manualUserId, amount, motivo)
    if (result.error) toast.error('Error', { description: result.error })
    else {
      toast.success('Éxito', { description: result.message })
      setShowCreateModal(false)
      setManualUserId('')
    }
    setIsLoading(false)
  }

  const inputStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    color: textPrimary,
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Back navigation + Create button */}
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-1">
            <ChevronLeft className="size-4" style={{ color: accent }} />
            <span className="text-[13px] font-sans" style={{ color: accent }}>Panel Admin</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold font-sans transition-all active:scale-[0.97]"
            style={{
              backgroundColor: isDark ? 'rgba(255,107,107,0.10)' : 'rgba(255,107,107,0.08)',
              border: `1px solid ${isDark ? 'rgba(255,107,107,0.20)' : 'rgba(255,107,107,0.15)'}`,
              color: '#FF6B6B',
            }}
          >
            <Plus className="size-3.5" />
            Penalización
          </button>
        </div>

        {users.length > 0 ? (
          <div className="flex flex-col gap-3">
            {users.map(user => (
              <button
                key={user.usuario_id}
                onClick={() => setSelectedUser(user)}
                className="p-4 rounded-[20px] text-left transition-all active:scale-[0.98]"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-semibold font-sans block" style={{ color: textPrimary }}>
                      {user.nombre_usuario}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[12px] font-sans" style={{ color: textSecondary }}>
                        {user.dias_pendientes} días pendientes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[18px] font-bold" style={{ color: '#FF6B6B' }}>
                      {user.deuda_total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                    </span>
                    <ChevronRight className="size-4 text-[#6B6F85] shrink-0" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="p-6 rounded-3xl"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <EmptyState
              Icon={ShieldCheck}
              title="Todo en Orden"
              description="No hay penalizaciones pendientes. ¡Excelente trabajo!"
            />
          </div>
        )}
      </div>

      {/* Payment modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
            onClick={() => setSelectedUser(null)}
          />
          <div
            className="relative w-full max-w-sm p-6 rounded-3xl z-10"
            style={{
              backgroundColor: modalBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.40)',
            }}
          >
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-1 rounded-lg">
              <X className="size-4" style={{ color: textSecondary }} />
            </button>

            <h3 className="text-[17px] font-bold font-sans mb-4" style={{ color: textPrimary }}>
              Registrar Pago
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans" style={{ color: textSecondary }}>Miembro</span>
                <span className="text-[14px] font-semibold font-sans" style={{ color: textPrimary }}>
                  {selectedUser.nombre_usuario}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans" style={{ color: textSecondary }}>Deuda Total</span>
                <span className="font-display text-[18px] font-bold" style={{ color: '#FF6B6B' }}>
                  {selectedUser.deuda_total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                </span>
              </div>

              <div className="h-[1px] w-full my-1" style={{ backgroundColor: cardBorder }} />

              <div>
                <label className="text-[12px] font-sans" style={{ color: labelColor }}>Monto a Pagar</label>
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => amountRef.current!.value = selectedUser.deuda_total.toString()}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold font-sans transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: textPrimary,
                  }}
                >
                  Pagar Completo
                </button>
                <button
                  onClick={handleApplyPayment}
                  disabled={isLoading}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold font-sans transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{
                    backgroundColor: accent,
                    color: isDark ? '#0A0D14' : '#FFFFFF',
                  }}
                >
                  {isLoading ? 'Aplicando...' : 'Aplicar Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual penalty creation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
            onClick={() => setShowCreateModal(false)}
          />
          <div
            className="relative w-full max-w-sm p-6 rounded-3xl z-10"
            style={{
              backgroundColor: modalBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.40)',
            }}
          >
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1 rounded-lg">
              <X className="size-4" style={{ color: textSecondary }} />
            </button>

            <h3 className="text-[17px] font-bold font-sans mb-4" style={{ color: textPrimary }}>
              Crear Penalización Manual
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-sans" style={{ color: labelColor }}>Miembro</label>
                <select
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none appearance-none"
                  style={inputStyle}
                >
                  <option value="" style={{ color: '#111318' }}>Seleccionar miembro...</option>
                  {allMembers.map(m => (
                    <option key={m.id} value={m.id} style={{ color: '#111318' }}>
                      {m.nombre_usuario}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-sans" style={{ color: labelColor }}>Monto ($)</label>
                <input
                  ref={manualAmountRef}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-[12px] font-sans" style={{ color: labelColor }}>Motivo</label>
                <input
                  ref={manualMotivoRef}
                  type="text"
                  placeholder="Ej: Falta a reunión grupal"
                  className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleCreatePenalty}
                disabled={isLoading || !manualUserId}
                className="w-full h-11 rounded-xl text-[13px] font-semibold font-sans transition-all active:scale-[0.97] disabled:opacity-50 mt-1"
                style={{
                  backgroundColor: '#FF6B6B',
                  color: '#FFFFFF',
                }}
              >
                {isLoading ? 'Creando...' : 'Crear Penalización'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster richColors />
    </>
  )
}
