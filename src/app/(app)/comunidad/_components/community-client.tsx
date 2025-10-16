'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, ShieldAlert, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge' // Asegúrate de que Badge está importado

export function CommunityClient({ communityData }: { communityData: any[] }) {
  const accountabilityData = communityData
    .filter(user => user.deuda.total > 0)
    .sort((a, b) => b.deuda.total - a.deuda.total);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Tarjeta de Pulso Diario (sin cambios) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500" />Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead className="text-center">Lectura</TableHead>
                <TableHead className="text-center">Oración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communityData.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nombre_usuario}</TableCell>
                  <TableCell className="text-center">
                    {user.progresoHoy.lectura_completada 
                      ? <CheckCircle2 className="mx-auto text-green-500" /> 
                      : <XCircle className="mx-auto text-muted-foreground/50" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.progresoHoy.oracion_completada 
                      ? <CheckCircle2 className="mx-auto text-green-500" /> 
                      : <XCircle className="mx-auto text-muted-foreground/50" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tarjeta de Muro de Responsabilidad (ACTUALIZADA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive" />Muro</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Días Falla</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountabilityData.length > 0 ? (
                accountabilityData.map(user => (
                  <Collapsible asChild key={user.id} >
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            {user.nombre_usuario}
                          </TableCell>
                          <TableCell>{user.deuda.dias_pendientes}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {user.deuda.total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <tr className="bg-muted/20">
                          <td colSpan={3}>
                            <div className="p-4">
                              <h4 className="font-semibold mb-2">Detalle de Incumplimientos:</h4>
                              <ul className="space-y-2">
                                {user.deuda.penalizaciones.map((p: any) => (
                                  <li key={p.id} className="text-sm flex justify-between items-center">
                                    <span>
                                      {new Date(p.fecha_incumplimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                      : <span className="font-mono">{parseFloat(p.monto).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
                                    </span>
                                    <Badge variant="destructive">{p.motivo}</Badge>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    ¡Felicidades! No hay penalizaciones pendientes en la comunidad.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
