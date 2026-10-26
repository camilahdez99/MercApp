import { EncabezadoHogar } from '@/components/EncabezadoHogar';
import { EstadoVacio, Screen } from '@/components/ui';

export default function MiLista() {
  return (
    <Screen>
      <EncabezadoHogar titulo="Mi lista" />
      <EstadoVacio
        emoji="🧺"
        titulo="Tu lista está vacía"
        descripcion="Agrega productos desde el comparador para armar tu lista de mercado y optimizarla. (Semana 5)"
      />
    </Screen>
  );
}
