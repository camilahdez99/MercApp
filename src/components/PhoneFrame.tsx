import { Platform, View } from 'react-native';

import { colors } from '@/theme/colors';

// Solo en web: muestra la app dentro de un marco de celular centrado
// (simulador de pantalla). En iOS/Android devuelve la app a pantalla completa.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0B0B0C',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Carcasa (bisel) */}
      <View
        style={{
          width: 390,
          height: 844,
          maxWidth: '100%',
          maxHeight: '100%',
          backgroundColor: '#111114',
          borderRadius: 52,
          padding: 12,
          // RN Web convierte estas props de sombra a box-shadow.
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
        }}
      >
        {/* Pantalla */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: 40,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>

        {/* Notch */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            right: 0,
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <View
            style={{
              width: 150,
              height: 26,
              backgroundColor: '#111114',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          />
        </View>
      </View>
    </View>
  );
}
