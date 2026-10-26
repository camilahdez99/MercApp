# App Flow — MercApp

> Versión 2 (2026-10-15): varios hogares por usuario, lista por necesidad genérica, comparación por grupo, dos escenarios de optimización, cierre de compra y presupuesto.

## 1. Mapa de pantallas
```
Auth
 ├─ Login
 ├─ Registro
 └─ Crear hogar / unirse con código (si el usuario aún no tiene hogar)

Encabezado global (post-login): nombre del hogar activo → selector de hogar

Tabs principales (post-login)
 ├─ Inicio            → resumen, ahorro del mes, gasto vs. presupuesto, accesos rápidos
 ├─ Comparar          → buscador (producto o grupo) + comparador de precios
 ├─ Escanear (botón central) → cámara → confirmación IA → guardado
 ├─ Mi lista          → lista de mercado activa + historial de listas
 └─ Tiendas           → mis establecimientos

Pantallas secundarias (no están en la tab bar)
 ├─ Selector de hogar (cambiar / crear / unirse)
 ├─ Detalle de producto (historial, gráfica, precio por tienda)
 ├─ Comparación por grupo (todas las presentaciones y marcas, por precio unitario)
 ├─ Detalle de tienda (editar, activar/desactivar, productos ahí)
 ├─ Nueva/editar tienda
 ├─ Nuevo/editar producto (incluye elegir o crear grupo de equivalencia)
 ├─ Registrar precio manual
 ├─ Resultado de lista optimizada (escenario una tienda vs. varias tiendas)
 ├─ Terminar compra (resumen de lo comprado → registra la compra)
 ├─ Promociones (listar, crear)
 ├─ Notificaciones / alertas
 ├─ Configurar alertas
 ├─ Estadísticas
 └─ Perfil y hogar (miembros, invitar, presupuesto mensual, salir del hogar)
```

## 2. Flujo: registrar precio por foto (flujo estrella)
1. Usuario toca el botón central de cámara.
2. Toma la foto de la etiqueta, góndola o cartel → se comprime y se sube a Storage (`etiquetas/{hogar_id}/…`).
3. La app llama a `leer-etiqueta` y muestra un loader corto.
4. Se muestra un formulario **prellenado**: nombre, marca, presentación (cantidad + unidad), precio, precio por unidad (calculado, y el de la etiqueta si venía), **tienda sugerida** (por el nombre detectado en la foto, por GPS o la última usada) y **fecha de captura** — cada campo con un indicador de confianza de la IA.
5. Usuario confirma o corrige cada campo (todos editables).
6. Si el producto no existe en el catálogo del hogar, se ofrece crearlo con los datos de la foto y elegir/crear su grupo de equivalencia.
7. Al guardar: se inserta en `precios` con `origen = foto`, la lectura cruda de la IA y las confianzas; se dispara el trigger de alertas.
8. Pantalla de éxito con dos accesos: "Agregar otro" o "Ver comparador de este producto".
9. Si la IA falla: "No pudimos leer bien esta etiqueta, ayúdanos a corregirla" → formulario manual con la foto visible.

## 3. Flujo: registrar precio manual
1. Desde Detalle de producto, Detalle de tienda o el formulario de foto fallida → "Registrar precio".
2. Elige tienda (solo activas), producto y escribe el precio. Fecha = ahora (editable).
3. Se inserta en `precios` con `origen = manual`.

## 4. Flujo: comparar precios
1. Usuario busca por nombre en la tab Comparar; los resultados muestran **grupos** ("Arroz blanco") y **productos** ("Arroz Diana 500 g").
2. **Producto:** lista de tiendas **activas** ordenada de menor a mayor precio, con marca, presentación, precio por unidad (por kg / l / und), fecha de actualización, promo vigente y variación frente al registro anterior.
3. **Grupo:** todas las marcas y presentaciones del grupo en todas las tiendas activas, ordenadas por **precio unitario** — así se ve que 1 kg a $8.500 sale más barato que 500 g a $5.000.
4. Puede tocar "Ver historial" → actual, anterior, mínimo, máximo, promedio, fecha del último cambio, variación % y gráfica.
5. Puede tocar "Agregar a mi lista" → selector de cantidad (y unidad opcional) → se agrega el grupo como necesidad a la lista activa (si venía de un producto, ese queda como producto preferido, quitable).
6. Si el producto está caro o no disponible, se muestra "Hay una equivalente más barata" con la alternativa del mismo grupo (sustitución).

## 5. Flujo: generar lista de mercado optimizada
1. Usuario arma su lista con **necesidades**: "Arroz blanco – 2 kg", "Leche entera – 3 und", "Café" (cantidad opcional; por defecto 1 empaque). Puede fijar un producto preferido por ítem.
2. Toca "Optimizar" en la pantalla "Mi lista" (opcional: limitar a N tiendas).
3. La app llama a `optimizar-lista` y muestra **los dos escenarios lado a lado**:
   - **Una sola tienda:** la tienda con menor costo total.
   - **Varias tiendas:** cada cosa donde sale más barata.
   Cada escenario: ítems agrupados por tienda con marca/presentación elegida y unidades, promo aplicada, subtotales, total y ahorro. Si el total supera lo que queda del presupuesto del mes, se muestra un aviso.
4. Usuario elige un escenario → se asignan producto y tienda a cada ítem.
5. Puede exportar a PDF, imprimir, compartir, o volver a "Mi lista" para ir marcando productos como comprados.

## 6. Flujo: lista compartida y cierre de compra
1. Usuario genera un código de 6 caracteres en Perfil y hogar y se lo pasa a otro miembro.
2. El otro miembro se une con el código → queda en el hogar (puede pertenecer también a otros hogares y cambiar entre ellos).
3. Ambos ven la misma "Mi lista" en tiempo real (Supabase Realtime).
4. Cualquiera marca un ítem como comprado / no disponible / sustituido (al sustituir elige el producto que compró).
5. Al terminar, "Terminar compra" muestra el resumen por tienda (editable si el precio real fue otro) → se registran `compras` y `compra_items` y la lista se cierra.

## 7. Flujo: alertas
1. Usuario configura qué alertas quiere recibir (pantalla "Configurar alertas").
2. Un trigger en `precios` evalúa cada precio nuevo contra esas reglas; un proceso diario revisa promos por vencer.
3. Si aplica, se crea una fila en `notificaciones` y se envía push.
4. Usuario toca la notificación → va directo al detalle del producto o de la promoción.

## 8. Flujo: presupuesto
1. En Perfil y hogar, un miembro define el presupuesto mensual del hogar (opcional).
2. Inicio muestra gasto del mes (de `compras`) vs. presupuesto.
3. El resultado de la lista optimizada avisa si el total estimado supera lo que queda del presupuesto.

## 9. Estados vacíos a diseñar
- Sin hogar → "Crea tu hogar o únete con un código".
- Sin tiendas registradas → CTA grande "Agrega tu primera tienda".
- Sin tiendas activas → "Activa al menos una tienda para comparar".
- Sin precios para un producto buscado → CTA "Sé el primero en registrar el precio".
- Lista de mercado vacía → CTA "Agrega productos desde el comparador".
- Optimización sin datos suficientes → "Faltan precios de: …" con acceso a registrarlos.
