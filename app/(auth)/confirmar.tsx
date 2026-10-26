import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/providers/ToastProvider';

export default function Confirmar() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const toast = useToast();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const correo = (email ?? '').trim();

  async function confirmar() {
    setError(null);
    if (!correo) {
      setError('No encontramos el correo. Vuelve a registrarte.');
      return;
    }
    if (codigo.trim().length !== 6) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.verifyOtp({
      email: correo,
      token: codigo.trim(),
      type: 'signup',
    });
    setCargando(false);
    if (error) {
      const msg = /expired|invalid/i.test(error.message)
        ? 'Código incorrecto o vencido. Pide uno nuevo.'
        : error.message;
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success('¡Cuenta confirmada! Bienvenido a MercApp 🎉');
    // Al confirmar queda la sesión abierta; el <Gate> lleva a crear hogar.
  }

  async function reenviar() {
    if (!correo) return;
    setError(null);
    setReenviando(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: correo });
    setReenviando(false);
    if (error) {
      toast.error(
        /rate/i.test(error.message)
          ? 'Espera un momento antes de pedir otro código.'
          : error.message
      );
      return;
    }
    toast.success('Te enviamos un código nuevo a tu correo.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-6 gap-1">
          <Titulo>Confirma tu correo</Titulo>
          <Subtitulo>
            Te enviamos un código de 6 dígitos{correo ? ` a ${correo}` : ''}. Escríbelo para activar
            tu cuenta.
          </Subtitulo>
        </View>

        <View className="gap-4">
          <Field
            label="Código"
            value={codigo}
            onChangeText={(t) => setCodigo(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            error={error}
            autoFocus
          />
          <Button title="Confirmar" onPress={confirmar} loading={cargando} />
          <Button
            title="Reenviar código"
            variant="ghost"
            onPress={reenviar}
            loading={reenviando}
          />
        </View>

        <View className="mt-10 items-center">
          <Text onPress={() => router.replace('/(auth)/login')} className="text-sm font-semibold text-primary">
            Volver a entrar
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
