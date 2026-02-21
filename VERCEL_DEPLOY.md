# Despliegue en Vercel — Teo Vale Backend

## Requisitos previos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub/GitLab/Bitbucket con este proyecto
- MongoDB Atlas (u otro MongoDB cloud) ya configurado

---

## Pasos para desplegar

### 1. Importar el proyecto en Vercel
1. Ve a [vercel.com/new](https://vercel.com/new)
2. Haz clic en **"Import Git Repository"** y selecciona este repositorio
3. Selecciona el directorio raíz del **backend** (`teo-vale-backend`) si está en un monorepo

### 2. Configurar las variables de entorno
En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | URI de conexión de MongoDB Atlas |
| `JWT_SECRET` | Tu clave secreta para JWT |
| `CLOUDINARY_CLOUD_NAME` | Nombre de tu cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `PORT` | (opcional, Vercel lo gestiona automáticamente) |

### 3. Configuración de Build
Vercel detectará automáticamente los ajustes desde `vercel.json`.  
- **Build Command**: `pnpm run vercel-build`  
- **Output Directory**: `dist`  
- **Install Command**: `pnpm install`

### 4. Hacer el deploy
Haz clic en **Deploy** y Vercel construirá el proyecto automáticamente.

---

## Estructura de archivos para Vercel

```
teo-vale-backend/
├── api/
│   └── index.ts        ← Entry point serverless (exporta el app de Express)
├── src/
│   ├── app.ts
│   ├── server.ts       ← Solo para desarrollo local
│   └── ...
├── vercel.json         ← Configuración de rutas y builds
└── package.json
```

## Notas importantes

- El archivo `api/index.ts` actúa como el **handler serverless** de Vercel.
- El archivo `src/server.ts` sigue funcionando para **desarrollo local** con `pnpm dev`.
- Cada petición a `https://tu-dominio.vercel.app/*` es redirigida al handler de Express.
- Las conexiones a MongoDB se **reutilizan** entre invocaciones (connection pooling) gracias al patrón en `api/index.ts`.

## Desarrollo local
```bash
pnpm dev
```

## Build de producción (local)
```bash
pnpm build
pnpm start
```
