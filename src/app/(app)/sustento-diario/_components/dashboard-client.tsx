'use client'

import { useState } from 'react'

type DailyData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dailyMission: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProgress: any
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, ShieldAlert, Target } from 'lucide-react'
import { RegisterReadingDialog } from './register-reading-dialog'
import { Toaster } from '@/components/ui/sonner'
import { PrayerTimer } from './prayer-timer'

// El componente recibe los datos pre-cargados desde la página del servidor
export function DashboardClient({ dailyMission, userProgress }: DailyData) {
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false)
  
  const chapterInfo = Array.isArray(dailyMission?.capitulos_diarios)
    ? dailyMission.capitulos_diarios[0]
    : dailyMission?.capitulos_diarios;

  return (
    <>
      <Card className="w-full md:max-w-2xl mx-auto">
        {/* ... (El CardHeader se mantiene igual) ... */}
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-primary" />
            Misión de Hoy: {new Date().toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!chapterInfo ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-lg">
              <ShieldAlert className="w-12 h-12 mb-4 text-muted-foreground" />
              <h3 className="font-semibold">Día de Descanso o Preparación</h3>
              <p className="text-sm text-muted-foreground">No hay una lectura asignada para hoy.</p>
            </div>
          ) : (
            <>
              {/* Sección de Lectura Interactiva */}
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
                  <Button onClick={() => setIsReadingDialogOpen(true)}>Registrar Lectura</Button>
                )}
              </div>
              {/* Sección de Oración Interactiva */}
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
                <PrayerTimer
                  minutosRequeridos={dailyMission.minutos_oracion_requeridos}
                  segundosIniciales={userProgress?.segundos_oracion_acumulados || 0}
                  capituloId={chapterInfo.id}
                  oracionCompletada={userProgress?.oracion_completada || false}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {chapterInfo && (
        <RegisterReadingDialog
          open={isReadingDialogOpen}
          onOpenChange={setIsReadingDialogOpen}
          chapterId={chapterInfo.id}
          chapterReference={chapterInfo.referencia_capitulo}
        />
      )}
      <Toaster richColors />
    </>
  )
}
