import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button, Field, Subtitulo, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setCargando(false);
    if (error) {
      setError(
        error.message.includes('Invalid login')
          ? 'Correo o contraseña incorrectos.'
          : error.message
      );
    }
    // Si entra, el <Gate> redirige solo.
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8 items-center gap-2">
          <Text className="text-4xl">🛒</Text>
          <Titulo>MercApp</Titulo>
          <Subtitulo>Haz tu mercado más barato</Subtitulo>
        </View>

        <View className="gap-4">
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
            autoComplete="password"
            placeholder="••••••••"
            error={error}
          />
          <Button title="Entrar" onPress={entrar} loading={cargando} />

          <Link href="/(auth)/recuperar" className="self-center">
            <Text className="text-sm font-medium text-primary">¿Olvidaste tu contraseña?</Text>
          </Link>
        </View>

        <View className="mt-10 flex-row justify-center gap-1">
          <Text className="text-sm text-ink-muted">¿No tienes cuenta?</Text>
          <Link href="/(auth)/registro">
            <Text className="text-sm font-semibold text-primary">Regístrate</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
