/**
 * Script de corrección: convierte los qrToken almacenados como BSON UUID binario
 * a plain strings para que Mongoose pueda consultarlos correctamente.
 *
 * Ejecutar:
 *   pnpm exec ts-node-dev --transpile-only scripts/fix-qr-tokens-type.ts
 */
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixQrTokenTypes() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI no está definida en .env');

  console.log('Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Conectado.\n');

  const collection = mongoose.connection.collection('clients');
  const allClients = await collection.find({}).toArray();

  let fixed = 0;
  let alreadyString = 0;
  let noToken = 0;

  for (const client of allClients) {
    const token = client.qrToken;

    if (!token) {
      // Sin token: asignar uno nuevo como string
      const newToken = randomUUID();
      await collection.updateOne({ _id: client._id }, { $set: { qrToken: newToken } });
      console.log(`  ➕ ${client.fullName}: nuevo token asignado`);
      noToken++;
      continue;
    }

    if (typeof token === 'string') {
      // Ya es string, no hay nada que hacer
      alreadyString++;
      continue;
    }

    // Es un objeto (BSON Binary UUID u otro tipo no-string)
    let tokenString: string;
    try {
      // BSON Binary tiene un método .toString() que devuelve hex sin formato UUID
      const raw = token.toString('hex') as string;
      if (raw && raw.length === 32) {
        // Formatear como UUID: 8-4-4-4-12
        tokenString = [
          raw.slice(0, 8),
          raw.slice(8, 12),
          raw.slice(12, 16),
          raw.slice(16, 20),
          raw.slice(20, 32),
        ].join('-');
      } else {
        // Formato inesperado, asignar nuevo token
        tokenString = randomUUID();
        console.warn(`  ⚠ Formato inesperado para ${client.fullName} (hex: ${raw}), asignando nuevo token`);
      }
    } catch {
      tokenString = randomUUID();
      console.warn(`  ⚠ Error convirtiendo token de ${client.fullName}, asignando nuevo token`);
    }

    await collection.updateOne({ _id: client._id }, { $set: { qrToken: tokenString } });
    console.log(`  ✓ ${client.fullName}: convertido → ${tokenString}`);
    fixed++;
  }

  console.log('\n=== Resultado ===');
  console.log(`✅ Tokens BSON convertidos a string: ${fixed}`);
  console.log(`ℹ  Ya eran strings (sin cambios):    ${alreadyString}`);
  console.log(`➕ Nuevos tokens asignados:           ${noToken}`);
  console.log(`📦 Total clientes procesados:         ${allClients.length}`);

  await mongoose.disconnect();
  console.log('\n¡Listo! Ahora el escáner QR debería funcionar correctamente.');
}

fixQrTokenTypes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
