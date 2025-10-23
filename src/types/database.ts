export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      actividad_comunidad: {
        Row: {
          creado_en: string
          id: number
          referencia_contenido: string | null
          resumen_actividad: string | null
          tipo_actividad: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: number
          referencia_contenido?: string | null
          resumen_actividad?: string | null
          tipo_actividad: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: number
          referencia_contenido?: string | null
          resumen_actividad?: string | null
          tipo_actividad?: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividad_comunidad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capitulos_diarios: {
        Row: {
          fecha_lectura: string
          id: number
          plan_id: number
          referencia_capitulo: string
        }
        Insert: {
          fecha_lectura: string
          id?: number
          plan_id: number
          referencia_capitulo: string
        }
        Update: {
          fecha_lectura?: string
          id?: number
          plan_id?: number
          referencia_capitulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "capitulos_diarios_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_lectura"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_app: {
        Row: {
          clave: string
          valor: string
        }
        Insert: {
          clave: string
          valor: string
        }
        Update: {
          clave?: string
          valor?: string
        }
        Relationships: []
      }
      penalizaciones: {
        Row: {
          estado: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento: string
          id: number
          monto: number
          monto_pagado: number
          usuario_id: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento: string
          id?: number
          monto: number
          monto_pagado?: number
          usuario_id: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento?: string
          id?: number
          monto?: number
          monto_pagado?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalizaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          creado_en: string
          id: string
          nombre_usuario: string
          rol: string
        }
        Insert: {
          creado_en?: string
          id: string
          nombre_usuario: string
          rol?: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre_usuario?: string
          rol?: string
        }
        Relationships: []
      }
      planes_lectura: {
        Row: {
          estado: Database["public"]["Enums"]["plan_estado"]
          fecha_fin: string
          fecha_inicio: string
          id: number
          minutos_oracion_requeridos: number
          nombre_libro: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["plan_estado"]
          fecha_fin: string
          fecha_inicio: string
          id?: number
          minutos_oracion_requeridos: number
          nombre_libro: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["plan_estado"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: number
          minutos_oracion_requeridos?: number
          nombre_libro?: string
        }
        Relationships: []
      }
      progreso_usuario: {
        Row: {
          capitulo_id: number
          fecha_progreso: string
          id: number
          lectura_completada: boolean
          lectura_completada_en: string | null
          oracion_completada: boolean
          oracion_completada_en: string | null
          resumen_lectura: string | null
          segundos_oracion_acumulados: number
          usuario_id: string
        }
        Insert: {
          capitulo_id: number
          fecha_progreso?: string
          id?: number
          lectura_completada?: boolean
          lectura_completada_en?: string | null
          oracion_completada?: boolean
          oracion_completada_en?: string | null
          resumen_lectura?: string | null
          segundos_oracion_acumulados?: number
          usuario_id: string
        }
        Update: {
          capitulo_id?: number
          fecha_progreso?: string
          id?: number
          lectura_completada?: boolean
          lectura_completada_en?: string | null
          oracion_completada?: boolean
          oracion_completada_en?: string | null
          resumen_lectura?: string | null
          segundos_oracion_acumulados?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progreso_usuario_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_actualizar_rol: {
        Args: { user_id: string; user_role?: string }
        Returns: Json
      }
      admin_crear_perfil: {
        Args: { user_id: string; user_role?: string; username: string }
        Returns: Json
      }
      aplicar_pago_a_usuario: {
        Args: { monto_pago_param: number; usuario_id_param: string }
        Returns: undefined
      }
      crear_plan_con_capitulos: {
        Args: {
          capitulos_param: Json
          fecha_fin_param: string
          fecha_inicio_param: string
          minutos_oracion_requeridos_param: number
          nombre_libro_param: string
        }
        Returns: undefined
      }
      programar_plan_siguiente: {
        Args: { plan_id_a_programar: number }
        Returns: undefined
      }
      registrar_penalizaciones_diarias: { Args: never; Returns: undefined }
      transicion_automatica_de_plan: { Args: never; Returns: undefined }
    }
    Enums: {
      penalizacion_estado: "pendiente" | "pagada"
      plan_estado: "inactivo" | "activo" | "proximo" | "completado"
      tipo_actividad: "lectura_completada" | "oracion_completada"
    }
    CompositeTypes: {
      capitulo_diario_type: {
        fecha_lectura: string | null
        referencia_capitulo: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      penalizacion_estado: ["pendiente", "pagada"],
      plan_estado: ["inactivo", "activo", "proximo", "completado"],
      tipo_actividad: ["lectura_completada", "oracion_completada"],
    },
  },
} as const
