import { ScrollView, Text, View } from 'react-native';

import { EncabezadoHogar } from '@/components/EncabezadoHogar';
import { Screen } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

export default function Inicio() {
  const { perfil, hogarActivo } = useAuth();

  return (
    <Screen>
      <EncabezadoHogar titulo="Inicio" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        <View className="rounded-2xl bg-primary-tint p-5">
          <Text className="text-sm text-primary-dark">
            Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''} 👋
          </Text>
          <Text className="mt-1 text-lg font-semibold text-primary-dark">
            Bienvenido a {hogarActivo?.nombre}
          </Text>
          <Text className="mt-2 text-sm text-ink">
            Aquí verás tu ahorro del mes y tu presupuesto cuando empieces a registrar precios y
            compras.
          </Text>
        </View>

        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="text-base font-semibold text-ink">Primeros pasos</Text>
          <View className="mt-3 gap-2">
            <Text className="text-sm text-ink-muted">1. Agrega tus tiendas en la pestaña Tiendas.</Text>
            <Text className="text-sm text-ink-muted">2. Registra productos y sus precios.</Text>
            <Text className="text-sm text-ink-muted">3. Arma tu lista y compara dónde sale más barato.</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
