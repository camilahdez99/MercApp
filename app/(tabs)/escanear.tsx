import { EstadoVacio, Screen } from '@/components/ui';

export default function Escanear() {
  return (
    <Screen>
      <EstadoVacio
        emoji="📷"
        titulo="Registrar precio con foto"
        descripcion="Toma una foto de la etiqueta y la IA leerá el producto y el precio por ti. (Semana 6)"
      />
    </Screen>
  );
}
