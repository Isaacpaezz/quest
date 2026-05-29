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
          comentarios_count: number
          creado_en: string
          id: number
          likes_count: number
          referencia_contenido: string | null
          resumen_actividad: string | null
          tipo_actividad: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Insert: {
          comentarios_count?: number
          creado_en?: string
          id?: number
          likes_count?: number
          referencia_contenido?: string | null
          resumen_actividad?: string | null
          tipo_actividad: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Update: {
          comentarios_count?: number
          creado_en?: string
          id?: number
          likes_count?: number
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
      badges: {
        Row: {
          created_at: string | null
          criterio: Json
          descripcion: string
          icono: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          criterio: Json
          descripcion: string
          icono: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          criterio?: Json
          descripcion?: string
          icono?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      canjeos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          monto_descontado: number
          puntos_usados: number
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto_descontado: number
          puntos_usados: number
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto_descontado?: number
          puntos_usados?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canjeos_usuario_id_fkey"
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
      comunidad_comentarios: {
        Row: {
          actividad_id: number
          contenido: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          actividad_id: number
          contenido: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          actividad_id?: number
          contenido?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_comentarios_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividad_comunidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidad_likes: {
        Row: {
          actividad_id: number
          created_at: string
          id: string
          tipo_reaccion: string
          user_id: string
        }
        Insert: {
          actividad_id: number
          created_at?: string
          id?: string
          tipo_reaccion?: string
          user_id: string
        }
        Update: {
          actividad_id?: number
          created_at?: string
          id?: string
          tipo_reaccion?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_likes_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividad_comunidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_app: {
        Row: {
          clave: string
          grupo_id: string
          valor: string
        }
        Insert: {
          clave: string
          grupo_id: string
          valor: string
        }
        Update: {
          clave?: string
          grupo_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_app_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          activo: boolean | null
          avatar_url: string | null
          codigo_invitacion: string | null
          creador_id: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          max_miembros: number | null
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          avatar_url?: string | null
          codigo_invitacion?: string | null
          creador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          max_miembros?: number | null
          nombre: string
        }
        Update: {
          activo?: boolean | null
          avatar_url?: string | null
          codigo_invitacion?: string | null
          creador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          max_miembros?: number | null
          nombre?: string
        }
        Relationships: []
      }
      historial_xp: {
        Row: {
          cantidad: number
          created_at: string | null
          grupo_id: string | null
          id: string
          motivo: string
          referencia_id: string | null
          usuario_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          grupo_id?: string | null
          id?: string
          motivo: string
          referencia_id?: string | null
          usuario_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          grupo_id?: string | null
          id?: string
          motivo?: string
          referencia_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_xp_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      invitaciones_grupo: {
        Row: {
          codigo: string | null
          created_at: string | null
          estado: string | null
          expira_en: string | null
          grupo_id: string | null
          id: string
          invitado_por: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          estado?: string | null
          expira_en?: string | null
          grupo_id?: string | null
          id?: string
          invitado_por?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          estado?: string | null
          expira_en?: string | null
          grupo_id?: string | null
          id?: string
          invitado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_grupo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros_grupo: {
        Row: {
          grupo_id: string | null
          id: string
          max_streak: number
          nivel: number
          rol: string | null
          unido_en: string | null
          usuario_id: string | null
          xp: number
        }
        Insert: {
          grupo_id?: string | null
          id?: string
          max_streak?: number
          nivel?: number
          rol?: string | null
          unido_en?: string | null
          usuario_id?: string | null
          xp?: number
        }
        Update: {
          grupo_id?: string | null
          id?: string
          max_streak?: number
          nivel?: number
          rol?: string | null
          unido_en?: string | null
          usuario_id?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "miembros_grupo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      penalizaciones: {
        Row: {
          estado: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento: string
          grupo_id: string | null
          id: number
          monto: number
          monto_pagado: number
          usuario_id: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento: string
          grupo_id?: string | null
          id?: number
          monto: number
          monto_pagado?: number
          usuario_id: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["penalizacion_estado"]
          fecha_incumplimiento?: string
          grupo_id?: string | null
          id?: number
          monto?: number
          monto_pagado?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalizaciones_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
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
          grupo_activo_id: string | null
          id: string
          max_streak: number
          nivel: number | null
          nombre_usuario: string
          rol: string
          xp: number | null
        }
        Insert: {
          creado_en?: string
          grupo_activo_id?: string | null
          id: string
          max_streak?: number
          nivel?: number | null
          nombre_usuario: string
          rol?: string
          xp?: number | null
        }
        Update: {
          creado_en?: string
          grupo_activo_id?: string | null
          id?: string
          max_streak?: number
          nivel?: number | null
          nombre_usuario?: string
          rol?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_grupo_activo_id_fkey"
            columns: ["grupo_activo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_lectura: {
        Row: {
          estado: Database["public"]["Enums"]["plan_estado"]
          fecha_fin: string
          fecha_inicio: string
          grupo_id: string
          id: number
          minutos_oracion_requeridos: number
          nombre_libro: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["plan_estado"]
          fecha_fin: string
          fecha_inicio: string
          grupo_id: string
          id?: number
          minutos_oracion_requeridos: number
          nombre_libro: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["plan_estado"]
          fecha_fin?: string
          fecha_inicio?: string
          grupo_id?: string
          id?: number
          minutos_oracion_requeridos?: number
          nombre_libro?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_lectura_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
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
      recuperaciones_racha: {
        Row: {
          costo: number | null
          costo_puntos: number | null
          created_at: string | null
          id: string
          metodo: string
          racha_recuperada: number
          usuario_id: string
        }
        Insert: {
          costo?: number | null
          costo_puntos?: number | null
          created_at?: string | null
          id?: string
          metodo: string
          racha_recuperada: number
          usuario_id: string
        }
        Update: {
          costo?: number | null
          costo_puntos?: number | null
          created_at?: string | null
          id?: string
          metodo?: string
          racha_recuperada?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recuperaciones_racha_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reto_participantes: {
        Row: {
          completado: boolean | null
          completado_en: string | null
          created_at: string | null
          estado: string | null
          id: string
          progreso: number | null
          reto_id: string | null
          usuario_id: string | null
          xp_propuesto: number | null
        }
        Insert: {
          completado?: boolean | null
          completado_en?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          progreso?: number | null
          reto_id?: string | null
          usuario_id?: string | null
          xp_propuesto?: number | null
        }
        Update: {
          completado?: boolean | null
          completado_en?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          progreso?: number | null
          reto_id?: string | null
          usuario_id?: string | null
          xp_propuesto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reto_participantes_reto_id_fkey"
            columns: ["reto_id"]
            isOneToOne: false
            referencedRelation: "retos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reto_participantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retos: {
        Row: {
          completado: boolean | null
          creador_id: string | null
          created_at: string | null
          criterio: Json
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          penalizacion_monto: number | null
          recompensa_xp: number | null
          tipo: string
          titulo: string
          xp_negociado: boolean | null
        }
        Insert: {
          completado?: boolean | null
          creador_id?: string | null
          created_at?: string | null
          criterio: Json
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio?: string
          id?: string
          penalizacion_monto?: number | null
          recompensa_xp?: number | null
          tipo: string
          titulo: string
          xp_negociado?: boolean | null
        }
        Update: {
          completado?: boolean | null
          creador_id?: string | null
          created_at?: string | null
          criterio?: Json
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          penalizacion_monto?: number | null
          recompensa_xp?: number | null
          tipo?: string
          titulo?: string
          xp_negociado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "retos_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_push: {
        Row: {
          creado_en: string
          id: string
          subscription: Json
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          subscription: Json
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          subscription?: Json
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_push_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_badges: {
        Row: {
          badge_id: string
          desbloqueado_en: string | null
          usuario_id: string
        }
        Insert: {
          badge_id: string
          desbloqueado_en?: string | null
          usuario_id: string
        }
        Update: {
          badge_id?: string
          desbloqueado_en?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_badges_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_presets: {
        Row: {
          config: Json
          descripcion: string
          id: string
        }
        Insert: {
          config: Json
          descripcion: string
          id: string
        }
        Update: {
          config?: Json
          descripcion?: string
          id?: string
        }
        Relationships: []
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
      calcular_nivel: { Args: { p_xp: number }; Returns: number }
      canjear_puntos:
        | {
            Args: {
              p_puntos: number
              p_tasa_canjeo?: number
              p_usuario_id: string
            }
            Returns: {
              monto_descontado: number
              xp_restante: number
            }[]
          }
        | {
            Args: {
              p_grupo_id?: string
              p_puntos: number
              p_tasa_canjeo?: number
              p_usuario_id: string
            }
            Returns: {
              monto_descontado: number
              xp_restante: number
            }[]
          }
      crear_plan_con_capitulos:
        | {
            Args: {
              capitulos_param: Json
              fecha_fin_param: string
              fecha_inicio_param: string
              minutos_oracion_requeridos_param: number
              nombre_libro_param: string
            }
            Returns: undefined
          }
        | {
            Args: {
              capitulos_param: Json
              fecha_fin_param: string
              fecha_inicio_param: string
              grupo_id_param: string
              minutos_oracion_requeridos_param: number
              nombre_libro_param: string
            }
            Returns: undefined
          }
      get_all_push_subscriptions: {
        Args: never
        Returns: {
          subscription: Json
          usuario_id: string
        }[]
      }
      get_all_user_streaks: {
        Args: never
        Returns: {
          streak_count: number
          user_id: string
        }[]
      }
      nanoid: { Args: { size?: number }; Returns: string }
      otorgar_xp:
        | {
            Args: {
              p_cantidad: number
              p_motivo?: string
              p_referencia_id?: string
              p_usuario_id: string
            }
            Returns: {
              nuevo_nivel: number
              nuevo_xp: number
              subio_nivel: boolean
            }[]
          }
        | {
            Args: {
              p_cantidad: number
              p_grupo_id?: string
              p_motivo?: string
              p_referencia_id?: string
              p_usuario_id: string
            }
            Returns: {
              nuevo_nivel: number
              nuevo_xp: number
              subio_nivel: boolean
            }[]
          }
        | {
            Args: {
              p_cantidad: number
              p_motivo?: string
              p_usuario_id: string
            }
            Returns: {
              nuevo_nivel: number
              nuevo_xp: number
              subio_nivel: boolean
            }[]
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
      tipo_actividad: "lectura_completada" | "oracion_completada" | "victoria"
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
      tipo_actividad: ["lectura_completada", "oracion_completada", "victoria"],
    },
  },
} as const
