// Avisos (toasts) en la app: éxito, error o info. Funciona en web y nativo.
// Uso: const toast = useToast(); toast.success('¡Bienvenido!').
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type ToastTipo = 'success' | 'error' | 'info';

type Aviso = { id: number; mensaje: string; tipo: ToastTipo };

type ToastAPI = {
  mostrar: (mensaje: string, tipo?: ToastTipo) => void;
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
};

const ToastContext = createContext<ToastAPI | undefined>(undefined);

const ESTILOS: Record<ToastTipo, { bg: string; icono: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: colors.primary, icono: 'checkmark-circle' },
  error: { bg: colors.error, icono: 'alert-circle' },
  info: { bg: colors.ink, icono: 'information-circle' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ocultar = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
      setAviso(null)
    );
  }, [anim]);

  const mostrar = useCallback(
    (mensaje: string, tipo: ToastTipo = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setAviso({ id: Date.now(), mensaje, tipo });
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(ocultar, 3200);
    },
    [anim, ocultar]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const api: ToastAPI = {
    mostrar,
    success: (m) => mostrar(m, 'success'),
    error: (m) => mostrar(m, 'error'),
    info: (m) => mostrar(m, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {aviso ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingHorizontal: 16,
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            ],
          }}
        >
          <Pressable
            onPress={ocultar}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              maxWidth: 420,
              width: '100%',
              backgroundColor: ESTILOS[aviso.tipo].bg,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
          >
            <Ionicons name={ESTILOS[aviso.tipo].icono} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 }}>
              {aviso.mensaje}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
