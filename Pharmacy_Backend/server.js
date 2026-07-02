import 'dotenv/config';
import { execSync } from 'child_process';

console.log('Programmatically generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.error('Prisma generation failed:', err);
}

const { default: app } = await import('./src/app.js');

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Trigger nodemon reload after removing CORS_ORIGIN

