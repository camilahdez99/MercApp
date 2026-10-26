import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { useAuth } from '@/providers/AuthProvider';

// Encabezado global: nombre del hogar activo con chevron → selector de hogar.
export function EncabezadoHogar({ titulo }: { titulo: string }) {
  const { hogarActivo } = useAuth();
  const router = useRouter();

  return (
    <View className="mb-4 mt-2 flex-row items-center justify-between">
      <View>
        <Text className="text-[22px] font-bold text-primary-dark">{titulo}</Text>
        <Pressable
          onPress={() => router.push('/selector-hogar')}
          className="mt-0.5 flex-row items-center gap-1 active:opacity-70"
        >
          <Ionicons name="home" size={13} color={colors.inkMuted} />
          <Text className="text-sm text-ink-muted">{hogarActivo?.nombre ?? 'Sin hogar'}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}
