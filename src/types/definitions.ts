import { Tables } from "./database";

// Tipo para el estado de las Server Actions, compatible con useActionState
export type ActionState = {
  errors?: {
    _form?: string[];
    [key: string]: string[] | undefined;
  };
  message?: string;
  error?: string;
  success?: string;
  // XP result fields (for level-up notifications)
  xpGanado?: number;
  nuevoNivel?: number;
  subioNivel?: boolean;
};

// Tipo enriquecido para los datos de la página de comunidad
export type CommunityMember = Tables<'perfiles'> & {
  progresoHoy: {
    lectura_completada: boolean;
    oracion_completada: boolean;
  };
  streak: number; // Racha de días consecutivos completados
  deuda: {
    total: number;
    dias_pendientes: number;
    penalizaciones: (Tables<'penalizaciones'> & { motivo: string })[];
  };
};

// ─── Tipos de Grupos ───

export type Grupo = Tables<'grupos'>;

export type MiembroGrupo = Tables<'miembros_grupo'>;

export type InvitacionGrupo = Tables<'invitaciones_grupo'>;

/** Grupo con conteo de miembros y rol del usuario actual */
export type GrupoConMiembros = Grupo & {
  miembrosCount: number;
  miRol: string | null;
  codigo_invitacion: string | null;
};
