import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/providers/ToastProvider';

export default function Registro() {
  const router = useRouter();
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function fallar(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  async function registrar() {
    setError(null);
    if (!nombre.trim()) return fallar('Escribe tu nombre.');
    if (!email.trim()) return fallar('Escribe tu correo.');
    if (password.length < 6) return fallar('La contraseña debe tener al menos 6 caracteres.');

    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // fn_nuevo_usuario() usa raw_user_meta_data->>'nombre' para el perfil.
      options: { data: { nombre: nombre.trim() } },
    });
    setCargando(false);

    if (error) {
      return fallar(
        /already registered|already been/i.test(error.message)
          ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
          : error.message
      );
    }

    // Con confirmación por código: no hay sesión → pedimos el código.
    if (!data.session) {
      toast.success('Te enviamos un código a tu correo.');
      router.replace({ pathname: '/(auth)/confirmar', params: { email: email.trim() } });
      return;
    }
    // Si hay sesión (confirmación desactivada), el <Gate> redirige a onboarding.
    toast.success('¡Cuenta creada! Bienvenido 🎉');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center px-6">
        <View className="mb-6 gap-1">
          <Titulo>Crea tu cuenta</Titulo>
          <Subtitulo>Empieza a comparar precios en tu barrio</Subtitulo>
        </View>

        <View className="gap-4">
          <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
          <Field
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            error={error}
          />
          <Button title="Crear cuenta" onPress={registrar} loading={cargando} />
        </View>

        <View className="mt-10 flex-row justify-center gap-1">
          <Text className="text-sm text-ink-muted">¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login">
            <Text className="text-sm font-semibold text-primary">Entra</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
