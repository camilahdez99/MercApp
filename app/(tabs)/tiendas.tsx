import { EncabezadoHogar } from '@/components/EncabezadoHogar';
import { Button, EstadoVacio, Screen } from '@/components/ui';

export default function Tiendas() {
  return (
    <Screen>
      <EncabezadoHogar titulo="Tiendas" />
      <EstadoVacio
        emoji="🏪"
        titulo="Agrega tu primera tienda"
        descripcion="Registra los supermercados y tiendas de barrio donde haces tu mercado. (Semana 4)"
      >
        <Button title="Agregar tienda" disabled />
      </EstadoVacio>
    </Screen>
  );
}
