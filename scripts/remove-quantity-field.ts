/**
 * Elimina el campo `quantity` de todos los items dentro de los pedidos.
 * Ejecutar una sola vez:
 *   pnpm exec ts-node-dev --transpile-only scripts/remove-quantity-field.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function removeQuantityField() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI no está definida en .env');

  console.log('Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Conectado.\n');

  const orders = mongoose.connection.collection('orders');

  // Elimina el campo quantity de cada elemento del array items
  const result = await orders.updateMany(
    { 'items.quantity': { $exists: true } },
    { $unset: { 'items.$[].quantity': '' } }
  );

  console.log(`✅ Campo 'quantity' eliminado de ${result.modifiedCount} pedidos.`);
  await mongoose.disconnect();
}

removeQuantityField().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
