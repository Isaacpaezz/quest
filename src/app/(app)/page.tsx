import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, ShieldAlert, Target } from 'lucide-react'

/**
 * Página principal del Dashboard.
 * Muestra la "Misión del Día" del usuario, que consiste en la lectura bíblica
 * y el tiempo de oración asignados por el plan de lectura activo.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Obtener la misión de hoy (capítulo y tiempo de oración)
  const today = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD

  const { data: dailyMission, error: missionError } = await supabase
    .from('planes_lectura')
    .select(`
      minutos_oracion_requeridos,
      capitulos_diarios (
        id,
        referencia_capitulo
      )
    `)
    .eq('esta_activo', true)
    .eq('capitulos_diarios.fecha_lectura', today)
    .single()

  // 2. Obtener el progreso del usuario para la misión de hoy
  const { data: userProgress, error: progressError } = await supabase
    .from('progreso_usuario')
    .select('lectura_completada, oracion_completada')
    .eq('usuario_id', user.id)
    .eq('fecha_progreso', today)
    .single()

  // Extraer la información del capítulo de la misión
  // Supabase devuelve `capitulos_diarios` como un array, incluso con .single() en la relación
  const chapterInfo = Array.isArray(dailyMission?.capitulos_diarios)
    ? dailyMission.capitulos_diarios[0]
    : dailyMission?.capitulos_diarios;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tu Senda Diaria</h1>
        <p className="text-muted-foreground">Este es tu espacio para crecer y conectar.</p>
      </header>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-primary" />
            Misión de Hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!chapterInfo ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-lg">
              <ShieldAlert className="w-12 h-12 mb-4 text-muted-foreground" />
              <h3 className="font-semibold">Día de Descanso o Preparación</h3>
              <p className="text-sm text-muted-foreground">No hay una lectura asignada para hoy. ¡Aprovecha para meditar o espera la próxima misión!</p>
            </div>
          ) : (
            <>
              {/* Sección de Lectura */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <BookOpen className="w-8 h-8 text-secondary" />
                  <div>
                    <h3 className="font-semibold">Lectura Bíblica</h3>
                    <p className="text-lg font-bold text-primary">{chapterInfo.referencia_capitulo}</p>
                  </div>
                </div>
                {userProgress?.lectura_completada ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">Completado</span>
                  </div>
                ) : (
                  <Button>Registrar Lectura</Button>
                )}
              </div>

              {/* Sección de Oración */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-8">
                     <span className="text-2xl font-bold text-secondary">{dailyMission.minutos_oracion_requeridos}</span>
                     <span className="text-xs font-semibold tracking-widest uppercase">MIN</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Tiempo de Oración</h3>
                    <p className="text-muted-foreground">Conecta y reflexiona.</p>
                  </div>
                </div>
                {userProgress?.oracion_completada ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">Completado</span>
                  </div>
                ) : (
                  <Button>Iniciar Oración</Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
