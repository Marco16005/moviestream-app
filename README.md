# MovieStream — Aplicación NoSQL con MongoDB y Next.js

**TC3005B — Bases de Datos Avanzadas**  
Migración de la base de datos relacional MovieStream (Oracle) a un modelo documental en MongoDB Atlas, con una interfaz web CRUD construida en Next.js.

---

## Stack tecnológico

| Capa          | Tecnología                          |
|---------------|-------------------------------------|
| Frontend      | Next.js 15 (App Router) + TypeScript |
| Estilos       | Tailwind CSS                        |
| Base de datos | MongoDB Atlas (Free Tier M0)        |
| Driver        | `mongodb` (Node.js official driver) |
| Despliegue    | Vercel                              |

---

## Características

- **Dashboard** con estadísticas en tiempo real (total películas, clientes, ventas) y top 5 géneros por ingresos
- **CRUD Películas** — Listado con búsqueda y filtro por género, detalle con edición inline, creación y eliminación
- **CRUD Clientes** — Listado con búsqueda y filtro por país, perfil completo con feedback y encuestas embebidos, creación y eliminación
- Paginación en listados
- Tema oscuro responsive

---

## Requisitos previos

- Node.js 18+
- Cuenta en MongoDB Atlas (o URI de conexión propia)
- Python 3.9+ (solo para ejecutar `seed.py`)

---

## Instalación y desarrollo local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd moviestream-app

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de MongoDB Atlas

# 4. Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGODB_DB=moviestreams
```

---

## Seed de la base de datos

Para poblar la base de datos desde cero:

```bash
# Instalar dependencias Python
pip install pymongo python-dotenv

# Ejecutar seed
python seed.py
```

El script crea las colecciones `movies`, `customers`, `sales` y `customer_segments` con datos de muestra y crea todos los índices necesarios. Si las variables de Oracle (`ORACLE_USER`, `ORACLE_PWD`, `ORACLE_DSN`, `ORACLE_WALLET`) están definidas, extrae datos reales desde Oracle ADB.

---

## Estructura del proyecto

```
moviestream-app/
├── app/
│   ├── page.tsx                  # Dashboard principal
│   ├── layout.tsx                # Layout con navbar
│   ├── movies/
│   │   ├── page.tsx              # Listado de películas
│   │   ├── new/page.tsx          # Crear película
│   │   └── [id]/page.tsx         # Detalle y edición de película
│   ├── customers/
│   │   ├── page.tsx              # Listado de clientes
│   │   ├── new/page.tsx          # Crear cliente
│   │   └── [id]/page.tsx         # Perfil y edición de cliente
│   └── api/
│       ├── movies/
│       │   ├── route.ts          # GET lista, POST crear
│       │   └── [id]/route.ts     # GET, PUT, DELETE
│       └── customers/
│           ├── route.ts          # GET lista, POST crear
│           └── [id]/route.ts     # GET, PUT, DELETE
├── lib/
│   └── mongodb.ts                # Singleton de conexión
├── seed.py                       # Script de seed
├── MODEL.md                      # Decisiones de diseño del esquema
└── REFLECTION.md                 # Reflexión NoSQL vs. Relacional
```

---

## Colecciones MongoDB

| Colección           | Documentos (muestra) | Descripción                          |
|---------------------|----------------------|--------------------------------------|
| `movies`            | ~500                 | Películas con género, cast, premios embebidos |
| `customers`         | ~9,329               | Clientes con feedback y encuesta embebidos |
| `sales`             | ~50,000              | Ventas (referencia a movie y customer) |
| `customer_segments` | 8                    | Catálogo de segmentos de cliente     |

Para el detalle del esquema y las justificaciones de diseño, ver [MODEL.md](./MODEL.md).

---

## API Routes

### Películas

| Método | Ruta                | Descripción                          |
|--------|---------------------|--------------------------------------|
| GET    | `/api/movies`       | Lista con búsqueda (`q`), filtro (`genre`), paginación (`page`) |
| POST   | `/api/movies`       | Crear película nueva                 |
| GET    | `/api/movies/:id`   | Obtener película por ID              |
| PUT    | `/api/movies/:id`   | Actualizar película                  |
| DELETE | `/api/movies/:id`   | Eliminar película                    |

### Clientes

| Método | Ruta                   | Descripción                          |
|--------|------------------------|--------------------------------------|
| GET    | `/api/customers`       | Lista con búsqueda (`q`), filtro (`country`), paginación |
| POST   | `/api/customers`       | Crear cliente nuevo                  |
| GET    | `/api/customers/:id`   | Obtener cliente por ID               |
| PUT    | `/api/customers/:id`   | Actualizar cliente                   |
| DELETE | `/api/customers/:id`   | Eliminar cliente                     |

---

## Despliegue en Vercel

1. Subir el repositorio a GitHub
2. Conectar el repositorio en [vercel.com](https://vercel.com)
3. Agregar las variables de entorno `MONGODB_URI` y `MONGODB_DB` en la configuración del proyecto
4. Vercel detecta Next.js automáticamente y despliega

---

## Reflexión

Ver [REFLECTION.md](./REFLECTION.md) para el análisis completo de tradeoffs NoSQL vs. relacional.
