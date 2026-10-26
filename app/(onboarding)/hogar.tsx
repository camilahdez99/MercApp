import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type Modo = 'elegir' | 'crear' | 'unirse';

export default function Onboarding() {
  const { perfil, refrescar, cerrarSesion } = useAuth();
  const toast = useToast();
  const [modo, setModo] = useState<Modo>('elegir');
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crearHogar() {
    setError(null);
    if (!valor.trim()) {
      setError('Ponle un nombre a tu hogar.');
      toast.error('Ponle un nombre a tu hogar.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.rpc('crear_hogar', { p_nombre: valor.trim() });
    setCargando(false);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success(`¡Hogar "${valor.trim()}" creado! 🏠`);
    await refrescar(); // el <Gate> ve el hogar nuevo y entra a las tabs
  }

  async function unirse() {
    setError(null);
    if (valor.trim().length < 6) {
      setError('El código tiene 6 caracteres.');
      toast.error('El código tiene 6 caracteres.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.rpc('unirse_hogar', { p_codigo: valor.trim() });
    setCargando(false);
    if (error) {
      const msg = error.message.includes('inválido') ? 'Código inválido o vencido.' : error.message;
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success('¡Te uniste al hogar! 🎉');
    await refrescar();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8 gap-1">
          <Titulo>Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''} 👋</Titulo>
          <Subtitulo>
            Un hogar reúne tus tiendas, precios y listas. Crea el tuyo o únete al de tu familia.
          </Subtitulo>
        </View>

        {modo === 'elegir' && (
          <View className="gap-3">
            <Button title="Crear un hogar nuevo" onPress={() => { setModo('crear'); setValor(''); setError(null); }} />
            <Button
              title="Unirme con un código"
              variant="secondary"
              onPress={() => { setModo('unirse'); setValor(''); setError(null); }}
            />
          </View>
        )}

        {modo === 'crear' && (
          <View className="gap-4">
            <Field
              label="Nombre del hogar"
              value={valor}
              onChangeText={setValor}
              placeholder="Casa de los Hernández"
              error={error}
              autoFocus
            />
            <Button title="Crear hogar" onPress={crearHogar} loading={cargando} />
            <VolverElegir onPress={() => setModo('elegir')} />
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
            <VolverElegir onPress={() => setModo('elegir')} />
          </View>
        )}

        <Pressable onPress={cerrarSesion} className="mt-10 self-center">
          <Text className="text-sm font-medium text-ink-muted">Cerrar sesión</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function VolverElegir({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="self-center">
      <Text className="text-sm font-medium text-primary">Volver</Text>
    </Pressable>
  );
}
