import { execSync } from 'child_process';

try {
  console.log('Running: npx prisma generate ...');
  const output = execSync('npx prisma generate', { encoding: 'utf-8', stdio: 'inherit' });
  console.log('Prisma generate output:', output);
} catch (err) {
  console.error('Error generating Prisma client:', err.message);
}
