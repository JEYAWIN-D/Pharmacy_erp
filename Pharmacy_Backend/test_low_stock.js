import 'dotenv/config';
import { purchaseService } from './src/modules/purchase/purchase.module.js';

async function test() {
  try {
    const data = await purchaseService.getLowStockMedicines();
    console.log("Success! Data length:", data.length);
    process.exit(0);
  } catch (err) {
    console.error("Error occurred:", err);
    process.exit(1);
  }
}

test();
