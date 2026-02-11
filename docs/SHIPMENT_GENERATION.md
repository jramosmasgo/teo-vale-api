# Servicio de Generación Automática de Envíos

## Descripción
Este servicio genera automáticamente los envíos (shipments) del día actual basándose en las órdenes activas que tienen programado el día de hoy en su array de `orderDays`.

## Endpoint

### POST `/api/shipments/generate-today`

Genera los envíos del día actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Shipments generation completed successfully",
  "created": 5,
  "skipped": 2,
  "errors": 0,
  "data": {
    "created": [
      {
        "_id": "...",
        "order": "...",
        "client": "...",
        "status": "SCHEDULED",
        "amount": 150,
        "schedule": "MORNING",
        "deliveryDate": "2026-02-10T00:00:00.000Z",
        "notes": "Envío generado automáticamente para MONDAY",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "skipped": 2,
    "errors": [],
    "alreadyGenerated": false
  }
}
```

**Respuesta cuando ya se generaron hoy (200):**
```json
{
  "success": false,
  "alreadyGenerated": true,
  "message": "Los envíos ya fueron generados hoy a las 06:00:15. Se crearon 5 envíos.",
  "data": {
    "created": [],
    "skipped": 0,
    "errors": [],
    "alreadyGenerated": true,
    "message": "Los envíos ya fueron generados hoy a las 06:00:15. Se crearon 5 envíos."
  }
}
```

### GET `/api/shipments/generation-history`

Obtiene el historial de ejecuciones de generación de shipments.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)
- `startDate` (opcional): Fecha de inicio (formato: YYYY-MM-DD)
- `endDate` (opcional): Fecha de fin (formato: YYYY-MM-DD)
- `status` (opcional): Estado de la ejecución (SUCCESS, PARTIAL, FAILED)

**Ejemplo de request:**
```
GET /api/shipments/generation-history?page=1&limit=10&status=SUCCESS
```

**Respuesta (200):**
```json
{
  "generations": [
    {
      "_id": "...",
      "executionDate": "2026-02-10T11:00:00.000Z",
      "totalOrders": 10,
      "shipmentsCreated": 8,
      "shipmentsSkipped": 2,
      "errorCount": 0,
      "executedBy": "admin@example.com",
      "status": "SUCCESS",
      "errorDetails": [],
      "createdAt": "2026-02-10T11:00:15.000Z",
      "updatedAt": "2026-02-10T11:00:15.000Z"
    }
  ],
  "total": 25
}
```

### GET `/api/shipments/generation-today`

Verifica si ya se generaron shipments hoy y obtiene los detalles de la ejecución.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta cuando SÍ se generó hoy (200):**
```json
{
  "hasGeneration": true,
  "generation": {
    "_id": "...",
    "executionDate": "2026-02-10T06:00:00.000Z",
    "totalOrders": 10,
    "shipmentsCreated": 8,
    "shipmentsSkipped": 2,
    "errorCount": 0,
    "executedBy": "admin@example.com",
    "status": "SUCCESS",
    "createdAt": "2026-02-10T06:00:15.000Z",
    "updatedAt": "2026-02-10T06:00:15.000Z"
  }
}
```

**Respuesta cuando NO se ha generado hoy (404):**
```json
{
  "message": "No generation found for today",
  "hasGeneration": false
}
```

## Lógica del Servicio

### 1. Validación de generación única
**NUEVO**: Antes de generar los shipments, el servicio verifica si ya se ejecutó exitosamente hoy:
- Busca en la colección `ShipmentGeneration` si existe un registro con:
  - `executionDate` del día actual
  - `status` igual a 'SUCCESS' o 'PARTIAL'
- Si existe, retorna inmediatamente con `alreadyGenerated: true` y un mensaje informativo
- Esto previene la generación duplicada de shipments en el mismo día

### 2. Determina el día actual
El servicio obtiene el día de la semana actual (MONDAY, TUESDAY, etc.) en formato mayúsculas para coincidir con el enum del modelo Order.

### 3. Busca órdenes activas
Busca todas las órdenes que cumplan con:
- `status: true` (órdenes activas)
- `orderDays` contiene el día actual

### 4. Verifica duplicados
Para cada orden encontrada, verifica si ya existe un shipment para ese día (comparando la fecha de entrega en el rango del día actual).

### 5. Crea los shipments
Si no existe un shipment para la orden en el día actual, crea uno nuevo con:
- **order**: ID de la orden
- **client**: ID del cliente (tomado de la orden)
- **status**: 'SCHEDULED'
- **amount**: Monto de la orden
- **schedule**: Horario de la orden (MORNING/AFTERNOON)
- **deliveryDate**: Fecha actual
- **notes**: Mensaje automático indicando el día

### 6. Registra la ejecución
**NUEVO**: Al finalizar (exitosa o fallida), registra la ejecución en la colección `ShipmentGeneration`:
- **executionDate**: Fecha y hora de ejecución
- **totalOrders**: Número total de órdenes procesadas
- **shipmentsCreated**: Número de shipments creados
- **shipmentsSkipped**: Número de órdenes omitidas (ya tenían shipment)
- **errorCount**: Número de errores
- **executedBy**: Email del usuario que ejecutó (o 'system' si fue automático)
- **status**: 'SUCCESS', 'PARTIAL' o 'FAILED'
- **errorDetails**: Detalles de los errores (si hubo)

### 7. Manejo de errores
- Si una orden individual falla, se registra en el array de errores pero continúa procesando las demás
- Retorna un resumen con:
  - `created`: Array de shipments creados exitosamente
  - `skipped`: Número de órdenes que ya tenían shipment para hoy
  - `errors`: Array de errores con detalles de las órdenes que fallaron
  - `alreadyGenerated`: Indica si ya se generaron hoy
  - `message`: Mensaje informativo (si ya se generaron)

## Casos de Uso

### 1. Ejecución Manual
Un administrador puede llamar este endpoint manualmente para generar los envíos del día.

### 2. Tarea Programada (Cron Job)
Se puede configurar una tarea programada que ejecute este endpoint automáticamente cada día a una hora específica (por ejemplo, a las 6:00 AM).

Ejemplo con node-cron:
```typescript
import cron from 'node-cron';
import axios from 'axios';

// Ejecutar todos los días a las 6:00 AM
cron.schedule('0 6 * * *', async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/shipments/generate-today', {}, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      }
    });
    console.log('Shipments generated:', response.data);
  } catch (error) {
    console.error('Error generating shipments:', error);
  }
});
```

## Ejemplo de Flujo

### Escenario:
Hoy es **MONDAY** (Lunes)

### Órdenes en la base de datos:
1. **Orden A**: `orderDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY']`, `status: true`
2. **Orden B**: `orderDays: ['TUESDAY', 'THURSDAY']`, `status: true`
3. **Orden C**: `orderDays: ['MONDAY']`, `status: false`
4. **Orden D**: `orderDays: ['MONDAY']`, `status: true` (ya tiene shipment para hoy)

### Resultado:
- **Orden A**: ✅ Se crea shipment (tiene MONDAY y está activa)
- **Orden B**: ⏭️ Se omite (no tiene MONDAY)
- **Orden C**: ⏭️ Se omite (no está activa)
- **Orden D**: ⏭️ Se omite (ya tiene shipment para hoy)

### Respuesta:
```json
{
  "message": "Shipments generation completed",
  "created": 1,
  "skipped": 1,
  "errors": 0
}
```

## Consideraciones

1. **Zona Horaria**: El servicio usa la fecha/hora del servidor. Asegúrate de que el servidor esté configurado con la zona horaria correcta.

2. **Generación Única por Día**: **NUEVO** - El servicio previene la ejecución múltiple en el mismo día. Si intentas ejecutarlo más de una vez, recibirás un mensaje indicando que ya se ejecutó y cuántos shipments se crearon.

3. **Duplicados**: El servicio previene la creación de múltiples shipments para la misma orden en el mismo día.

4. **Auditoría**: **NUEVO** - Todas las ejecuciones se registran en la colección `ShipmentGeneration` para auditoría y seguimiento.

5. **Transacciones**: Actualmente no usa transacciones de MongoDB. Si necesitas garantizar atomicidad completa, considera implementar transacciones.

6. **Performance**: Para grandes volúmenes de órdenes, considera implementar procesamiento por lotes o paginación.

7. **Notificaciones**: Podrías extender el servicio para enviar notificaciones cuando se generan los envíos.

## Modelo ShipmentGeneration

El modelo `ShipmentGeneration` registra cada ejecución del servicio de generación:

```typescript
{
  executionDate: Date,        // Fecha y hora de ejecución
  totalOrders: Number,        // Total de órdenes procesadas
  shipmentsCreated: Number,   // Shipments creados exitosamente
  shipmentsSkipped: Number,   // Órdenes omitidas (ya tenían shipment)
  errorCount: Number,         // Número de errores
  executedBy: String,         // Email del usuario o 'system'
  status: String,             // 'SUCCESS', 'PARTIAL' o 'FAILED'
  errorDetails: Array,        // Detalles de errores (opcional)
  createdAt: Date,           // Timestamp de creación
  updatedAt: Date            // Timestamp de actualización
}
```

### Estados posibles:
- **SUCCESS**: Todos los shipments se crearon sin errores
- **PARTIAL**: Algunos shipments se crearon, pero hubo errores
- **FAILED**: La ejecución falló completamente

### Consultar historial de ejecuciones:
```javascript
// Obtener todas las ejecuciones de hoy
const today = new Date();
today.setHours(0, 0, 0, 0);
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const executions = await ShipmentGeneration.find({
  executionDate: { $gte: today, $lte: endOfDay }
}).sort({ createdAt: -1 });

// Obtener la última ejecución exitosa
const lastSuccess = await ShipmentGeneration.findOne({
  status: { $in: ['SUCCESS', 'PARTIAL'] }
}).sort({ createdAt: -1 });
```

