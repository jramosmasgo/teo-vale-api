/**
 * Script de corrección: convierte campos ObjectId almacenados como strings
 * de vuelta al tipo BSON ObjectId correcto.
 *
 * Esto ocurre cuando se usan operaciones de migración con el driver nativo de MongoDB
 * directamente (sin Mongoose), que puede guardar ObjectIds como strings simples.
 *
 * Colecciones afectadas y campos a convertir:
 *   - orders:        client
 *   - shipments:     order, client
 *   - payments:      client, registeredBy, shipments[].shipment
 *   - notifications: createdBy, seenBy[]
 *   - expenses:      registeredBy
 *
 * Ejecutar:
 *   pnpm exec ts-node-dev --transpile-only scripts/fix-objectids.ts
 */
import mongoose, { ObjectId } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Verifica si un valor es un string con formato ObjectId (24 hex chars) */
function isObjectIdString(value: any): boolean {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

/** Convierte un valor a ObjectId si es un string válido */
function toObjectId(value: any): any {
  if (isObjectIdString(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return value; // ya es ObjectId o null/undefined
}

/** Resultado por colección */
interface CollectionResult {
  collection: string;
  total: number;
  fixed: number;
  skipped: number;
}

// ─── Fixers por colección ────────────────────────────────────────────────────

async function fixOrders(db: mongoose.Connection): Promise<CollectionResult> {
  const col = db.collection('orders');
  const docs = await col.find({}).toArray();
  let fixed = 0, skipped = 0;

  for (const doc of docs) {
    const update: Record<string, any> = {};

    // client
    if (isObjectIdString(doc.client)) {
      update['client'] = toObjectId(doc.client);
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      fixed++;
    } else {
      skipped++;
    }
  }

  return { collection: 'orders', total: docs.length, fixed, skipped };
}

async function fixShipments(db: mongoose.Connection): Promise<CollectionResult> {
  const col = db.collection('shipments');
  const docs = await col.find({}).toArray();
  let fixed = 0, skipped = 0;

  for (const doc of docs) {
    const update: Record<string, any> = {};

    // order
    if (isObjectIdString(doc.order)) {
      update['order'] = toObjectId(doc.order);
    }
    // client
    if (isObjectIdString(doc.client)) {
      update['client'] = toObjectId(doc.client);
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      fixed++;
    } else {
      skipped++;
    }
  }

  return { collection: 'shipments', total: docs.length, fixed, skipped };
}

async function fixPayments(db: mongoose.Connection): Promise<CollectionResult> {
  const col = db.collection('payments');
  const docs = await col.find({}).toArray();
  let fixed = 0, skipped = 0;

  for (const doc of docs) {
    const update: Record<string, any> = {};

    // client
    if (isObjectIdString(doc.client)) {
      update['client'] = toObjectId(doc.client);
    }
    // registeredBy
    if (isObjectIdString(doc.registeredBy)) {
      update['registeredBy'] = toObjectId(doc.registeredBy);
    }

    // shipments[].shipment (array de sub-documentos)
    if (Array.isArray(doc.shipments) && doc.shipments.length > 0) {
      const fixedShipments = doc.shipments.map((s: any) => ({
        ...s,
        shipment: isObjectIdString(s.shipment) ? toObjectId(s.shipment) : s.shipment,
      }));

      // Solo actualizar si hay cambios
      const hasChanges = doc.shipments.some((s: any) => isObjectIdString(s.shipment));
      if (hasChanges) {
        update['shipments'] = fixedShipments;
      }
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      fixed++;
    } else {
      skipped++;
    }
  }

  return { collection: 'payments', total: docs.length, fixed, skipped };
}

async function fixNotifications(db: mongoose.Connection): Promise<CollectionResult> {
  const col = db.collection('notifications');
  const docs = await col.find({}).toArray();
  let fixed = 0, skipped = 0;

  for (const doc of docs) {
    const update: Record<string, any> = {};

    // createdBy
    if (isObjectIdString(doc.createdBy)) {
      update['createdBy'] = toObjectId(doc.createdBy);
    }

    // seenBy[] (array de ObjectIds)
    if (Array.isArray(doc.seenBy) && doc.seenBy.some((id: any) => isObjectIdString(id))) {
      update['seenBy'] = doc.seenBy.map((id: any) => toObjectId(id));
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      fixed++;
    } else {
      skipped++;
    }
  }

  return { collection: 'notifications', total: docs.length, fixed, skipped };
}

async function fixExpenses(db: mongoose.Connection): Promise<CollectionResult> {
  const col = db.collection('expenses');
  const docs = await col.find({}).toArray();
  let fixed = 0, skipped = 0;

  for (const doc of docs) {
    const update: Record<string, any> = {};

    // registeredBy
    if (isObjectIdString(doc.registeredBy)) {
      update['registeredBy'] = toObjectId(doc.registeredBy);
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      fixed++;
    } else {
      skipped++;
    }
  }

  return { collection: 'expenses', total: docs.length, fixed, skipped };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI no está definida en .env');

  console.log('🔌 Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  const db = mongoose.connection;
  console.log('✅ Conectado.\n');

  const results: CollectionResult[] = [];

  console.log('🔧 Corrigiendo ObjectIds por colección...\n');

  results.push(await fixOrders(db));
  console.log(`  📦 orders:        ${results.at(-1)?.fixed} docs corregidos / ${results.at(-1)?.skipped} sin cambios`);

  results.push(await fixShipments(db));
  console.log(`  🚚 shipments:     ${results.at(-1)?.fixed} docs corregidos / ${results.at(-1)?.skipped} sin cambios`);

  results.push(await fixPayments(db));
  console.log(`  💰 payments:      ${results.at(-1)?.fixed} docs corregidos / ${results.at(-1)?.skipped} sin cambios`);

  results.push(await fixNotifications(db));
  console.log(`  🔔 notifications: ${results.at(-1)?.fixed} docs corregidos / ${results.at(-1)?.skipped} sin cambios`);

  results.push(await fixExpenses(db));
  console.log(`  💸 expenses:      ${results.at(-1)?.fixed} docs corregidos / ${results.at(-1)?.skipped} sin cambios`);

  const totalFixed = results.reduce((s, r) => s + r.fixed, 0);
  const totalDocs  = results.reduce((s, r) => s + r.total, 0);

  console.log('\n══════════════════════════════════');
  console.log(`✅ Total documentos corregidos: ${totalFixed} / ${totalDocs}`);
  console.log('══════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Desconectado. ¡Listo!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
