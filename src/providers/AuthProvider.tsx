// Estado global de sesión y hogares. Decide a qué grupo de pantallas entra el
// usuario: (auth) si no hay sesión, (onboarding) si no tiene hogar, (tabs) si sí.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Hogar, Perfil } from '@/types/database.types';

type HogarConRol = Hogar & { rol: 'admin' | 'miembro' };

type AuthState = {
  cargando: boolean;
  session: Session | null;
  perfil: Perfil | null;
  hogares: HogarConRol[];
  hogarActivo: HogarConRol | null;
  refrescar: () => Promise<void>;
  cambiarHogar: (hogarId: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [hogares, setHogares] = useState<HogarConRol[]>([]);

  const cargarDatos = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setPerfil(null);
      setHogares([]);
      return;
    }
    try {
      const [{ data: perfilData }, { data: miembros }] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('hogar_miembros')
          .select('rol, hogares(*)')
          .eq('usuario_id', userId)
          .returns<{ rol: 'admin' | 'miembro'; hogares: Hogar | null }[]>(),
      ]);

      setPerfil(perfilData ?? null);
      const lista: HogarConRol[] = (miembros ?? [])
        .filter((m): m is { rol: 'admin' | 'miembro'; hogares: Hogar } => m.hogares !== null)
        .map((m) => ({ ...m.hogares, rol: m.rol }));
      setHogares(lista);
    } catch {
      // Si falla (p. ej. rate limit), no dejamos la app colgada.
      setPerfil(null);
      setHogares([]);
    }
  }, []);

  const refrescar = useCallback(async () => {
    // Si getSession tarda demasiado (red lenta / rate limit), no bloqueamos la
    // carga inicial: seguimos sin sesión y la app muestra el login.
    const conTimeout = Promise.race([
      supabase.auth.getSession().then((r) => r.data.session),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]).catch(() => null);

    const sesion = await conTimeout;
    setSession(sesion);
    await cargarDatos(sesion?.user.id);
  }, [cargarDatos]);

  useEffect(() => {
    // 1) sesión guardada al abrir
    refrescar().finally(() => setCargando(false));

    // 2) cambios de sesión (login, logout, refresh de token)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
      cargarDatos(nuevaSesion?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [refrescar, cargarDatos]);

  const cambiarHogar = useCallback(
    async (hogarId: string) => {
      if (!session) return;
      const { error } = await supabase
        .from('perfiles')
        .update({ hogar_activo_id: hogarId })
        .eq('id', session.user.id);
      if (error) throw error;
      setPerfil((p) => (p ? { ...p, hogar_activo_id: hogarId } : p));
    },
    [session]
  );

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const hogarActivo = useMemo(() => {
    if (hogares.length === 0) return null;
    const activo = hogares.find((h) => h.id === perfil?.hogar_activo_id);
    return activo ?? hogares[0];
  }, [hogares, perfil?.hogar_activo_id]);

  const value: AuthState = {
    cargando,
    session,
    perfil,
    hogares,
    hogarActivo,
    refrescar,
    cambiarHogar,
    cerrarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
