import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';

// Tab bar inferior de 5 destinos (Design Brief §5). El botón central de cámara
// se dibuja elevado y en color primary porque es la acción más usada.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="comparar"
        options={{
          title: 'Comparar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="escanear"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              className="h-14 w-14 items-center justify-center rounded-full bg-primary"
              style={{ marginBottom: 16, shadowColor: colors.primaryDark, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}
            >
              <Ionicons name="camera" color="#fff" size={28} />
            </View>
          ),
          tabBarButton: (props) => (
            <Pressable {...(props as ComponentProps<typeof Pressable>)} android_ripple={{ borderless: true }} />
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Mi lista',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tiendas"
        options={{
          title: 'Tiendas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
