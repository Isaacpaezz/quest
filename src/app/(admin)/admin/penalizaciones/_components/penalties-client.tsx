'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { aplicarPagoAction } from '@/app/(admin)/admin/penalizaciones/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { ShieldCheck } from 'lucide-react'

export function PenaltiesClient({ users: initialUsers }: { users: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const handleApplyPayment = async () => {
    if (!selectedUser || !amountRef.current) return
    const amount = parseFloat(amountRef.current.value)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Monto inválido', { description: 'Por favor, introduce un número positivo.' })
      return
    }

    setIsLoading(true)
    const result = await aplicarPagoAction(selectedUser.usuario_id, amount)
    if (result.error) {
      toast.error('Error', { description: result.error })
    } else {
      toast.success('Éxito', { description: result.message })
      setSelectedUser(null)
    }
    setIsLoading(false)
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Penalizaciones Pendientes</CardTitle></CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Días Pendientes</TableHead>
                  <TableHead>Deuda Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.usuario_id}>
                    <TableCell className="font-medium">{user.nombre_usuario}</TableCell>
                    <TableCell>{user.dias_pendientes}</TableCell>
                    <TableCell className="font-mono">{user.deuda_total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>Gestionar Pago</Button>
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
      
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago para {selectedUser?.nombre_usuario}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p>Deuda Total: <span className="font-bold">{selectedUser?.deuda_total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span></p>
            <div>
              <Label htmlFor="amount">Monto a Pagar</Label>
              <Input id="amount" ref={amountRef} type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => amountRef.current!.value = selectedUser?.deuda_total.toString()}>Pagar Completo</Button>
              <Button onClick={handleApplyPayment} disabled={isLoading}>{isLoading ? 'Aplicando...' : 'Aplicar Pago'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </>
  )
}
