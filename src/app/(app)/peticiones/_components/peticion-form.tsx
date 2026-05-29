'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { crearPeticionAction, actualizarPeticionAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PeticionFormProps {
  mode: 'create' | 'edit'
  peticionId?: string
  initialData?: {
    titulo: string
    descripcion: string | null
    categoria: string
    visibilidad: string
  }
  onSuccess?: () => void
}

const CATEGORIAS = [
  { value: 'salud', label: 'Salud' },
  { value: 'familia', label: 'Familia' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'otro', label: 'Otro' },
] as const

// ─── Component ───────────────────────────────────────────────────────────────

export function PeticionForm({
  mode,
  peticionId,
  initialData,
  onSuccess,
}: PeticionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? '')
  const [categoria, setCategoria] = useState<string>(initialData?.categoria ?? 'otro')
  const [esPrivada, setEsPrivada] = useState(initialData?.visibilidad === 'private')

  const [errors, setErrors] = useState<{
    titulo?: string
    descripcion?: string
  }>({})

  // Validate
  function validate(): boolean {
    const newErrors: typeof errors = {}

    if (titulo.trim().length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres'
    } else if (titulo.trim().length > 120) {
      newErrors.titulo = 'El título no puede exceder 120 caracteres'
    }

    if (descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    startTransition(async () => {
      const data = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        categoria: categoria as 'salud' | 'familia' | 'trabajo' | 'espiritual' | 'urgente' | 'otro',
        visibilidad: esPrivada ? 'private' as const : 'group' as const,
      }

      const result = mode === 'create'
        ? await crearPeticionAction(data)
        : await actualizarPeticionAction(peticionId!, data)

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Petición creada'
            : 'Petición actualizada'
        )
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/peticiones/mis-peticiones')
        }
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  // ─── Styles ──────────────────────────────────────────────────────────────
  const inputBg = 'hsl(var(--input))'
  const borderClr = 'hsl(var(--border))'
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'
  const errorClr = '#EF4444'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Título */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo" className="text-[13px] font-sans" style={{ color: textClr }}>
          Título *
        </Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value)
            if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: undefined }))
          }}
          placeholder="Ej: Salud de mi madre"
          maxLength={120}
          disabled={isPending}
          style={{
            backgroundColor: inputBg,
            border: `1px solid ${errors.titulo ? errorClr : borderClr}`,
            color: textClr,
          }}
        />
        <div className="flex items-center justify-between">
          {errors.titulo && (
            <span className="text-[11px] font-sans" style={{ color: errorClr }}>
              {errors.titulo}
            </span>
          )}
          <span
            className="text-[11px] font-sans ml-auto"
            style={{ color: titulo.length > 100 ? errorClr : subClr }}
          >
            {titulo.length}/120
          </span>
        </div>
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="descripcion" className="text-[13px] font-sans" style={{ color: textClr }}>
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value)
            if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: undefined }))
          }}
          placeholder="Compartí más detalles sobre tu petición..."
          maxLength={500}
          rows={4}
          disabled={isPending}
          style={{
            backgroundColor: inputBg,
            border: `1px solid ${errors.descripcion ? errorClr : borderClr}`,
            color: textClr,
          }}
        />
        <div className="flex items-center justify-between">
          {errors.descripcion && (
            <span className="text-[11px] font-sans" style={{ color: errorClr }}>
              {errors.descripcion}
            </span>
          )}
          <span
            className="text-[11px] font-sans ml-auto"
            style={{ color: descripcion.length > 450 ? errorClr : subClr }}
          >
            {descripcion.length}/500
          </span>
        </div>
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-2">
        <Label className="text-[13px] font-sans" style={{ color: textClr }}>
          Categoría
        </Label>
        <Select value={categoria} onValueChange={setCategoria} disabled={isPending}>
          <SelectTrigger
            style={{
              backgroundColor: inputBg,
              border: `1px solid ${borderClr}`,
              color: textClr,
            }}
          >
            <SelectValue placeholder="Seleccioná una categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Visibilidad toggle */}
      <div className="flex flex-col gap-2">
        <Label className="text-[13px] font-sans" style={{ color: textClr }}>
          Visibilidad
        </Label>
        <button
          type="button"
          onClick={() => setEsPrivada(!esPrivada)}
          disabled={isPending}
          className="flex items-center justify-between rounded-[10px] px-4 py-3 transition-colors"
          style={{
            backgroundColor: inputBg,
            border: `1px solid ${borderClr}`,
          }}
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[13px] font-sans font-medium" style={{ color: textClr }}>
              {esPrivada ? 'Privada' : 'Compartir con grupo'}
            </span>
            <span className="text-[11px] font-sans" style={{ color: subClr }}>
              {esPrivada
                ? 'Solo vos podés ver esta petición'
                : 'Tu comunidad puede ver y orar por esta petición'}
            </span>
          </div>
          {/* Toggle switch */}
          <div
            className="shrink-0 rounded-full"
            style={{
              width: 44,
              height: 24,
              backgroundColor: esPrivada ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              position: 'relative',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              className="rounded-full transition-all duration-200"
              style={{
                width: 18,
                height: 18,
                backgroundColor: '#FFFFFF',
                position: 'absolute',
                top: 3,
                left: esPrivada ? 3 : 23,
              }}
            />
          </div>
        </button>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending || titulo.trim().length < 3}
        className="w-full mt-2"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: '#FFFFFF',
        }}
      >
        {isPending
          ? mode === 'create'
            ? 'Creando...'
            : 'Guardando...'
          : mode === 'create'
            ? 'Crear Petición'
            : 'Guardar Cambios'}
      </Button>
    </form>
  )
}
