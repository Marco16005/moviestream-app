# REFLECTION.md — Reflexión: NoSQL vs. Relacional

**TC3005B — Bases de Datos Avanzadas**  
**Proyecto: Migración MovieStream a MongoDB**

---

## Pregunta 1: ¿Qué fue lo más difícil de migrar de un modelo relacional a un modelo documental?

Lo más difícil fue resignificar la normalización como una limitación en lugar de una virtud. En el modelo relacional, descomponer `MOVIES` en tablas separadas de `GENRE`, `ACTORS` y `MOVIE_AWARDS` es correcto: evita redundancia, garantiza integridad referencial y es lo que enseñamos como buena práctica. Al migrar a MongoDB, esa misma práctica se convierte en un problema de rendimiento: cada consulta requeriría un `$lookup` (equivalente al JOIN), lo que anula las ventajas de latencia del modelo documental.

El segundo desafío fue decidir dónde trazar la línea entre embutir y referenciar. Para `feedback` del cliente la decisión es clara: siempre se lee junto con el cliente y tiene un tamaño controlado. Pero para las ventas (`CUSTSALES`, 25M de filas) embutir cada venta dentro del cliente produciría documentos de megabytes, violando el límite de 16MB de BSON y haciendo que cada lectura de cliente cargue un historial completo de compras. La referencia fue obligatoria ahí.

Un tercer punto fue la pérdida de `CHECK CONSTRAINTS` y `FOREIGN KEY`. En Oracle, si intentas insertar una venta con un `movie_id` inexistente, la base de datos lo rechaza. En MongoDB no existe ese mecanismo nativo: la validación es responsabilidad de la aplicación o de las reglas de esquema JSON Schema en el nivel de colección. Eso obliga a ser más disciplinado en la capa de API.

---

## Pregunta 2: ¿Qué ventajas concretas ofrece MongoDB para este dominio?

**a) Esquema flexible para películas heterogéneas:**  
No todas las películas tienen director, premios o reparto. En el modelo relacional, cada campo ausente requiere un `NULL` o una fila con `LEFT JOIN`. En MongoDB, un documento simplemente omite el campo — no hay overhead de almacenamiento ni de consulta por campos inexistentes.

**b) Lectura de perfil de cliente en una sola operación:**  
En Oracle, mostrar el perfil completo de un cliente (datos personales + datos de contacto + demografía + feedback) requería unir 4 tablas: `CUSTOMERS`, `CUSTOMER_CONTACT`, `CUSTOMER_EXTENSION`, `CUSTOMER_FEEDBACK`. En MongoDB es una sola búsqueda por `_id`. En una aplicación web con alta concurrencia, la diferencia de latencia es medible.

**c) Escalabilidad horizontal natural:**  
MongoDB está diseñado para sharding: distribuir colecciones entre múltiples servidores según una clave de partición. Para un dataset como CUSTSALES (25M de filas en Oracle), un shard por `customer_id` o por fecha permite escalar horizontalmente sin rediseñar el esquema. Oracle también puede hacer particionamiento, pero la complejidad operacional y el costo de licencia son significativamente mayores.

**d) Pipeline de agregación expresivo:**  
El `$group`, `$sort`, `$limit` de MongoDB para calcular top géneros por ingresos es idiomático y legible. Equivale al `GROUP BY` + `ORDER BY` de SQL, pero está integrado directamente en el driver sin necesidad de un ORM o query builder adicional.

---

## Pregunta 3: ¿Cuándo NO usarías MongoDB y preferirías un sistema relacional?

**a) Cuando la integridad referencial es crítica:**  
Un sistema financiero bancario, donde una transferencia entre cuentas debe ser atómica y consistente a través de múltiples entidades, requiere transacciones ACID y foreign keys. Aunque MongoDB 4.x+ soporta transacciones multi-documento, la complejidad de garantizar consistencia en un modelo documental aumenta considerablemente. PostgreSQL o Oracle son la elección natural.

**b) Cuando el esquema es estable y bien entendido:**  
Si los datos tienen una estructura fija, bien definida y sin necesidad de flexibilidad (por ejemplo, un sistema de nómina, un registro contable), las garantías del modelo relacional — tipos estrictos, constraints, vistas actualizables — son una ventaja real, no un obstáculo.

**c) Cuando las consultas ad hoc son frecuentes:**  
En entornos de análisis y reportes donde los analistas ejecutan consultas arbitrarias (JOINs entre múltiples tablas, subconsultas correlacionadas, funciones de ventana como `RANK()` o `LAG()`), SQL sigue siendo más expresivo. El pipeline de agregación de MongoDB es poderoso, pero para consultas analíticas complejas, un data warehouse columnar (BigQuery, Snowflake) o una base relacional con soporte OLAP es más adecuado.

**d) Cuando hay un equipo pequeño sin experiencia en NoSQL:**  
La curva de aprendizaje de MongoDB no es el lenguaje de consultas (el pipeline es intuitivo), sino los patrones de diseño de esquema. Un error común es embutir datos ilimitadamente o replicar el modelo relacional sin aprovechar los documentos. En ese escenario, un modelo relacional convencional produce resultados más predecibles con menor riesgo de errores de diseño que solo se descubren en producción.

---

## Conclusión personal

Esta migración fue un ejercicio valioso para entender que NoSQL no es "mejor" ni "peor" que SQL — es una herramienta diferente con un conjunto diferente de trade-offs. MongoDB brilla en aplicaciones web donde los datos se leen como entidades completas, el esquema evoluciona frecuentemente y la escala horizontal es un requisito. Oracle brilla donde la integridad de datos, las transacciones complejas y las consultas analíticas ad hoc son prioritarias. La decisión correcta depende del dominio, del equipo y de los patrones de acceso reales — no de tendencias tecnológicas.
