import { Tables } from "./database";

// Tipo para el estado de las Server Actions, compatible con useActionState
export type ActionState = {
  errors?: {
    _form?: string[];
    [key: string]: string[] | undefined;
  };
  message?: string;
  error?: string;
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
