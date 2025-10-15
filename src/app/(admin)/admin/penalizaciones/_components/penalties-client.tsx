'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { marcarComoPagadaAction } from '@/app/(admin)/admin/penalizaciones/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ShieldCheck } from 'lucide-react'

export function PenaltiesClient({ penalties: initialPenalties }: { penalties: any[] }) {
  const [penalties, setPenalties] = useState(initialPenalties)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleMarkAsPaid = async (penaltyId: number) => {
    setLoadingId(penaltyId)
    const result = await marcarComoPagadaAction(penaltyId)
    if (result.error) {
      toast.error('Error', { description: result.error })
    } else {
      toast.success('Éxito', { description: result.message })
      // Eliminar la penalización de la lista en la UI para una respuesta instantánea
      setPenalties(currentPenalties => currentPenalties.filter(p => p.id !== penaltyId))
    }
    setLoadingId(null)
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Penalizaciones Pendientes</CardTitle></CardHeader>
        <CardContent>
          {penalties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Fecha de Incumplimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.map(penalty => (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">{penalty.perfiles.nombre_usuario}</TableCell>
                    <TableCell>{new Date(penalty.fecha_incumplimiento).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">{parseFloat(penalty.monto).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(penalty.id)}
                        disabled={loadingId === penalty.id}
                      >
                        {loadingId === penalty.id ? 'Marcando...' : 'Marcar como Pagada'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              Icon={ShieldCheck}
              title="Todo en Orden"
              description="No hay penalizaciones pendientes en la comunidad. ¡Excelente trabajo!"
            />
          )}
        </CardContent>
      </Card>
      <Toaster richColors />
    </>
  )
}
