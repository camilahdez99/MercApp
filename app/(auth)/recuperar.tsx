import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/providers/ToastProvider';

export default function Recuperar() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setError(null);
    if (!email.trim()) {
      setError('Escribe tu correo.');
      toast.error('Escribe tu correo.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'mercapp://restablecer',
    });
    setCargando(false);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    setEnviado(true);
    toast.success('Te enviamos un enlace a tu correo.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-6 gap-1">
          <Titulo>Recuperar contraseña</Titulo>
          <Subtitulo>Te enviaremos un enlace a tu correo para crear una nueva.</Subtitulo>
        </View>

        {enviado ? (
          <View className="gap-4 rounded-2xl bg-primary-tint p-4">
            <Text className="text-base font-semibold text-primary-dark">¡Listo! 📧</Text>
            <Text className="text-sm text-ink">
              Si existe una cuenta con {email.trim()}, le llegará un enlace para restablecer la
              contraseña.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <Field
              label="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              error={error}
            />
            <Button title="Enviar enlace" onPress={enviar} loading={cargando} />
          </View>
        )}

        <Link href="/(auth)/login" className="mt-10 self-center">
          <Text className="text-sm font-semibold text-primary">Volver a entrar</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
