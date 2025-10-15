'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react'

export function CommunityClient({ communityData }: { communityData: any[] }) {
  const accountabilityData = communityData
    .filter(user => user.deuda.total > 0)
    .sort((a, b) => b.deuda.total - a.deuda.total);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Tarjeta de Pulso Diario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" />
            El Pulso de Hoy
          </CardTitle>
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

      {/* Tarjeta de Muro de Responsabilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="text-destructive" />
            Muro de la Responsabilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Días Pendientes</TableHead>
                <TableHead className="text-right">Deuda Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountabilityData.length > 0 ? (
                accountabilityData.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre_usuario}</TableCell>
                    <TableCell>{user.deuda.dias_pendientes}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {user.deuda.total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                  </TableRow>
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
