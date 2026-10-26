// Componentes base de MercApp, con los estilos del Design Brief.
import { type ComponentRef, forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type ScreenProps = ViewProps & { scroll?: boolean };

/** Fondo general + área segura. */
export function Screen({ children, className, ...rest }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className={`flex-1 px-5 ${className ?? ''}`} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function Titulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-[22px] font-bold text-primary-dark ${className ?? ''}`}>{children}</Text>;
}

export function Subtitulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-sm text-ink-muted ${className ?? ''}`}>{children}</Text>;
}

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ title, loading, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const base = 'h-12 rounded-2xl items-center justify-center flex-row';
  const styles = {
    primary: 'bg-primary',
    secondary: 'bg-primary-tint',
    ghost: 'bg-transparent',
  }[variant];
  const textStyles = {
    primary: 'text-white',
    secondary: 'text-primary-dark',
    ghost: 'text-primary',
  }[variant];
  const isOff = disabled || loading;
  return (
    <Pressable
      disabled={isOff}
      className={`${base} ${styles} ${isOff ? 'opacity-50' : 'active:opacity-80'}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
      ) : (
        <Text className={`text-base font-semibold ${textStyles}`}>{title}</Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label?: string; error?: string | null };

export const Field = forwardRef<ComponentRef<typeof TextInput>, FieldProps>(function Field(
  { label, error, className, ...rest },
  ref
) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-ink">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkMuted}
        className={`h-12 rounded-2xl border bg-surface px-4 text-base text-ink ${
          error ? 'border-error' : 'border-border'
        } ${className ?? ''}`}
        {...rest}
      />
      {error ? <Text className="text-xs text-error">{error}</Text> : null}
    </View>
  );
});

/** Estado vacío con llamado a la acción (Design Brief / App Flow §9). */
export function EstadoVacio({
  emoji,
  titulo,
  descripcion,
  children,
}: {
  emoji: string;
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text className="text-5xl">{emoji}</Text>
      <Text className="text-center text-lg font-semibold text-ink">{titulo}</Text>
      {descripcion ? (
        <Text className="text-center text-sm text-ink-muted">{descripcion}</Text>
      ) : null}
      {children ? <View className="mt-2 w-full max-w-xs">{children}</View> : null}
    </View>
  );
}
