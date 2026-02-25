/**
 * Script de migración: reemplaza el campo `description` de los pedidos
 * por el nuevo array `items` con { name, quantity, price }.
 *
 * Ejecutar una sola vez:
 *   npx ts-node scripts/migrate-orders-items.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateOrdersItems() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI no está definida en .env');
  }

  console.log('Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Conectado.\n');

  const ordersCollection = mongoose.connection.collection('orders');

  // 1. Pedidos que tienen description pero NO tienen items
  const ordersWithDescription = await ordersCollection
    .find({ description: { $exists: true, $ne: null, $ne: '' }, items: { $exists: false } })
    .toArray();

  console.log(`Pedidos con description sin items: ${ordersWithDescription.length}`);

  let updated = 0;
  for (const order of ordersWithDescription) {
    // Convertimos la description al primer item del pedido
    const item = {
      name: order.description as string,
      quantity: 1,
      price: 0,
    };

    await ordersCollection.updateOne(
      { _id: order._id },
      { $set: { items: [item] } }
    );

    updated++;
    process.stdout.write(`\rConvertidos: ${updated}/${ordersWithDescription.length}`);
  }

  if (ordersWithDescription.length > 0) {
    console.log(`\n✅ ${updated} pedidos convertidos con un item desde description.`);
  }

  // 2. Pedidos sin description Y sin items → asignar array vacío
  const ordersWithoutItems = await ordersCollection
    .find({ items: { $exists: false } })
    .toArray();

  console.log(`\nPedidos sin items (para inicializar con []): ${ordersWithoutItems.length}`);

  if (ordersWithoutItems.length > 0) {
    const result = await ordersCollection.updateMany(
      { items: { $exists: false } },
      { $set: { items: [] } }
    );
    console.log(`✅ ${result.modifiedCount} pedidos inicializados con items: [].`);
  }

  // 3. Eliminar el campo description de TODOS los pedidos
  const removeResult = await ordersCollection.updateMany(
    { description: { $exists: true } },
    { $unset: { description: '' } }
  );
  console.log(`\n🗑  Campo description eliminado de ${removeResult.modifiedCount} pedidos.`);

  console.log('\n✅ Migración completada exitosamente.');
  await mongoose.disconnect();
}

migrateOrdersItems().catch(err => {
  console.error('\n❌ Error en migración:', err);
  process.exit(1);
});
