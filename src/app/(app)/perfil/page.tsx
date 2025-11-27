import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from './_components/user-profile'
import { Tables } from '@/types/database'

// Helper para calcular la racha
function calculateStreak(progress: Tables<'progreso_usuario'>[]): number {
  if (progress.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Comprobar si el último día completado es hoy o ayer
  const lastProgressDate = new Date(progress[0].fecha_progreso);
  lastProgressDate.setHours(0, 0, 0, 0);
  
  const diffDays = (today.getTime() - lastProgressDate.getTime()) / (1000 * 3600 * 24);

  if (diffDays > 1) {
    return 0; // Se rompió la racha
  }

  streak = 1;
  let previousDate = lastProgressDate;

  for (let i = 1; i < progress.length; i++) {
    const currentDate = new Date(progress[i].fecha_progreso);
    currentDate.setHours(0, 0, 0, 0);
    const dayDifference = (previousDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);

    if (dayDifference === 1) {
      streak++;
      previousDate = currentDate;
    } else {
      break; // La racha se rompió
    }
  }

  return streak;
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener todos los datos necesarios en paralelo
  const [profileRes, progressHistoryRes, totalMissionsRes] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase.from('progreso_usuario').select('*')
      .eq('usuario_id', user.id)
      .eq('lectura_completada', true)
      .eq('oracion_completada', true)
      .order('fecha_progreso', { ascending: false }),
    supabase.from('progreso_usuario').select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lectura_completada', true)
      .eq('oracion_completada', true)
  ]);

  const profile = profileRes.data;
  const progressHistory = progressHistoryRes.data || [];
  const totalMissions = totalMissionsRes.count || 0;
  
  const currentStreak = calculateStreak(progressHistory);

  const totalPrayerSeconds = progressHistory.reduce((acc, curr) => acc + (curr.segundos_oracion_acumulados || 0), 0);

  const stats = {
    streak: currentStreak,
    totalMissions: totalMissions,
    totalPrayerSeconds: totalPrayerSeconds
  }

  return <UserProfile profile={profile} stats={stats} />
}
