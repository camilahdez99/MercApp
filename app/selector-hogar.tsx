import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function SelectorHogar() {
  const { hogares, hogarActivo, cambiarHogar, cerrarSesion, refrescar } = useAuth();
  const router = useRouter();
  const [modo, setModo] = useState<'lista' | 'crear' | 'unirse'>('lista');
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function seleccionar(id: string) {
    try {
      await cambiarHogar(id);
      router.back();
    } catch (e) {
      Alert.alert('No se pudo cambiar de hogar', (e as Error).message);
    }
  }

  async function invitar(hogarId: string) {
    const { data, error } = await supabase.rpc('generar_invitacion', { p_hogar: hogarId });
    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'No se pudo generar el código.');
      return;
    }
    await Share.share({ message: `Únete a mi hogar en MercApp con el código: ${data}` });
  }

  async function crear() {
    setError(null);
    if (!valor.trim()) return setError('Ponle un nombre al hogar.');
    setCargando(true);
    const { data, error } = await supabase.rpc('crear_hogar', { p_nombre: valor.trim() });
    setCargando(false);
    if (error) return setError(error.message);
    await refrescar();
    if (data) await cambiarHogar(data);
    router.back();
  }

  async function unirse() {
    setError(null);
    if (valor.trim().length < 6) return setError('El código tiene 6 caracteres.');
    setCargando(true);
    const { error } = await supabase.rpc('unirse_hogar', { p_codigo: valor.trim() });
    setCargando(false);
    if (error) {
      return setError(error.message.includes('inválido') ? 'Código inválido o vencido.' : error.message);
    }
    await refrescar();
    router.back();
  }

  return (
    <View className="flex-1 bg-background px-5 pt-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-primary-dark">Mis hogares</Text>
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
      </View>

      {modo === 'lista' && (
        <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {hogares.map((h) => {
            const activo = h.id === hogarActivo?.id;
            return (
              <View
                key={h.id}
                className={`flex-row items-center justify-between rounded-2xl border p-4 ${
                  activo ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                }`}
              >
                <Pressable className="flex-1 active:opacity-70" onPress={() => seleccionar(h.id)}>
                  <Text className="text-base font-semibold text-ink">{h.nombre}</Text>
                  <Text className="text-xs text-ink-muted">
                    {h.rol === 'admin' ? 'Administrador' : 'Miembro'}
                    {activo ? ' · activo' : ''}
                  </Text>
                </Pressable>
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={() => invitar(h.id)} className="active:opacity-70">
                    <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                  </Pressable>
                  {activo ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </View>
              </View>
            );
          })}

          <View className="mt-2 gap-3">
            <Button title="Crear hogar" variant="secondary" onPress={() => { setModo('crear'); setValor(''); setError(null); }} />
            <Button title="Unirme con código" variant="secondary" onPress={() => { setModo('unirse'); setValor(''); setError(null); }} />
            <Pressable onPress={cerrarSesion} className="mt-2 self-center">
              <Text className="text-sm font-medium text-error">Cerrar sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {modo === 'crear' && (
        <View className="gap-4">
          <Field label="Nombre del hogar" value={valor} onChangeText={setValor} placeholder="Casa de los Hernández" error={error} autoFocus />
          <Button title="Crear" onPress={crear} loading={cargando} />
          <Pressable onPress={() => setModo('lista')} className="self-center">
            <Text className="text-sm font-medium text-primary">Volver</Text>
          </Pressable>
        </View>
      )}

      {modo === 'unirse' && (
        <View className="gap-4">
          <Field
            label="Código de invitación"
            value={valor}
            onChangeText={(t) => setValor(t.toUpperCase())}
            placeholder="A1B2C3"
            autoCapitalize="characters"
            maxLength={6}
            error={error}
            autoFocus
          />
          <Button title="Unirme" onPress={unirse} loading={cargando} />
          <Pressable onPress={() => setModo('lista')} className="self-center">
            <Text className="text-sm font-medium text-primary">Volver</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
