'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { generarPlanAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'

// Componente para el botón de envío para mostrar estado de carga
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Generando...' : 'Generar Plan'}</Button>
}

const initialState = { errors: {}, message: undefined };

export function PlanManagementClient({ planes }: { planes: any[] }) {
  const [state, formAction] = useActionState(generarPlanAction, initialState)

  useEffect(() => {
    if (state.message) {
      toast.success('Éxito', { description: state.message })
    }
  }, [state])

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader><CardTitle>Crear Nuevo Plan</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label>Libro de la Biblia</Label>
              <Select name="nombre_libro" required>
                <SelectTrigger><SelectValue placeholder="Selecciona un libro" /></SelectTrigger>
                <SelectContent>
                  {LIBROS_BIBLIA.map(libro => (
                    <SelectItem key={libro.nombre} value={libro.nombre}>{libro.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input id="fecha_inicio" name="fecha_inicio" type="date" required />
            </div>
            <div>
              <Label htmlFor="minutos_oracion">Minutos de Oración Diarios</Label>
              <Input id="minutos_oracion" name="minutos_oracion" type="number" defaultValue="15" required />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Planes Existentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map(plan => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre_libro}</TableCell>
                  <TableCell><Badge variant={plan.estado === 'activo' ? 'default' : plan.estado === 'proximo' ? 'secondary' : 'outline'}>{plan.estado}</Badge></TableCell>
                  <TableCell>{new Date(plan.fecha_inicio).toLocaleDateString()} - {new Date(plan.fecha_fin).toLocaleDateString()}</TableCell>
                  <TableCell>{/* Botones de acción aquí */}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Toaster richColors />
    </div>
  )
}
