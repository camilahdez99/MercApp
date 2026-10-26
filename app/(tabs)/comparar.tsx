import { EncabezadoHogar } from '@/components/EncabezadoHogar';
import { EstadoVacio, Screen } from '@/components/ui';

export default function Comparar() {
  return (
    <Screen>
      <EncabezadoHogar titulo="Comparar" />
      <EstadoVacio
        emoji="🔍"
        titulo="Aún no hay nada que comparar"
        descripcion="Cuando registres precios de tus productos, aquí podrás ver dónde está más barato cada uno. (Semana 5)"
      />
    </Screen>
  );
}
