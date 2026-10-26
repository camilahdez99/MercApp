import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function registrar() {
    setError(null);
    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (!email.trim()) return setError('Escribe tu correo.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // fn_nuevo_usuario() usa raw_user_meta_data->>'nombre' para el perfil.
      options: { data: { nombre: nombre.trim() } },
    });
    setCargando(false);

    if (error) return setError(error.message);

    // Si el proyecto pide confirmar el correo, no hay sesión todavía.
    if (!data.session) {
      Alert.alert(
        'Revisa tu correo',
        'Te enviamos un enlace para confirmar tu cuenta. Confírmalo y vuelve a entrar.',
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    // Si hay sesión (confirmación desactivada), el <Gate> redirige a onboarding.
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
