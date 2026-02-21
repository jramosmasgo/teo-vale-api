/**
 * Script de migración: genera qrToken para clientes existentes que no tienen uno.
 * Ejecutar una sola vez: npx ts-node scripts/migrate-qr-tokens.ts
 */
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateQrTokens() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI no está definida en .env');
  }

  console.log('Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Conectado.\n');

  // Buscar clientes sin qrToken
  const clientsWithoutToken = await mongoose.connection
    .collection('clients')
    .find({ qrToken: { $exists: false } })
    .toArray();

  console.log(`Clientes sin qrToken: ${clientsWithoutToken.length}`);

  if (clientsWithoutToken.length === 0) {
    console.log('No hay clientes que migrar. ¡Todo está al día!');
    await mongoose.disconnect();
    return;
  }

  // Actualizar cada cliente con un token único
  let updated = 0;
  for (const client of clientsWithoutToken) {
    await mongoose.connection.collection('clients').updateOne(
      { _id: client._id },
      { $set: { qrToken: randomUUID() } }
    );
    updated++;
    process.stdout.write(`\rActualizados: ${updated}/${clientsWithoutToken.length}`);
  }

  console.log(`\n\n✅ Migración completada: ${updated} clientes actualizados.`);
  await mongoose.disconnect();
}

migrateQrTokens().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
