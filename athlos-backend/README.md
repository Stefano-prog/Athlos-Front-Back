# Athlos Backend — API REST

API REST para **Athlos**, entrenador personal con Inteligencia Artificial. Construida con **Node.js + Express + TypeScript + MongoDB**.

---

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Instalación y arranque](#instalación-y-arranque)
3. [Variables de entorno](#variables-de-entorno)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Labor de cada carpeta y sus archivos](#labor-de-cada-carpeta-y-sus-archivos)
6. [Diseño de la API REST](#diseño-de-la-api-rest)
7. [Conexión con el frontend](#conexión-con-el-frontend)
8. [Flujo de una request](#flujo-de-una-request)

---

## Requisitos previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- **MongoDB** (local o Atlas)
- Una **Gemini API Key** (console.cloud.google.com)

---

## Instalación y arranque

\`\`\`bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd athlos-backend

# 2. Instalar dependencias
npm install

# 3. Copiar el archivo de entorno y completarlo
cp .env .env.local
# Editar .env con tus valores reales (ver sección siguiente)

# 4. Arrancar en modo desarrollo (recarga automática)
npm run dev

# 5. Compilar para producción
npm run build

# 6. Correr en producción
npm start
\`\`\`

El servidor arranca por defecto en `http://localhost:3000`.

---

## Variables de entorno

El archivo `.env` en la raíz del proyecto debe contener:

\`\`\`env
PORT=3000
DB=mongodb://localhost:27017/athlos (ejemplo)
JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=tu_gemini_api_key_aqui
\`\`\`

| Variable | Descripción |
|---|---|
| `PORT` | Puerto en el que escucha el servidor |
| `MONGODB_URI` | Cadena de conexión a MongoDB. Para Atlas: `mongodb+srv://usuario:password@cluster.mongodb.net/athlos` |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT. Usar una cadena larga y aleatoria en producción |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token. Ej: `7d`, `24h`, `60m` |
| `GEMINI_API_KEY` | API Key de Google Gemini. Se mueve aquí para no exponerla en el cliente móvil |

> **Importante:** El archivo `.env` está en `.gitignore`. Nunca lo subas al repositorio.

---

## Estructura de carpetas

\`\`\`
athlos-backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── exercise.routes.ts
│   │   └── chat.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── exercise.controller.ts
│   │   └── chat.controller.ts
│   │
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Exercise.model.ts
│   │   └── Chat.model.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── gemini.service.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── dist/                  ← Generado automáticamente con npm run build
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

---

## Labor de cada carpeta y sus archivos

### `src/config/` — Configuración global

Centraliza la conexión a servicios externos y la carga de variables de entorno. Se carga una sola vez al arrancar el servidor.

**`env.ts`**
Exporta las variables de entorno tipadas. Lanza un error en arranque si falta alguna variable obligatoria, evitando que el servidor corra en un estado inválido.

\`\`\`typescript
// Qué debe hacer este archivo:
// - Importar dotenv y llamar a dotenv.config()
// - Leer process.env y exportar cada variable con su tipo correcto
// - Lanzar un Error si PORT, MONGODB_URI, JWT_SECRET o GEMINI_API_KEY están vacíos
export const ENV = {
  PORT: process.env.PORT || '3000',
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
};
\`\`\`

**`db.ts`**
Establece y exporta la conexión a MongoDB usando Mongoose.

\`\`\`typescript
// Qué debe hacer este archivo:
// - Importar mongoose y ENV
// - Exportar una función connectDB() que llame a mongoose.connect(ENV.MONGODB_URI)
// - Loggear éxito o error de conexión
// - Esta función se llama una sola vez en server.ts antes de abrir el puerto
\`\`\`

---

### `src/models/` — Entidades de la base de datos

Cada archivo define un esquema de Mongoose y exporta el modelo correspondiente. Los modelos son la única capa que habla directamente con MongoDB.

**`User.model.ts`**
Representa al usuario registrado en Athlos.

\`\`\`typescript
// Campos que debe tener el esquema:
// - nombre: string (requerido)
// - correo: string (requerido, único, lowercase)
// - password: string (requerido, no se devuelve en queries con select: false)
// - peso: number (opcional)
// - talla: number (opcional)
// - edad: number (opcional)
// - complexion: enum ['ectomorfo', 'mesomorfo', 'endomorfo']
// - objetivo: enum ['bajar_peso', 'mantener_peso', 'ganar_musculo']
// - entorno: enum ['casa', 'gimnasio', 'aire_libre']
// - verificado: boolean (default false)
// - timestamps: true (crea createdAt y updatedAt automáticamente)
\`\`\`

**`Exercise.model.ts`**
Representa los ejercicios del catálogo (migración del `ejercicios.csv`).

\`\`\`typescript
// Campos que debe tener el esquema:
// - nombre: string (requerido)
// - grupo_muscular: string
// - objetivo: enum ['bajar_peso', 'mantener_peso', 'ganar_musculo']
// - ambiente: enum ['casa', 'gimnasio', 'aire_libre']
// - dificultad: enum ['Principiante', 'Intermedio', 'Avanzado']
// - descripcion: string
// - series: number
// - repeticiones: string (puede ser '10-12' o '30-60 segundos')
// - instrucciones: string
\`\`\`

**`Chat.model.ts`**
Guarda el historial de conversaciones de cada usuario con Athlos AI. Reemplaza el localStorage del frontend.

\`\`\`typescript
// Campos que debe tener el esquema:
// - userId: ObjectId (ref: 'User', requerido)
// - mensajes: array de objetos con:
//     sender: enum ['user', 'athlos']
//     text: string
//     timestamp: Date
// - timestamps: true
\`\`\`

---

### `src/services/` — Lógica de negocio reutilizable

Los services contienen la lógica que no debe vivir en los controllers. Son funciones puras que los controllers llaman. Esto permite reutilizar lógica entre endpoints y facilita el testing.

**`auth.service.ts`**
Encapsula todo lo relacionado con autenticación.

\`\`\`typescript
// Funciones que debe exportar:
// - hashPassword(password: string): Promise<string>
//     Usa bcryptjs con salt rounds 10 para hashear la contraseña
//
// - comparePassword(plain: string, hashed: string): Promise<boolean>
//     Compara la contraseña ingresada con el hash guardado
//
// - generateToken(userId: string): string
//     Firma un JWT con JWT_SECRET y JWT_EXPIRES_IN
//
// - generateVerificationCode(): string
//     Genera un código numérico de 6 dígitos para verificación de correo
\`\`\`

**`gemini.service.ts`**
Encapsula la llamada a la API de Gemini. Mueve esta lógica del cliente móvil al servidor, protegiendo la API Key.

\`\`\`typescript
// Funciones que debe exportar:
// - buildSystemPrompt(user: IUser, exercises: IExercise[]): string
//     Construye el system prompt personalizado con los datos del usuario
//     y el catálogo de ejercicios (igual que en Chat.tsx pero en el servidor)
//
// - sendMessage(history: IMessage[], userMessage: string, systemPrompt: string): Promise<string>
//     Llama a la API de Gemini con el historial completo y devuelve la respuesta
//     Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent
\`\`\`

---

### `src/middlewares/` — Interceptores de requests

Los middlewares se ejecutan antes de que la request llegue al controller. Se registran en las rutas que los necesitan.

**`auth.middleware.ts`**
Protege los endpoints privados verificando el JWT.

\`\`\`typescript
// Qué debe hacer:
// - Leer el header Authorization: Bearer <token>
// - Si no existe el header → responder 401 Unauthorized
// - Verificar el token con jwt.verify(token, JWT_SECRET)
// - Si el token es inválido o expiró → responder 401
// - Si es válido → guardar el userId decodificado en req.user y llamar next()
// - Exportar como función middleware de Express: (req, res, next) => void
\`\`\`

**`validate.middleware.ts`**
Valida el body de la request con esquemas Zod antes de que llegue al controller.

\`\`\`typescript
// Qué debe hacer:
// - Recibir un schema de Zod como parámetro
// - Devolver un middleware que llame a schema.safeParse(req.body)
// - Si la validación falla → responder 400 con los errores de Zod formateados
// - Si pasa → llamar next()
//
// Uso en routes:
// router.post('/register', validate(registerSchema), authController.register)
\`\`\`

---

### `src/controllers/` — Lógica de cada endpoint

Los controllers reciben la request de Express, llaman a los services o modelos necesarios, y devuelven la response. No contienen lógica de negocio compleja; esa va en los services.

**`auth.controller.ts`**
\`\`\`typescript
// Funciones que debe exportar:
// - register(req, res): Crea usuario → hashea password → guarda en BD → responde 201
// - login(req, res): Busca usuario por correo → compara password → genera JWT → responde 200
// - verifyEmail(req, res): Valida código de 6 dígitos → marca usuario como verificado
// - recoverPassword(req, res): Genera código → simula envío de correo → responde 200
// - resetPassword(req, res): Valida código → hashea nueva password → actualiza en BD
\`\`\`

**`user.controller.ts`**
\`\`\`typescript
// Funciones que debe exportar:
// - getProfile(req, res): Busca usuario por req.user.id → responde con datos del perfil
// - updateProfile(req, res): Actualiza campos físicos del usuario (peso, talla, edad, etc.)
// - updateEnvironment(req, res): Actualiza el entorno de entrenamiento del usuario
\`\`\`

**`exercise.controller.ts`**
\`\`\`typescript
// Funciones que debe exportar:
// - getAll(req, res): Devuelve todos los ejercicios del catálogo
// - getFiltered(req, res): Filtra por query params: ?objetivo=bajar_peso&ambiente=casa
// - getById(req, res): Devuelve un ejercicio por su ID
\`\`\`

**`chat.controller.ts`**
\`\`\`typescript
// Funciones que debe exportar:
// - getHistory(req, res): Devuelve el historial de mensajes del usuario autenticado
// - sendMessage(req, res): Recibe mensaje → llama gemini.service → guarda mensajes → responde
// - clearHistory(req, res): Borra el historial del usuario autenticado
\`\`\`

---

### `src/routes/` — Definición de endpoints

Cada archivo registra las rutas de un recurso y les asigna su controller y middlewares.

**`auth.routes.ts`**
\`\`\`
POST   /api/auth/register          → authController.register
POST   /api/auth/login             → authController.login
POST   /api/auth/verify-email      → authController.verifyEmail
POST   /api/auth/recover-password  → authController.recoverPassword
POST   /api/auth/reset-password    → authController.resetPassword
\`\`\`

**`user.routes.ts`** *(requieren JWT)*
\`\`\`
GET    /api/user/profile           → userController.getProfile
PUT    /api/user/profile           → userController.updateProfile
PUT    /api/user/environment       → userController.updateEnvironment
\`\`\`

**`exercise.routes.ts`** *(requieren JWT)*
\`\`\`
GET    /api/exercises              → exerciseController.getAll
GET    /api/exercises?objetivo=&ambiente=  → exerciseController.getFiltered
GET    /api/exercises/:id          → exerciseController.getById
\`\`\`

**`chat.routes.ts`** *(requieren JWT)*
\`\`\`
GET    /api/chat/history           → chatController.getHistory
POST   /api/chat/message           → chatController.sendMessage
DELETE /api/chat/history           → chatController.clearHistory
\`\`\`

---

### `src/app.ts` — Configuración de Express

Crea y configura la instancia de Express. No arranca el servidor, solo define middlewares globales y registra las rutas.

\`\`\`typescript
// Qué debe hacer:
// - Crear la app con express()
// - Registrar express.json() para parsear bodies JSON
// - Registrar cors() con origin permitido (URL del cliente móvil)
// - Montar las rutas:
//     app.use('/api/auth', authRoutes)
//     app.use('/api/user', authMiddleware, userRoutes)
//     app.use('/api/exercises', authMiddleware, exerciseRoutes)
//     app.use('/api/chat', authMiddleware, chatRoutes)
// - Registrar un handler 404 para rutas no encontradas
// - Exportar la app
\`\`\`

### `src/server.ts` — Punto de entrada

Arranca el servidor. Es el archivo que ejecuta Node.js.

\`\`\`typescript
// Qué debe hacer:
// - Importar app, connectDB y ENV
// - Llamar a connectDB()
// - Cuando la conexión a MongoDB sea exitosa, llamar a app.listen(ENV.PORT)
// - Loggear que el servidor está corriendo y en qué puerto
\`\`\`

---

## Diseño de la API REST

### Convenciones generales

- Todas las rutas tienen el prefijo `/api`
- Los bodies y responses son siempre `application/json`
- Los endpoints privados requieren el header: `Authorization: Bearer <token>`
- Las respuestas de error siguen esta estructura:

\`\`\`json
{
  "success": false,
  "message": "Descripción del error",
  "errors": []
}
\`\`\`

- Las respuestas exitosas siguen esta estructura:

\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

### Ejemplo de flujo de registro

\`\`\`
1. POST /api/auth/register
   Body: { nombre, correo, password, confirmPassword }
   → Valida con Zod
   → Verifica que el correo no exista
   → Hashea la contraseña con bcrypt
   → Guarda el usuario en MongoDB
   → Genera código de verificación de 6 dígitos
   → Responde 201

2. POST /api/auth/verify-email
   Body: { correo, codigo }
   → Verifica el código
   → Marca al usuario como verificado
   → Responde 200

3. POST /api/auth/login
   Body: { correo, password }
   → Busca el usuario por correo
   → Compara la contraseña con bcrypt
   → Genera y devuelve el JWT
   → Responde 200 con { token, user }
\`\`\`

### Ejemplo de envío de mensaje al chat

\`\`\`
POST /api/chat/message
Header: Authorization: Bearer <token>
Body: { mensaje: "Dame una rutina para casa" }

→ auth.middleware verifica el JWT y extrae userId
→ chat.controller busca el historial del usuario
→ chat.controller llama a gemini.service.sendMessage()
→ gemini.service construye el system prompt con datos del usuario
→ gemini.service llama a la API de Gemini
→ Se guardan ambos mensajes en Chat.model
→ Responde 200 con { respuesta: "..." }
\`\`\`

---

## Conexión con el frontend

En el frontend ya existe esta variable en `src/pages/inicio-sesion.tsx`:

\`\`\`typescript
const URL_BACKEND = import.meta.env.VITE_URL_BACKEND || 'http://localhost:3000'
\`\`\`

Agrega esto en el `.env` del proyecto frontend:

\`\`\`env
# Desarrollo
VITE_URL_BACKEND=http://localhost:3000

# Producción
VITE_URL_BACKEND=https://api.athlos.com
\`\`\`

Todas las llamadas desde el frontend deben incluir el token:

\`\`\`typescript
const response = await fetch(`${URL_BACKEND}/api/chat/message`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('athlos_token')}`
  },
  body: JSON.stringify({ mensaje: inputMsg })
});
\`\`\`

---

## Flujo de una request

\`\`\`
App móvil
    │
    ▼
src/routes/         ← Define el método HTTP y la URL
    │
    ▼
src/middlewares/    ← Valida el JWT (auth) y el body (validate)
    │
    ▼
src/controllers/    ← Recibe req, llama services/models, devuelve res
    │
    ▼
src/services/       ← Lógica de negocio (hash, JWT, Gemini API)
    │
    ▼
src/models/         ← Acceso a MongoDB vía Mongoose
    │
    ▼
MongoDB Atlas / Local
\`\`\`
