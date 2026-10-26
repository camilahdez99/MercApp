// Tipos de la base de datos de MercApp.
// GENERADO con `npm run db:types` (supabase gen types) contra el proyecto
// dglxvtxsmqzrotumdwan. No editar a mano: regenerar tras cambios de esquema.
// Los atajos de la app (Hogar, Perfil, Unidad, ...) están al final del archivo.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alertas_config: {
        Row: {
          activa: boolean
          tipo: string
          umbral_pct: number | null
          usuario_id: string
        }
        Insert: {
          activa?: boolean
          tipo: string
          umbral_pct?: number | null
          usuario_id: string
        }
        Update: {
          activa?: boolean
          tipo?: string
          umbral_pct?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_config_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      compra_items: {
        Row: {
          compra_id: string
          id: string
          precio_unitario: number
          producto_id: string
          promocion_id: string | null
          subtotal: number
          unidades: number
        }
        Insert: {
          compra_id: string
          id?: string
          precio_unitario: number
          producto_id: string
          promocion_id?: string | null
          subtotal: number
          unidades: number
        }
        Update: {
          compra_id?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          promocion_id?: string | null
          subtotal?: number
          unidades?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "v_promociones_vigentes"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          ahorro: number
          fecha: string
          hogar_id: string
          id: string
          lista_id: string | null
          registrada_por: string
          tienda_id: string | null
          total: number
        }
        Insert: {
          ahorro?: number
          fecha?: string
          hogar_id: string
          id?: string
          lista_id?: string | null
          registrada_por?: string
          tienda_id?: string | null
          total: number
        }
        Update: {
          ahorro?: number
          fecha?: string
          hogar_id?: string
          id?: string
          lista_id?: string | null
          registrada_por?: string
          tienda_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_registrada_por_fkey"
            columns: ["registrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_equivalencia: {
        Row: {
          categoria_id: string | null
          creado_en: string
          hogar_id: string
          id: string
          nombre: string
          tipo_medida: string
        }
        Insert: {
          categoria_id?: string | null
          creado_en?: string
          hogar_id: string
          id?: string
          nombre: string
          tipo_medida: string
        }
        Update: {
          categoria_id?: string | null
          creado_en?: string
          hogar_id?: string
          id?: string
          nombre?: string
          tipo_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_equivalencia_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_equivalencia_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      hogar_miembros: {
        Row: {
          hogar_id: string
          rol: string
          unido_en: string
          usuario_id: string
        }
        Insert: {
          hogar_id: string
          rol?: string
          unido_en?: string
          usuario_id: string
        }
        Update: {
          hogar_id?: string
          rol?: string
          unido_en?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hogar_miembros_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hogar_miembros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hogares: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          presupuesto_mensual: number | null
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          presupuesto_mensual?: number | null
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          presupuesto_mensual?: number | null
        }
        Relationships: []
      }
      invitaciones: {
        Row: {
          codigo: string
          creado_por: string
          expira_en: string
          hogar_id: string
        }
        Insert: {
          codigo: string
          creado_por: string
          expira_en?: string
          hogar_id: string
        }
        Update: {
          codigo?: string
          creado_por?: string
          expira_en?: string
          hogar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_items: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          cantidad: number
          estado: string
          grupo_id: string
          id: string
          lista_id: string
          precio_estimado: number | null
          producto_asignado_id: string | null
          producto_preferido_id: string | null
          promocion_id: string | null
          sustituto_id: string | null
          tienda_asignada_id: string | null
          unidad: string | null
          unidades_a_comprar: number | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          cantidad?: number
          estado?: string
          grupo_id: string
          id?: string
          lista_id: string
          precio_estimado?: number | null
          producto_asignado_id?: string | null
          producto_preferido_id?: string | null
          promocion_id?: string | null
          sustituto_id?: string | null
          tienda_asignada_id?: string | null
          unidad?: string | null
          unidades_a_comprar?: number | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          cantidad?: number
          estado?: string
          grupo_id?: string
          id?: string
          lista_id?: string
          precio_estimado?: number | null
          producto_asignado_id?: string | null
          producto_preferido_id?: string | null
          promocion_id?: string | null
          sustituto_id?: string | null
          tienda_asignada_id?: string | null
          unidad?: string | null
          unidades_a_comprar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_items_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_equivalencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_producto_asignado_id_fkey"
            columns: ["producto_asignado_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_producto_preferido_id_fkey"
            columns: ["producto_preferido_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "v_promociones_vigentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_sustituto_id_fkey"
            columns: ["sustituto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_items_tienda_asignada_id_fkey"
            columns: ["tienda_asignada_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      listas: {
        Row: {
          creada_en: string
          creada_por: string
          estado: string
          estrategia: string | null
          hogar_id: string
          id: string
          nombre: string
        }
        Insert: {
          creada_en?: string
          creada_por?: string
          estado?: string
          estrategia?: string | null
          hogar_id: string
          id?: string
          nombre?: string
        }
        Update: {
          creada_en?: string
          creada_por?: string
          estado?: string
          estrategia?: string | null
          hogar_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          fecha: string
          id: string
          leida: boolean
          mensaje: string
          producto_id: string | null
          promocion_id: string | null
          tipo: string
          usuario_id: string
        }
        Insert: {
          fecha?: string
          id?: string
          leida?: boolean
          mensaje: string
          producto_id?: string | null
          promocion_id?: string | null
          tipo: string
          usuario_id: string
        }
        Update: {
          fecha?: string
          id?: string
          leida?: boolean
          mensaje?: string
          producto_id?: string | null
          promocion_id?: string | null
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "v_promociones_vigentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
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
          hogar_activo_id: string | null
          id: string
          nombre: string
          push_token: string | null
        }
        Insert: {
          creado_en?: string
          hogar_activo_id?: string | null
          id: string
          nombre: string
          push_token?: string | null
        }
        Update: {
          creado_en?: string
          hogar_activo_id?: string | null
          id?: string
          nombre?: string
          push_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_hogar_activo_id_fkey"
            columns: ["hogar_activo_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      precios: {
        Row: {
          confianza_ia: Json | null
          fecha: string
          foto_path: string | null
          id: string
          lectura_ia: Json | null
          origen: string
          producto_id: string
          registrado_por: string
          tienda_id: string
          valor: number
        }
        Insert: {
          confianza_ia?: Json | null
          fecha?: string
          foto_path?: string | null
          id?: string
          lectura_ia?: Json | null
          origen: string
          producto_id: string
          registrado_por?: string
          tienda_id: string
          valor: number
        }
        Update: {
          confianza_ia?: Json | null
          fecha?: string
          foto_path?: string | null
          id?: string
          lectura_ia?: Json | null
          origen?: string
          producto_id?: string
          registrado_por?: string
          tienda_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          cantidad: number
          codigo_barras: string | null
          creado_en: string
          grupo_id: string
          hogar_id: string
          id: string
          marca: string | null
          nombre: string
          unidad: string
        }
        Insert: {
          cantidad: number
          codigo_barras?: string | null
          creado_en?: string
          grupo_id: string
          hogar_id: string
          id?: string
          marca?: string | null
          nombre: string
          unidad: string
        }
        Update: {
          cantidad?: number
          codigo_barras?: string | null
          creado_en?: string
          grupo_id?: string
          hogar_id?: string
          id?: string
          marca?: string | null
          nombre?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_equivalencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      promociones: {
        Row: {
          cantidad_requerida: number | null
          creado_por: string
          descripcion: string | null
          fin: string
          id: string
          inicio: string
          producto_id: string
          tienda_id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          cantidad_requerida?: number | null
          creado_por?: string
          descripcion?: string | null
          fin: string
          id?: string
          inicio: string
          producto_id: string
          tienda_id: string
          tipo: string
          valor?: number | null
        }
        Update: {
          cantidad_requerida?: number | null
          creado_por?: string
          descripcion?: string | null
          fin?: string
          id?: string
          inicio?: string
          producto_id?: string
          tienda_id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promociones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tiendas: {
        Row: {
          activa: boolean
          creado_en: string
          direccion: string | null
          favorita: boolean
          hogar_id: string
          id: string
          lat: number | null
          lng: number | null
          nombre: string
          tipo: string
        }
        Insert: {
          activa?: boolean
          creado_en?: string
          direccion?: string | null
          favorita?: boolean
          hogar_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          nombre: string
          tipo?: string
        }
        Update: {
          activa?: boolean
          creado_en?: string
          direccion?: string | null
          favorita?: boolean
          hogar_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiendas_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_estadisticas_mes: {
        Row: {
          ahorro_total: number | null
          gasto_total: number | null
          hogar_id: string | null
          mes: string | null
          num_compras: number | null
          presupuesto_mensual: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      v_historial_resumen: {
        Row: {
          actual: number | null
          anterior: number | null
          fecha_ultimo_cambio: string | null
          maximo: number | null
          minimo: number | null
          producto_id: string | null
          promedio: number | null
          tienda_id: string | null
          ultima_fecha: string | null
          variacion_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_precio_actual: {
        Row: {
          cantidad: number | null
          fecha: string | null
          grupo_id: string | null
          hogar_id: string | null
          origen: string | null
          precio_unidad_base: number | null
          producto_id: string | null
          tienda_id: string | null
          unidad: string | null
          unidad_base: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_equivalencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      v_promociones_vigentes: {
        Row: {
          cantidad_requerida: number | null
          creado_por: string | null
          descripcion: string | null
          fin: string | null
          id: string | null
          inicio: string | null
          producto_id: string | null
          tienda_id: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          cantidad_requerida?: number | null
          creado_por?: string | null
          descripcion?: string | null
          fin?: string | null
          id?: string | null
          inicio?: string | null
          producto_id?: string | null
          tienda_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          cantidad_requerida?: number | null
          creado_por?: string | null
          descripcion?: string | null
          fin?: string | null
          id?: string | null
          inicio?: string | null
          producto_id?: string | null
          tienda_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promociones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      crear_hogar: { Args: { p_nombre: string }; Returns: string }
      es_admin: { Args: { p_hogar: string }; Returns: boolean }
      es_miembro: { Args: { p_hogar: string }; Returns: boolean }
      fn_llamar_enviar_alertas: { Args: { p_body: Json }; Returns: undefined }
      generar_invitacion: { Args: { p_hogar: string }; Returns: string }
      unirse_hogar: { Args: { p_codigo: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// -----------------------------------------------------------------------------
// Atajos de la app (no vienen del generador)
// -----------------------------------------------------------------------------
export type Hogar = Tables<'hogares'>
export type Perfil = Tables<'perfiles'>
export type HogarMiembro = Tables<'hogar_miembros'>
export type Categoria = Tables<'categorias'>

export type Unidad = 'g' | 'kg' | 'ml' | 'l' | 'und'
export type TipoMedida = 'peso' | 'volumen' | 'unidad'
export type RolMiembro = 'admin' | 'miembro'
