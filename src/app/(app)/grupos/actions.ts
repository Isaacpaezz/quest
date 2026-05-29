'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'

// ─── Crear Grupo ───
export async function crearGrupoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const nombre = formData.get('nombre')?.toString().trim()
  const descripcion = formData.get('descripcion')?.toString().trim() || null

  if (!nombre || nombre.length < 2) {
    return { error: 'El nombre del grupo debe tener al menos 2 caracteres' }
  }

  // Crear grupo
  const { data: grupo, error } = await supabase
    .from('grupos')
    .insert({
      nombre,
      descripcion,
      creador_id: user.id,
    })
    .select()
    .single()

  if (error) return { error: `Error al crear grupo: ${error.message}` }

  // Auto-unirse como admin
  await supabase.from('miembros_grupo').insert({
    usuario_id: user.id,
    grupo_id: grupo.id,
    rol: 'admin',
  })

  // Copiar config default al nuevo grupo
  const { data: defaultConfig } = await supabase
    .from('configuracion_app')
    .select('clave, valor')
    .not('grupo_id', 'is', null)
    .limit(20)

  if (defaultConfig && defaultConfig.length > 0) {
    // Tomar las claves únicas de cualquier grupo existente como template
    const clavesSeen = new Set<string>()
    const configInserts = defaultConfig
      .filter(c => {
        if (clavesSeen.has(c.clave)) return false
        clavesSeen.add(c.clave)
        return true
      })
      .map(c => ({
        clave: c.clave,
        valor: c.valor,
        grupo_id: grupo.id,
      }))
    await supabase.from('configuracion_app').insert(configInserts)
  }

  // Establecer como grupo activo
  await supabase
    .from('perfiles')
    .update({ grupo_activo_id: grupo.id })
    .eq('id', user.id)

  revalidatePath('/grupos')
  revalidatePath('/community')
  revalidatePath('/feed')
  return { success: `Grupo "${nombre}" creado exitosamente` }
}

// ─── Unirse a Grupo con Código ───
export async function unirseAGrupoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const codigo = formData.get('codigo')?.toString().trim()
  if (!codigo) return { error: 'Ingresa un código de invitación' }

  // Buscar grupo por código
  const { data: grupo } = await supabase
    .from('grupos')
    .select('id, nombre, max_miembros, activo')
    .eq('codigo_invitacion', codigo)
    .single()

  if (!grupo) return { error: 'Código de invitación inválido' }
  if (!grupo.activo) return { error: 'Este grupo ya no está activo' }

  // Verificar si ya es miembro
  const { data: existente } = await supabase
    .from('miembros_grupo')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupo.id)
    .single()

  if (existente) return { error: 'Ya eres miembro de este grupo' }

  // Verificar límite de miembros
  const { count } = await supabase
    .from('miembros_grupo')
    .select('*', { count: 'exact', head: true })
    .eq('grupo_id', grupo.id)

  if (grupo.max_miembros && count && count >= grupo.max_miembros) {
    return { error: 'Este grupo ha alcanzado el límite de miembros' }
  }

  // Unirse
  const { error } = await supabase.from('miembros_grupo').insert({
    usuario_id: user.id,
    grupo_id: grupo.id,
    rol: 'miembro',
  })

  if (error) return { error: `Error al unirse: ${error.message}` }

  // Establecer como grupo activo
  await supabase
    .from('perfiles')
    .update({ grupo_activo_id: grupo.id })
    .eq('id', user.id)

  revalidatePath('/grupos')
  revalidatePath('/community')
  revalidatePath('/feed')
  return { success: `Te has unido a "${grupo.nombre}"` }
}

// ─── Cambiar Grupo Activo ───
export async function cambiarGrupoActivoAction(grupoId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verificar membresía
  const { data: miembro } = await supabase
    .from('miembros_grupo')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (!miembro) return { error: 'No eres miembro de este grupo' }

  const { error } = await supabase
    .from('perfiles')
    .update({ grupo_activo_id: grupoId })
    .eq('id', user.id)

  if (error) return { error: `Error al cambiar grupo: ${error.message}` }

  revalidatePath('/grupos')
  revalidatePath('/community')
  revalidatePath('/feed')
  revalidatePath('/')
  return { success: 'Grupo activo cambiado' }
}

// ─── Salir de Grupo ───
export async function salirDeGrupoAction(grupoId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verificar que no es el único admin
  const { data: admins } = await supabase
    .from('miembros_grupo')
    .select('id')
    .eq('grupo_id', grupoId)
    .eq('rol', 'admin')

  const { data: miPerfil } = await supabase
    .from('miembros_grupo')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (miPerfil?.rol === 'admin' && admins && admins.length <= 1) {
    return { error: 'No puedes salir siendo el único administrador. Asigna otro admin primero.' }
  }

  // Eliminar membresía
  const { error } = await supabase
    .from('miembros_grupo')
    .delete()
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)

  if (error) return { error: `Error al salir: ${error.message}` }

  // Si era el grupo activo, limpiar
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  if (perfil?.grupo_activo_id === grupoId) {
    // Buscar otro grupo del usuario
    const { data: otroGrupo } = await supabase
      .from('miembros_grupo')
      .select('grupo_id')
      .eq('usuario_id', user.id)
      .limit(1)
      .single()

    await supabase
      .from('perfiles')
      .update({ grupo_activo_id: otroGrupo?.grupo_id || null })
      .eq('id', user.id)
  }

  revalidatePath('/grupos')
  revalidatePath('/community')
  revalidatePath('/feed')
  return { success: 'Has salido del grupo' }
}
