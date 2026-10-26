// Tipos de la base de datos de MercApp.
//
// Escritos a mano desde docs/BACKEND_SCHEMA.md y scripts/ porque el proyecto
// Supabase estaba pausado al crearlos. Cuando esté activo, regenerar con:
//   npm run db:types      (supabase gen types typescript --project-id ...)
// y reemplazar este archivo.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Unidad = 'g' | 'kg' | 'ml' | 'l' | 'und';
export type TipoMedida = 'peso' | 'volumen' | 'unidad';
export type RolMiembro = 'admin' | 'miembro';

export interface Database {
  public: {
    Tables: {
      hogares: {
        Row: {
          id: string;
          nombre: string;
          presupuesto_mensual: number | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          presupuesto_mensual?: number | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          presupuesto_mensual?: number | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          push_token: string | null;
          hogar_activo_id: string | null;
          creado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          push_token?: string | null;
          hogar_activo_id?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          push_token?: string | null;
          hogar_activo_id?: string | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      hogar_miembros: {
        Row: {
          hogar_id: string;
          usuario_id: string;
          rol: RolMiembro;
          unido_en: string;
        };
        Insert: {
          hogar_id: string;
          usuario_id: string;
          rol?: RolMiembro;
          unido_en?: string;
        };
        Update: {
          hogar_id?: string;
          usuario_id?: string;
          rol?: RolMiembro;
          unido_en?: string;
        };
        Relationships: [];
      };
      categorias: {
        Row: { id: string; nombre: string };
        Insert: { id?: string; nombre: string };
        Update: { id?: string; nombre?: string };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      crear_hogar: {
        Args: { p_nombre: string };
        Returns: string;
      };
      generar_invitacion: {
        Args: { p_hogar: string };
        Returns: string;
      };
      unirse_hogar: {
        Args: { p_codigo: string };
        Returns: string;
      };
      es_miembro: {
        Args: { p_hogar: string };
        Returns: boolean;
      };
      es_admin: {
        Args: { p_hogar: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Atajos útiles
export type Hogar = Database['public']['Tables']['hogares']['Row'];
export type Perfil = Database['public']['Tables']['perfiles']['Row'];
export type HogarMiembro = Database['public']['Tables']['hogar_miembros']['Row'];
export type Categoria = Database['public']['Tables']['categorias']['Row'];
