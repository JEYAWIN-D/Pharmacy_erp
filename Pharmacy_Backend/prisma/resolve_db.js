import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('🔄 [1/4] Running initial Prisma push (without status foreign key)...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Prisma push failed. Make sure postgres is running.');
    process.exit(1);
  }

  console.log('\n🌱 [2/4] Seeding default statuses and initial admin user...');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Seeding failed.');
    process.exit(1);
  }

  console.log('\n📝 [3/4] Restoring foreign key constraints in schema.prisma...');
  const schemaPath = path.join(__dirname, 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Uncomment status relation lines
  schema = schema.replace(
    '  // status               MedicineStatus?       @relation(fields: [statusName], references: [name])',
    '  status               MedicineStatus?       @relation(fields: [statusName], references: [name])'
  );
  schema = schema.replace(
    '  // medicines Medicine[]',
    '  medicines Medicine[]'
  );

  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('   ✓ Constraints restored in schema.prisma.');

  console.log('\n🔄 [4/4] Running final Prisma push with foreign key constraints...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('\n✅ Database schema synchronized and seeded successfully!');
  } catch (e) {
    console.error('❌ Final Prisma push failed.');
    process.exit(1);
  }
}

run();
