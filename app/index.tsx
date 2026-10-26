import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme/colors';

// Pantalla de arranque: el <Gate> de _layout.tsx redirige según sesión/hogar.
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
