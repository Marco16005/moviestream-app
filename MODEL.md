# MODEL.md — Diseño del esquema MongoDB para MovieStream

## Contexto

La base de datos relacional original (Oracle) de MovieStream contiene tablas normalizadas: `MOVIES`, `CUSTOMERS`, `CUSTSALES`, `GENRE`, `ACTORS`, `CUSTOMER_SEGMENT`, `CUSTOMER_CONTACT`, `CUSTOMER_EXTENSION`. La migración a MongoDB implica tomar decisiones explícitas sobre qué embutir (_embed_) y qué referenciar.

---

## Colecciones

### 1. `movies`

**Decisión de diseño:** embedding total de datos relacionados.

```json
{
  "_id": 1,
  "title": "Inception",
  "year": 2010,
  "runtime": 148,
  "summary": "A thief who steals corporate secrets through dream-sharing...",
  "list_price": 3.99,
  "main_subject": "Science Fiction",
  "genre": ["Action", "Sci-Fi", "Thriller"],
  "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  "crew": [
    { "job": "Director", "names": ["Christopher Nolan"] },
    { "job": "Producer", "names": ["Emma Thomas"] }
  ],
  "studio": ["Warner Bros."],
  "awards": ["Academy Award — Best Cinematography"],
  "nominations": ["Academy Award — Best Picture"],
  "image_url": "https://...",
  "views": 48210,
  "wiki_article": "https://en.wikipedia.org/wiki/Inception"
}
```

**Justificación:**
- Los géneros, actores y premios de una película no cambian frecuentemente y son siempre consultados juntos. No tiene sentido hacer un JOIN (lookup) en cada lectura.
- Arrays como `genre`, `cast`, `awards` reemplazan las tablas `GENRE`, `ACTORS` y `MOVIE_CAST` del modelo relacional.
- Una película puede ser leída como documento completo en O(1) sin agregaciones adicionales.

---

### 2. `customers`

**Decisión de diseño:** embedding de feedback, survey y contacto alternativo dentro del documento del cliente.

```json
{
  "_id": 1000001,
  "name": { "first": "Maria", "last": "Torres" },
  "email": "maria@example.com",
  "yrs_customer": 4.5,
  "segment_id": 3,
  "segment_name": "Aficionados al streaming",
  "location": {
    "city": "Guadalajara",
    "state": "Jalisco",
    "country": "Mexico",
    "continent": "North America"
  },
  "demographics": {
    "age": 29,
    "gender": "F",
    "income_level": "B: $90,000 - $150,000",
    "education": "Bach. Degree"
  },
  "feedback": [
    {
      "feedback_id": 1,
      "rating": 5,
      "comment": "Excelente servicio",
      "date": "2024-03-15T00:00:00Z",
      "channel": "App"
    }
  ],
  "survey": [
    {
      "question": "¿Con qué frecuencia usas el servicio?",
      "response": "Diariamente"
    }
  ],
  "contact": [
    { "phone": "+52-33-1234-5678", "email": "maria.alt@gmail.com" }
  ]
}
```

**Justificación:**
- `feedback` y `survey` provienen de las tablas `CUSTOMER_FEEDBACK` y `CUSTOMER_SURVEY` del modelo relacional. Son datos que pertenecen al cliente y siempre se consultan en contexto del mismo.
- El array `contact` reemplaza la tabla `CUSTOMER_CONTACT` — en el modelo relacional era una tabla de solo 2 columnas con relación 1:N. En MongoDB es trivial embutirla.
- El array `feedback` tiene crecimiento controlado (máx ~10–20 ítems por cliente), por lo que no representa un riesgo de documentos ilimitadamente grandes.

---

### 3. `sales`

**Decisión de diseño:** desnormalización parcial con referencias a `_id` de película y cliente.

```json
{
  "_id": "sale_1001",
  "customer_id": 1000001,
  "movie_id": 1,
  "genre": { "name": "Action", "id": 2 },
  "payment": {
    "actual_price": 3.99,
    "list_price": 4.99,
    "discount_type": "Promotion",
    "payment_method": "Credit Card"
  },
  "day_id": 20240315,
  "day_name": "Friday",
  "month": 3,
  "year": 2024,
  "quarter": 1,
  "device": "SmartTV"
}
```

**Justificación:**
- Las ventas son el registro de un evento pasado e inmutable. No se actualiza — solo se inserta.
- Se desnormaliza el nombre del género directamente en el documento para permitir agregaciones rápidas por género sin lookup adicional.
- `customer_id` y `movie_id` son referencias para poder hacer lookups cuando se necesita información más detallada (ej. nombre del cliente o título de la película).
- Con 25M de registros en Oracle, aquí se mantiene una muestra representativa de 50,000 ventas.

---

### 4. `customer_segments`

**Decisión de diseño:** colección independiente (referencia).

```json
{
  "_id": 3,
  "name": "Aficionados al streaming",
  "short_name": "Aficionados"
}
```

**Justificación:**
- Solo tiene ~8 segmentos. Es un catálogo estático con poca variación.
- Se desnormaliza `segment_name` dentro de cada cliente para lecturas rápidas, pero se mantiene como colección independiente como fuente de verdad.

---

## Tabla de decisiones embed vs. reference

| Dato                | Origen Oracle          | Estrategia MongoDB | Razón                                          |
|---------------------|------------------------|--------------------|------------------------------------------------|
| Géneros de película | Tabla `GENRE`          | Embed (array)      | Siempre se lee con la película, no cambia      |
| Actores             | Tabla `ACTORS`         | Embed (array)      | Conjunto fijo, lectura conjunta                |
| Premios / nomin.    | Tabla `MOVIE_AWARDS`   | Embed (array)      | Dato inmutable del documento película          |
| Feedback cliente    | Tabla `CUSTOMER_FEEDBACK` | Embed (array)   | Pertenece al cliente, conjunto pequeño         |
| Encuesta cliente    | Tabla `CUSTOMER_SURVEY` | Embed (array)    | Igual que feedback                             |
| Contacto alt.       | Tabla `CUSTOMER_CONTACT` | Embed (array)   | Pocos ítems, siempre del mismo cliente         |
| Segmento            | Tabla `CUSTOMER_SEGMENT` | Reference + desnorm. | Catálogo estático, se desnormaliza el nombre |
| Ventas → Cliente    | FK `customer_id`       | Reference          | Alto volumen, no se lee todo junto             |
| Ventas → Película   | FK `movie_id`          | Reference          | Alto volumen, no se lee todo junto             |

---

## Índices creados

```javascript
// movies
db.movies.createIndex({ title: "text" })
db.movies.createIndex({ genre: 1 })
db.movies.createIndex({ year: -1 })

// customers
db.customers.createIndex({ "name.first": 1, "name.last": 1 })
db.customers.createIndex({ email: 1 }, { unique: true })
db.customers.createIndex({ "location.country": 1 })

// sales
db.sales.createIndex({ customer_id: 1 })
db.sales.createIndex({ movie_id: 1 })
db.sales.createIndex({ year: 1, month: 1 })
db.sales.createIndex({ "genre.name": 1 })
```

**Justificación de índices:**
- El índice de texto en `title` permite búsquedas de películas sin regex completo.
- Los índices en `genre`, `year`, `location.country` y `"name.first"/"name.last"` respaldan los filtros más comunes en la interfaz web.
- En `sales`, los índices sobre `customer_id`, `movie_id` y `"genre.name"` soportan las agregaciones del dashboard (top géneros por ingresos).
