import { useDB } from '../../db/DBContext';

export function useExpiryController() {
  const { batches, setBatches, medicines } = useDB();

  const handleSupplierReturnExpired = (batchId) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    setBatches(batches.filter(b => b.id !== batchId));
    alert(`Box batch ${targetBatch.batchNumber} has been removed and marked to send back to the supplier.`);
  };

  return {
    batches,
    medicines,
    handleSupplierReturnExpired
  };
}
