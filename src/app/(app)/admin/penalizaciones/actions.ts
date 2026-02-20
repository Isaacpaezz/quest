'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'

export async function aplicarPagoAction(usuarioId: string, monto: number): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { error: 'No tienes un grupo activo.' }

  // Verify admin role via miembros_grupo
  const { data: miembro } = await supabase
    .from('miembros_grupo')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (miembro?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  if (monto <= 0) return { error: 'El monto debe ser positivo.' }

  const { error } = await supabase.rpc('aplicar_pago_a_usuario', {
    usuario_id_param: usuarioId,
    monto_pago_param: monto,
  })

  if (error) {
    console.error('Error al aplicar pago:', error)
    return { error: 'Hubo un error en la base de datos.' }
  }

  revalidatePath('/admin/penalizaciones')
  revalidatePath('/community')
  return { message: 'Pago aplicado exitosamente.' }
}

export async function crearPenalizacionManualAction(usuarioId: string, monto: number, motivo: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { error: 'No tienes un grupo activo.' }

  // Verify admin role via miembros_grupo
  const { data: miembro } = await supabase
    .from('miembros_grupo')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (miembro?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  if (monto <= 0) return { error: 'El monto debe ser positivo.' }
  if (!motivo.trim()) return { error: 'El motivo es requerido.' }

  const { error } = await supabase.from('penalizaciones').insert({
    usuario_id: usuarioId,
    grupo_id: grupoId,
    monto,
    monto_pagado: 0,
    estado: 'pendiente',
    tipo: 'manual',
    motivo: motivo.trim(),
    fecha: new Date().toISOString().split('T')[0],
  })

  if (error) {
    console.error('Error al crear penalización:', error)
    return { error: 'Hubo un error al crear la penalización.' }
  }

  revalidatePath('/admin/penalizaciones')
  revalidatePath('/community')
  return { message: 'Penalización creada exitosamente.' }
}
