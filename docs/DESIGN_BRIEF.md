# Design Brief — MercApp

## 1. Personalidad de marca
Cercana, confiable y clara — como un vecino que sabe dónde todo está más barato. Nada corporativo ni frío: tipografía amigable, tarjetas suaves, mucho espacio en blanco. El dinero ahorrado siempre debe ser lo más visible de la pantalla.

## 2. Paleta de color
| Token | Uso | Hex aprox. |
| --- | --- | --- |
| `primary` (verde) | Acciones principales, ahorro, éxito | #1E8E4F |
| `primary-dark` | Textos sobre fondo claro, títulos de marca | #0F5C30 |
| `primary-tint` | Fondos suaves, tarjetas destacadas | #E6F4EC |
| `accent` (naranja/alerta) | Promociones, alertas de subida de precio | #E8872E |
| `ink` | Texto principal | #1A1A1A |
| `ink-muted` | Texto secundario, metadatos (fecha, "hace 2 días") | #6B7280 |
| `surface` | Fondo de tarjetas | #FFFFFF |
| `background` | Fondo general | #F7F8F7 |
| `border` | Bordes sutiles | #E5E7EB |
| `error` | Precio subió fuerte, errores | #D64545 |

Modo oscuro: invertir `background`/`surface` a grises oscuros, mantener `primary` igual (verde funciona bien en ambos).

## 3. Tipografía
- Familia: Inter o la fuente del sistema (San Francisco / Roboto) — sin costo de licencia, legible en números.
- Escala: Título pantalla 22/bold · Título tarjeta 16/semibold · Cuerpo 14/regular · Metadato 12/regular.
- Los precios SIEMPRE en semibold o bold, nunca en regular — son el dato más importante de cada tarjeta.

## 4. Componentes base
- **Tarjeta de tienda:** ícono o iniciales de la tienda (no ilustración genérica, cada tienda es real y distinta), nombre, distancia/dirección, chip "favorita" opcional.
- **Fila de comparación:** nombre de tienda + precio grande a la derecha + chip verde "Mejor precio" en la fila más barata + metadato de fecha abajo.
- **Tarjeta de producto:** nombre, marca/presentación, precio actual, flecha de tendencia (↑/↓) si cambió.
- **Botón de cámara (acción primaria):** flotante o centrado en la tab bar, color `primary`, siempre accesible desde cualquier pantalla principal.
- **Banner de ahorro:** tarjeta destacada en Inicio con el ahorro del mes y % de cambio vs. mes anterior.
- **Chip de estado (lista compartida):** pendiente (gris) · comprado (verde, tachado) · no disponible (rojo) · sustituido (naranja).
- **Formulario de confirmación IA:** cada campo con un indicador sutil (punto o borde) de qué tan segura estuvo la IA; campo editable siempre, nunca de solo lectura. Incluye tienda sugerida y fecha de captura.
- **Selector de hogar:** nombre del hogar activo en el encabezado con un chevron; abre una hoja inferior con los hogares del usuario + "Crear hogar" + "Unirme con código".
- **Fila de comparación por grupo:** marca + presentación + tienda, con el **precio por kg/l/und como dato principal** y el precio del empaque como secundario.
- **Tarjetas de escenario (lista optimizada):** dos tarjetas lado a lado ("Una tienda" / "Varias tiendas") con total grande, ahorro en verde y la ganadora marcada con chip "Más barato".
- **Chip de promoción:** naranja (`accent`) con el texto de la promo ("2 x $15.000"), en comparador, lista y resultado.
- **Barra de presupuesto:** en Inicio, gasto del mes vs. presupuesto; verde hasta 80%, naranja 80–100%, rojo si se pasa.

## 5. Navegación
Tab bar inferior con 5 destinos: Inicio · Comparar · (botón cámara central, elevado) · Mi lista · Tiendas. El botón de cámara se distingue visualmente del resto (círculo lleno en `primary`) porque es la acción más usada.

## 6. Tono de los textos (microcopy)
- Siempre en español neutro/colombiano informal pero claro: "Agrega tu primera tienda", no "Inicie el proceso de registro de establecimiento".
- Mensajes de ahorro en positivo: "Ahorraste $18.000 este mes" en vez de "Gasto reducido".
- Errores de IA sin culpar al usuario: "No pudimos leer bien esta etiqueta, ayúdanos a corregirla" en vez de "Error de reconocimiento".

## 7. Referencia visual
Línea gráfica tipo app de fintech/consumo (tarjetas limpias, verde como color de acción y ahorro, números grandes) — sin ilustraciones 3D de tiendas genéricas, porque cada tienda que aparece es una que el usuario registró él mismo.
