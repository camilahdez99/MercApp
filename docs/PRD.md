# PRD — MercApp

> Versión 2 (2026-10-15). Ajustada al documento de requerimientos del profesor
> ("Requerimientos - Desarrollo de una APP") y a las decisiones de la semana 2.
> Los números `[Px]` remiten a la sección del documento del profesor.

## 1. Resumen
MercApp es una app móvil que le ayuda a una familia a registrar, comparar y optimizar los precios de la canasta familiar entre las tiendas donde compra, usando IA para leer precios desde una foto.

## 2. Problema
Los precios de un mismo producto varían fuerte entre supermercado, tienda de barrio y minimercado. Comparar hoy es manual (ir a varios lugares, recordar precios) y las presentaciones distintas (500 g vs 1 kg) esconden cuál opción es realmente más barata. Registrar precios a mano es lento, así que la gente deja de hacerlo y compra todo en un solo sitio por comodidad.

## 3. Usuarios y caso de uso
- **Usuario principal:** cabeza de familia que hace el mercado y quiere gastar menos sin perder tiempo comparando.
- **Usuario secundario:** otro miembro del hogar que colabora en la lista de mercado compartida.
- **Caso de uso central:** el usuario registra tiendas de su zona → registra precios (manual o foto) → arma una lista de mercado con lo que necesita ("arroz 2 kg", "leche 3 und") → la app le dice dónde comprar cada cosa, qué presentación conviene y cuánto ahorra.

## 4. Objetivo del producto
Que una familia reduzca su gasto mensual en mercado al tomar decisiones de compra basadas en datos reales de precio, con el mínimo esfuerzo de registro posible (foto en vez de digitar).

## 5. Métricas de éxito (para el piloto académico)
- % de acierto de la lectura de precios por IA ≥ 80% (campo por campo: nombre, marca, presentación, precio).
- Ahorro promedio mostrado en la lista optimizada vs. comprar todo en la tienda de referencia (§6).
- Al menos 5 tiendas y 50 productos reales cargados antes del piloto.
- Usuarios del piloto completan el flujo "agregar producto → comparar → generar lista" sin ayuda.

## 6. Decisiones de modelo (tomadas en la semana 2)
- **Hogares:** un usuario puede pertenecer a **varios hogares** y elige con cuál trabaja (selector de hogar). Todos los datos (tiendas, catálogo, listas, compras) pertenecen a un hogar.
- **Catálogo por hogar:** cada hogar tiene su propio catálogo de productos; no se comparte nada entre hogares. Las **categorías** sí son una lista fija global (solo lectura).
- **Grupos de equivalencia:** todo producto pertenece a un grupo (p. ej. "Arroz blanco") que reúne marcas y presentaciones intercambiables. El grupo es la base de la comparación por precio unitario, de la lista de mercado y de la sustitución.
- **Lista de mercado por necesidad genérica:** el usuario agrega "Arroz blanco – 2 kg", no un producto exacto. El optimizador elige marca/presentación/tienda. Opcionalmente puede fijar un producto preferido.
- **Unidades:** g, kg, ml, l, und (no se agrega libra). Para "und" el precio unitario se divide por la cantidad del empaque (huevos x30 → precio por huevo).
- **Compras:** al cerrar una lista se registra la compra (tabla `compras` + `compra_items`), fuente de las estadísticas y del ahorro acumulado.
- **Presupuesto:** cada hogar puede definir un presupuesto mensual; la app avisa si la lista lo supera.
- **Ahorro (D-1):** se mide contra la **tienda de referencia** del hogar = donde más ha comprado en los últimos 90 días (según `compras`); si aún no hay compras, la tienda favorita activa con más precios de los ítems de la lista; si no hay favorita, el promedio de los totales de "una sola tienda". Ahorro = costo en la tienda de referencia − costo del escenario elegido, contando **solo los ítems que tienen precio en ambos lados** (nunca se infla con precios inventados). Se descartó usar "la tienda más cara" porque exagera el ahorro y no resiste una revisión académica.
- **"Precio anterior":** es el último precio **distinto** al actual; registrar el mismo precio otra vez no cambia la variación.

## 7. Alcance — MVP (prioridad 1)
1. **Usuarios y hogares** [P15.1]: registro/login, crear hogar, pertenecer a varios hogares, invitar miembro por código de 6 caracteres, selector de hogar activo.
2. **Tiendas** [P3]: crear, editar, eliminar, marcar favorita, activar/desactivar temporalmente, ubicación básica (dirección y coordenadas). Las consultas, comparaciones y optimizaciones usan **solo tiendas activas**.
3. **Productos y categorías** [P15.3]: catálogo del hogar con nombre, marca, categoría, grupo de equivalencia, cantidad y unidad.
4. **Registro de precios** [P15.4]: manual y por foto con IA [P2]. La IA intenta identificar nombre, marca, presentación/cantidad, precio, precio por unidad (si la etiqueta lo trae) y el establecimiento (si aparece en la foto); la fecha es la de captura. **Siempre** hay confirmación/corrección del usuario antes de guardar. Se guarda lo que leyó la IA y lo que confirmó el usuario para medir el % de acierto.
5. **Comparador** [P4, P12]: precio de un producto entre tiendas activas, ordenado de menor a mayor, con marca, presentación, precio por unidad de medida normalizado (por kg, por l o por unidad), fecha de última actualización, promoción vigente y variación frente al registro anterior. Además, vista por **grupo** que compara presentaciones distintas (500 g a $5.000 vs 1 kg a $8.500) por precio unitario.
6. **Historial de precios** [P8]: actual, anterior, mínimo, máximo, promedio, fecha del último cambio y variación %, con gráfica en el tiempo.
7. **Lista de mercado optimizada** [P5, P6]: necesidades con cantidad opcional; el optimizador muestra **los dos escenarios** para compararlos: (a) todo en una sola tienda (la de menor costo total) y (b) repartido en varias tiendas (menor costo por ítem, con opción de limitar a N tiendas). Lista agrupada por tienda, subtotales, total y ahorro.

## 8. Alcance — Complementario (prioridad 2)
8. **Promociones** [P7]: registro y consulta manual (tipos: % de descuento, precio fijo, N por $X, 2x1), aviso cuando un producto de la lista tiene promo vigente y cálculo de si realmente ahorra frente al precio normal y frente a otras tiendas.
9. **Alertas** [P9]: precio mínimo histórico, bajada de precio, subida fuerte, promo nueva, promo por vencer, producto más barato en otra tienda. El usuario elige cuáles recibir.
10. **Lista compartida** [P10]: Realtime entre miembros del hogar, estados por ítem (pendiente, comprado, no disponible, sustituido).
11. **Sustitución de productos** [P11]: sugerir otra marca/presentación del mismo grupo cuando el producto no está disponible o está caro ("cuesta $8.500, hay una equivalente por $6.900").
12. **Exportar, imprimir y compartir** [P13]: lista con producto, cantidad, tienda recomendada, precio, promoción, subtotal por tienda, total y ahorro; visualización en el celular, impresión, PDF y compartir (WhatsApp/correo/otros).
13. **Estadísticas** [P14]: gasto mensual, productos más comprados, tiendas donde más compra, ahorro generado, productos que más subieron de precio, promociones aprovechadas, evolución del gasto.
14. **Presupuesto mensual** [P17]: presupuesto por hogar, gasto del mes vs. presupuesto y aviso si el total estimado de la lista lo supera.

## 9. Trazabilidad con los módulos del profesor [P15]
| # | Módulo del profesor | Dónde queda en MercApp |
| --- | --- | --- |
| 1 | Gestión de usuarios | Alcance 1 |
| 2 | Gestión de tiendas y supermercados | Alcance 2 |
| 3 | Gestión de productos y categorías | Alcance 3 |
| 4 | Registro y actualización de precios | Alcance 4 |
| 5 | Reconocimiento de imágenes mediante IA | Alcance 4 (Edge Function `leer-etiqueta`) |
| 6 | Base de datos histórica de precios | Tabla `precios` (solo inserts) + Alcance 6 |
| 7 | Comparador de precios | Alcance 5 |
| 8 | Gestión de promociones | Alcance 8 |
| 9 | Generador inteligente de listas de mercado | Alcance 7 |
| 10 | Algoritmo de optimización de compras | Edge Function `optimizar-lista` (Alcance 7) |
| 11 | Sistema de notificaciones y alertas | Alcance 9 |
| 12 | Historial y estadísticas | Alcance 6 y 13 |
| 13 | Generación de reportes y listas imprimibles | Alcance 12 |

## 10. Fuera de alcance (explícito)
- Conexión directa o scraping a sistemas de supermercados.
- Compras, pagos o domicilios dentro de la app.
- Publicación en tiendas de apps (se entrega APK + código fuente).
- Reconocimiento de promociones por foto (el profesor lo plantea como "evolución del proyecto"; queda como mejora futura).
- Garantía de 100% de acierto de la IA — siempre hay confirmación humana.
- Funcionamiento offline.

## 11. Historias de usuario clave
- Como usuario, quiero tomar una foto de una etiqueta para no tener que escribir el precio a mano.
- Como usuario, quiero ver en qué tienda está más barato un producto antes de ir a comprarlo.
- Como usuario, quiero saber si me conviene más el paquete de 500 g o el de 1 kg comparando el precio por kilo.
- Como usuario, quiero anotar "arroz 2 kg" y que la app me diga qué marca, presentación y tienda me salen más baratas.
- Como usuario, quiero comparar cuánto pagaría comprando todo en una tienda frente a repartir la compra.
- Como usuario, quiero que me avisen cuando un producto que compro seguido baje de precio.
- Como usuario, quiero compartir la lista de mercado con otro miembro de mi familia y ver en tiempo real qué ya se compró.
- Como usuario, quiero definir cuánto puedo gastar al mes y que la app me avise si me paso.

## 12. Riesgos de producto
| Riesgo | Mitigación |
| --- | --- |
| La IA lee mal una etiqueta borrosa | Confirmación obligatoria antes de guardar; medir % de acierto en la semana de IA |
| Pocas tiendas/productos cargados → poca utilidad en el piloto | Cargar manualmente 5 tiendas y ~50 productos antes de probar con usuarios |
| Usuario no entiende "optimizar en varias tiendas" | Mostrar siempre los dos escenarios lado a lado, primero el de una sola tienda |
| Grupos de equivalencia mal armados (mezclar productos no comparables) | El grupo fija el tipo de medida (peso/volumen/unidad) y la BD rechaza unidades incompatibles |

## 13. Decisiones cerradas en la semana 2
- **D-1 — Base del "ahorro":** tienda de referencia (ver §6).
- **D-2 — Semanas de los complementarios sin fecha:** sustitución → semana 5; exportar/imprimir/compartir → semana 6; presupuesto y estadísticas → semana 7. Cronograma de la FTG actualizado (ver IMPLEMENTATION_PLAN).
