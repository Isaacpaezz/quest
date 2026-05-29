import { redirect } from 'next/navigation'

/**
 * /peticiones
 * PR1: Redirects to personal wall (/peticiones/mis-peticiones).
 * PR2: Will show community wall with toggle to personal wall.
 */
export default function PeticionesPage() {
  redirect('/peticiones/mis-peticiones')
}
