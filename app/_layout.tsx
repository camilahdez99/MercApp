import '../global.css';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PhoneFrame } from '@/components/PhoneFrame';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { colors } from '@/theme/colors';

// Lleva al usuario al grupo de pantallas correcto según sesión y hogar.
function Gate() {
  const { cargando, session, hogares } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    const grupo = segments[0];
    const enAuth = grupo === '(auth)';
    const enOnboarding = grupo === '(onboarding)';

    if (!session) {
      if (!enAuth) router.replace('/(auth)/login');
    } else if (hogares.length === 0) {
      if (!enOnboarding) router.replace('/(onboarding)/hogar');
    } else if (enAuth || enOnboarding) {
      router.replace('/(tabs)');
    }
  }, [cargando, session, hogares.length, segments, router]);

  if (cargando) {
    return <Cargando />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="selector-hogar" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function Cargando() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function RootLayout() {
  // Precargar la fuente de iconos (Ionicons): sin esto salen cuadros vacíos.
  const [fuentesListas] = useFonts(Ionicons.font);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PhoneFrame>
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              {fuentesListas ? <Gate /> : <Cargando />}
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </PhoneFrame>
    </GestureHandlerRootView>
  );
}
