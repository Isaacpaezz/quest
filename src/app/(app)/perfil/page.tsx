import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from './_components/user-profile'
import { calculateStreak } from '@/lib/streak'
import { getTimezone, getDiasLibres, getDatesWithoutPlan } from '@/lib/grupo-helpers'
import { getToday } from '@/lib/utils'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener todos los datos necesarios en paralelo
  const [profileRes, progressHistoryRes, totalMissionsRes, xpHistoryRes] = await Promise.all([
    supabase.from('perfiles').select('id, nombre_usuario, xp, nivel, max_streak, rol, creado_en, grupo_activo_id').eq('id', user.id).single(),
    supabase.from('progreso_usuario').select('fecha_progreso, lectura_completada, oracion_completada, segundos_oracion_acumulados')
      .eq('usuario_id', user.id)
      .order('fecha_progreso', { ascending: false }),
    supabase.from('progreso_usuario').select('fecha_progreso', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lectura_completada', true)
      .eq('oracion_completada', true),
    supabase.from('historial_xp')
      .select('id, cantidad, motivo, created_at')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  let profile = profileRes.data;
  // Override with group-specific XP if user has active group
  if (profile?.grupo_activo_id) {
    const { data: miembro } = await supabase
      .from('miembros_grupo')
      .select('xp, nivel')
      .eq('usuario_id', user.id)
      .eq('grupo_id', profile.grupo_activo_id)
      .single()
    if (miembro) {
      profile = { ...profile, xp: miembro.xp, nivel: miembro.nivel }
    }
  }
  const progressHistory = progressHistoryRes.data || [];
  const totalMissions = totalMissionsRes.count || 0;
  const xpHistory = xpHistoryRes.data || [];

  // Calculate streak using timezone-aware shared utility
  const tz = await getTimezone(supabase)
  const today = getToday(tz)
  const grupoId = profile?.grupo_activo_id ?? null
  const diasLibres = await getDiasLibres(supabase, grupoId)
  const excludedDates = await getDatesWithoutPlan(supabase, today, grupoId)
  const currentStreak = calculateStreak(progressHistory, today, diasLibres, excludedDates, tz);

  const totalPrayerSeconds = progressHistory.reduce((acc, curr) => acc + (curr.segundos_oracion_acumulados || 0), 0);

  const stats = {
    streak: currentStreak,
    totalMissions: totalMissions,
    totalPrayerSeconds: totalPrayerSeconds
  }

  return <UserProfile profile={profile} stats={stats} xpHistory={xpHistory} />
}
