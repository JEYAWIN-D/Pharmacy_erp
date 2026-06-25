import prisma from '../../config/prisma.js';

/**
 * Generates a sequential, date-stamped bill ID in the backend.
 * Format: BILL-YYYYMMDD-NNNN  (e.g. BILL-20260622-0003)
 *
 * Why backend-generated?
 *  - Frontend Math.random() IDs have collision risk under concurrent cashiers.
 *  - Accepting frontend IDs lets attackers overwrite existing bills by guessing IDs.
 *  - Sequential IDs make the billing ledger easy to audit and sort.
 */
export const generateBillId = async () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // "20260622"

  const lastBill = await prisma.bill.findFirst({
    where: {
      id: { startsWith: `BILL-${dateStr}-` }
    },
    orderBy: {
      id: 'desc'
    }
  });

  let seqNum = 1;
  if (lastBill && lastBill.id) {
    const parts = lastBill.id.split('-');
    if (parts.length === 3) {
      seqNum = parseInt(parts[2], 10) + 1;
    }
  }

  const seq = String(seqNum).padStart(4, '0');
  return `BILL-${dateStr}-${seq}`;
};
