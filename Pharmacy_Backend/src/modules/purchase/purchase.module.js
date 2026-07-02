import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// Helper: extract supplier name safely
const getSupplierName = (sup) =>
  sup ? (typeof sup === 'object' ? sup.name : sup) : 'Unknown Supplier';

const generatePOId = async (prId) => {
  let prSeq = '000';
  if (prId) {
    const match = prId.match(/^PR-(\d+)$/);
    if (match) {
      prSeq = match[1];
    }
  }

  const allPOs = await prisma.purchaseOrder.findMany({
    select: { id: true }
  });

  let maxSeq = 0;
  for (const po of allPOs) {
    const match = po.id.match(/^PO-\d+-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `PO-${prSeq}-${String(nextSeq).padStart(3, '0')}`;
};

// ─── PURCHASE REPOSITORY ─────────────────────────────────────────────────────
const purchaseRepo = {
  // ── Purchase Requests ──────────────────────────────────────────────────────
  createPR: async (data) => {
    const { items, ...rest } = data;

    // 1. Validate duplicates
    for (const item of (items || [])) {
      const activePRItem = await prisma.purchaseRequestItem.findFirst({
        where: {
          medicineId: item.medicineId,
          purchaseRequest: {
            status: { in: ['Pending', 'Approved', 'Partially Approved', 'PO Generated'] }
          }
        }
      });
      const activePOItem = await prisma.purchaseOrderItem.findFirst({
        where: {
          medicineId: item.medicineId,
          purchaseOrder: {
            status: { in: ['Draft', 'Sent', 'Accepted', 'Shipped', 'In Transit', 'Delivered', 'Partially Received'] }
          }
        }
      });

      if (activePRItem || activePOItem) {
        throw new AppError(`A active procurement workflow is already running for medicine ID ${item.medicineId}. Duplicate requests are blocked.`, 400, 'DUPLICATE_PR');
      }
    }

    // 2. Generate sequential ID
    const allPRs = await prisma.purchaseRequest.findMany({
      select: { id: true },
      where: { id: { startsWith: 'PR-' } }
    });
    
    let maxNum = 0;
    for (const pr of allPRs) {
      const match = pr.id.match(/^PR-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    const nextId = `PR-${String(nextNum).padStart(3, '0')}`;

    return prisma.purchaseRequest.create({
      data: {
        ...rest,
        id: nextId,
        items: {
          create: (items || []).map(item => ({
            medicineId: item.medicineId,
            requestedQty: parseInt(item.requestedQty) || 0,
            unit: item.unit || 'Boxes',
            remarks: item.remarks || '',
            status: 'Pending'
          }))
        }
      },
      include: { items: { include: { medicine: true } } }
    });
  },

  findAllPRs: async () => prisma.purchaseRequest.findMany({
    include: { items: { include: { medicine: true } } },
    orderBy: { createdAt: 'desc' }
  }),

  findPRById: async (id) => prisma.purchaseRequest.findUnique({
    where: { id },
    include: { items: { include: { medicine: true } } }
  }),

  updatePR: async (id, data) => prisma.purchaseRequest.update({
    where: { id },
    data,
    include: { items: { include: { medicine: true } } }
  }),

  // ── Purchase Orders ────────────────────────────────────────────────────────
  createPO: async (data) => {
    const { items, ...rest } = data;
    const poId = await generatePOId(rest.prId);

    const itemsData = [];
    let subtotalVal = 0;
    let totalVal = 0;

    for (const item of (items || [])) {
      const med = await prisma.medicine.findUnique({ where: { id: item.medicineId } });
      const defaultPrice = med ? Number(med.pricePerPiece || 0) : 0;
      const orderedQty = parseInt(item.qty) || 0;
      const modifiedPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : defaultPrice;
      const taxRate = item.tax !== undefined ? parseFloat(item.tax) : (med ? Number(med.taxPercentage || 0) : 0);
      const itemTotal = orderedQty * modifiedPrice * (1 + (taxRate / 100));

      subtotalVal += orderedQty * modifiedPrice;
      totalVal += itemTotal;

      itemsData.push({
        medicineId: item.medicineId,
        medicineName: item.medicineName || med?.medicineName || 'Unknown Medicine',
        qty: orderedQty,
        defaultPrice: defaultPrice,
        unitPrice: modifiedPrice,
        tax: taxRate,
        total: itemTotal,
        receivedQty: 0,
        damagedQty: 0,
        cancelledQty: 0,
        status: 'Pending'
      });
    }

    const now = new Date();
    const poTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return prisma.purchaseOrder.create({
      data: {
        ...rest,
        id: poId,
        poDate: now,
        poTime: poTimeStr,
        subtotal: subtotalVal,
        total: totalVal,
        expectedDelivery: rest.expectedDelivery ? new Date(rest.expectedDelivery) : null,
        items: {
          create: itemsData
        }
      },
      include: { items: { include: { medicine: true } }, supplier: true }
    });
  },

  findAllPOs: async () => prisma.purchaseOrder.findMany({
    include: {
      items: { include: { medicine: true } },
      supplier: true,
      grns: { include: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  }),

  findPOById: async (id) => prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: { include: { medicine: true } },
      supplier: true,
      grns: { include: { items: true } }
    }
  }),

  updatePO: async (id, data) => {
    const { expectedDelivery, items, ...rest } = data;
    return prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items)) {
        const currentItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: id }
        });
        const currentMedIds = currentItems.map(it => it.medicineId);
        const newMedIds = items.map(it => it.medicineId);

        // Delete items no longer in the list
        await tx.purchaseOrderItem.deleteMany({
          where: {
            purchaseOrderId: id,
            medicineId: { notIn: newMedIds }
          }
        });

        // Upsert items
        for (const item of items) {
          const existingItem = currentItems.find(it => it.medicineId === item.medicineId);
          const orderQty = parseInt(item.qty) || 1;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const tax = parseFloat(item.tax) || 0;
          const total = orderQty * unitPrice * (1 + (tax / 100));

          if (existingItem) {
            await tx.purchaseOrderItem.update({
              where: { id: existingItem.id },
              data: {
                qty: orderQty,
                unitPrice: unitPrice,
                tax: tax,
                total: total,
                receivedQty: item.receivedQty !== undefined ? parseInt(item.receivedQty) : undefined,
                damagedQty: item.damagedQty !== undefined ? parseInt(item.damagedQty) : undefined,
                cancelledQty: item.cancelledQty !== undefined ? parseInt(item.cancelledQty) : undefined,
                status: item.status || undefined
              }
            });
          } else {
            const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
            const defaultPrice = med ? Number(med.pricePerPiece || 0) : 0;
            await tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: id,
                medicineId: item.medicineId,
                medicineName: med ? med.medicineName : 'Unknown',
                qty: orderQty,
                defaultPrice: defaultPrice,
                unitPrice: unitPrice,
                tax: tax,
                total: total,
                receivedQty: 0,
                damagedQty: 0,
                cancelledQty: 0,
                status: 'Pending'
              }
            });
          }
        }
      }

      // Re-calculate grand total and subtotal
      const allPOItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id }
      });
      const poSubtotal = allPOItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);
      const poTotal = allPOItems.reduce((sum, item) => sum + Number(item.total || 0), 0);

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...rest,
          subtotal: poSubtotal,
          total: poTotal,
          ...(expectedDelivery !== undefined ? { expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null } : {})
        },
        include: { supplier: true, items: { include: { medicine: true } } }
      });
    });
  },

  // ── Shipments ──────────────────────────────────────────────────────────────
  createShipment: async (data) => {
    const { items, ...rest } = data;
    return prisma.shipment.create({
      data: {
        ...rest,
        dispatchDate: rest.dispatchDate ? new Date(rest.dispatchDate) : new Date(),
        expectedDeliveryDate: rest.expectedDeliveryDate ? new Date(rest.expectedDeliveryDate) : null,
        deliveryDate: rest.deliveryDate ? new Date(rest.deliveryDate) : null,
        items: {
          create: (items || []).map(item => ({
            medicineId: item.medicineId,
            qty: parseInt(item.qty) || 0
          }))
        }
      },
      include: { items: true, purchaseOrder: true }
    });
  },

  findShipmentById: async (id) => prisma.shipment.findUnique({
    where: { id },
    include: { items: { include: { medicine: true } }, purchaseOrder: true }
  }),

  findAllShipments: async () => prisma.shipment.findMany({
    include: { items: { include: { medicine: true } }, purchaseOrder: true },
    orderBy: { createdAt: 'desc' }
  }),

  updateShipment: async (id, data) => prisma.shipment.update({
    where: { id },
    data,
    include: { items: true }
  }),

  // ── GRNs ───────────────────────────────────────────────────────────────────
  createGRN: async (data) => {
    const { items, ...rest } = data;
    return prisma.gRN.create({
      data: {
        ...rest,
        receivedDate: rest.receivedDate ? new Date(rest.receivedDate) : new Date(),
        items: {
          create: (items || []).map(item => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            expiryDate: new Date(item.expiryDate),
            mfgDate: new Date(item.mfgDate),
            receivedQty: parseInt(item.receivedQty) || 0,
            damagedQty: parseInt(item.damagedQty) || 0,
            remarks: item.remarks || ''
          }))
        }
      },
      include: { items: true }
    });
  },

  findAllGRNs: async () => prisma.gRN.findMany({
    include: { items: { include: { medicine: true } }, purchaseOrder: { include: { supplier: true } } },
    orderBy: { createdAt: 'desc' }
  }),

  findGRNById: async (id) => prisma.gRN.findUnique({
    where: { id },
    include: { items: { include: { medicine: true } }, purchaseOrder: { include: { supplier: true } } }
  })
};

// ─── PURCHASE SERVICE ────────────────────────────────────────────────────────
export const purchaseService = {
  // ── PR Services ──────────────────────────────────────────────────────────
  createPR: async (data) => purchaseRepo.createPR(data),
  getAllPRs: async () => purchaseRepo.findAllPRs(),
  getPRById: async (id) => {
    const p = await purchaseRepo.findPRById(id);
    if (!p) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    return p;
  },
  updatePR: async (id, data) => {
    const p = await purchaseRepo.findPRById(id);
    if (!p) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    return purchaseRepo.updatePR(id, data);
  },
  
  approvePR: async (id, itemsApproval) => {
    const pr = await purchaseRepo.findPRById(id);
    if (!pr) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    
    const hasPendingItems = pr.items.some(i => i.status === 'Pending');
    if (!hasPendingItems) {
      throw new AppError('All items in this Purchase Request have already been processed', 400, 'ALREADY_PROCESSED');
    }

    // 1. Update items approval statuses and remarks (rejection reasons)
    if (itemsApproval && Array.isArray(itemsApproval)) {
      await prisma.$transaction(
        itemsApproval.map(item =>
          prisma.purchaseRequestItem.update({
            where: { id: parseInt(item.itemId) },
            data: { 
              status: item.status,
              remarks: item.remarks || undefined
            }
          })
        )
      );
    } else {
      await prisma.purchaseRequestItem.updateMany({
        where: { purchaseRequestId: id, status: 'Pending' },
        data: { status: 'Approved' }
      });
    }

    const updatedPR = await purchaseRepo.findPRById(id);
    const totalItems = updatedPR.items.length;
    const approvedCount = updatedPR.items.filter(i => i.status === 'Approved').length;
    const rejectedCount = updatedPR.items.filter(i => i.status === 'Rejected').length;

    let overallStatus = 'Pending';
    if (approvedCount + rejectedCount === totalItems) {
      if (approvedCount === totalItems) {
        overallStatus = 'Approved';
      } else if (rejectedCount === totalItems) {
        overallStatus = 'Rejected';
      } else {
        overallStatus = 'Partially Approved';
      }
    } else {
      if (approvedCount > 0) {
        overallStatus = 'Partially Approved';
      } else {
        overallStatus = 'Pending';
      }
    }

    return purchaseRepo.updatePR(id, { status: overallStatus });
  },

  rejectPR: async (id, remarks) => {
    const pr = await purchaseRepo.findPRById(id);
    if (!pr) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    
    await prisma.purchaseRequestItem.updateMany({
      where: { purchaseRequestId: id },
      data: { status: 'Rejected', remarks: remarks || 'Rejected by manager' }
    });

    return purchaseRepo.updatePR(id, { status: 'Rejected', remarks: remarks || 'Rejected by manager' });
  },

  // ── PO Services ──────────────────────────────────────────────────────────
  createPO: async (data) => {
    if (data.prId) {
      const existingPO = await prisma.purchaseOrder.findFirst({
        where: {
          prId: data.prId,
          status: { not: 'Cancelled' }
        }
      });
      if (existingPO) {
        throw new AppError(`A Purchase Order (${existingPO.id}) has already been generated from this Purchase Request. Duplicate orders are blocked.`, 400, 'DUPLICATE_PO');
      }
    }

    return purchaseRepo.createPO(data);
  },

  getAllPOs: async () => purchaseRepo.findAllPOs(),
  getPOById: async (id) => {
    const p = await purchaseRepo.findPOById(id);
    if (!p) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    return p;
  },

  updatePO: async (id, data) => {
    const po = await purchaseRepo.findPOById(id);
    if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    if (po.status === 'Completed' || po.status === 'Closed') {
      throw new AppError('Completed or closed Purchase Orders cannot be edited.', 400, 'READ_ONLY_ORDER');
    }
    return purchaseRepo.updatePO(id, data);
  },

  createPOFromPR: async (prId, poData) => {
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id: prId },
      include: { items: true }
    });
    if (!pr) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    if (pr.status !== 'Approved' && pr.status !== 'Partially Approved') {
      throw new AppError('Purchase Request must be approved first', 400, 'NOT_APPROVED');
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: {
        prId,
        status: { not: 'Cancelled' }
      }
    });
    if (existingPO) {
      throw new AppError(`A Purchase Order (${existingPO.id}) has already been generated from this Purchase Request.`, 400, 'DUPLICATE_PO');
    }

    const approvedItems = pr.items.filter(item => item.status === 'Approved');
    if (approvedItems.length === 0) {
      throw new AppError('No approved medicines in this Purchase Request.', 400, 'NO_APPROVED_ITEMS');
    }

    const newPOItems = (poData.items || []).filter(item => 
      approvedItems.some(ai => ai.medicineId === item.medicineId)
    );

    if (newPOItems.length === 0) {
      throw new AppError('None of the ordered items are approved in the linked PR.', 400, 'NO_MATCHING_APPROVED_ITEMS');
    }

    const newPO = await purchaseRepo.createPO({
      ...poData,
      prId,
      status: 'Draft',
      items: newPOItems
    });

    await prisma.purchaseRequest.update({
      where: { id: prId },
      data: { status: 'PO Generated' }
    });

    return newPO;
  },

  sendPO: async (id) => {
    const po = await purchaseRepo.findPOById(id);
    if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    if (po.status !== 'Draft') throw new AppError('Only Draft POs can be sent.', 400, 'INVALID_STATUS');
    return purchaseRepo.updatePO(id, { status: 'Sent', poDate: new Date() });
  },

  closePO: async (id) => {
    const po = await purchaseRepo.findPOById(id);
    if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    
    const allProcessed = po.items.every(item => {
      return (item.receivedQty || 0) + (item.cancelledQty || 0) >= item.qty;
    });

    if (!allProcessed) {
      throw new AppError('Cannot close Purchase Order. Every item must be fully received or cancelled first.', 400, 'ITEMS_NOT_PROCESSED');
    }

    return purchaseRepo.updatePO(id, { status: 'Completed' });
  },

  updatePOStatus: async (id, body) => {
    const po = await purchaseRepo.findPOById(id);
    if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    return purchaseRepo.updatePO(id, { status: body.status });
  },

  // ── Shipments Services ────────────────────────────────────────────────────
  createShipment: async (data) => {
    const { poId, trackingId, invoiceNumber, items } = data;
    const po = await purchaseRepo.findPOById(poId);
    if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    if (po.status === 'Draft' || po.status === 'Completed' || po.status === 'Cancelled') {
      throw new AppError(`Cannot create shipments for PO in ${po.status} state.`, 400, 'INVALID_PO_STATE');
    }

    for (const item of (items || [])) {
      const poItem = po.items.find(pi => pi.medicineId === item.medicineId);
      if (!poItem) {
        throw new AppError(`Medicine ${item.medicineId} is not part of Purchase Order ${poId}.`, 400, 'INVALID_ITEM');
      }
      if (parseInt(item.qty) <= 0) {
        throw new AppError('Shipped quantity must be greater than zero.', 400, 'INVALID_QTY');
      }
    }

    const shipment = await purchaseRepo.createShipment(data);

    if (po.status === 'Sent' || po.status === 'Accepted') {
      await purchaseRepo.updatePO(poId, { status: 'Shipped' });
    }

    return shipment;
  },

  updateShipmentStatus: async (id, status) => {
    const shipment = await purchaseRepo.findShipmentById(id);
    if (!shipment) throw new AppError('Shipment not found', 404, 'NOT_FOUND');
    
    const updateData = { status };
    if (status === 'Delivered') {
      updateData.deliveryDate = new Date();
    }

    const updatedShipment = await purchaseRepo.updateShipment(id, updateData);

    const po = await purchaseRepo.findPOById(shipment.poId);
    if (po) {
      let nextPOStatus = po.status;
      if (status === 'Supplier Accepted') {
        nextPOStatus = 'Accepted';
      } else if (status === 'Shipped') {
        nextPOStatus = 'Shipped';
      } else if (status === 'In Transit') {
        nextPOStatus = 'In Transit';
      } else if (status === 'Delivered') {
        nextPOStatus = 'Delivered';
      }

      if (nextPOStatus !== po.status) {
        await purchaseRepo.updatePO(shipment.poId, { status: nextPOStatus });
      }
    }

    return updatedShipment;
  },

  getShipmentsByPO: async (poId) => {
    return prisma.shipment.findMany({
      where: { poId },
      include: { items: { include: { medicine: true } } }
    });
  },

  // ── GRN Services ──────────────────────────────────────────────────────────
  createGRN: async (data, user) => {
    const { id, poId, shipmentId, invoiceNumber, receivedBy, items, savedAsDraft } = data;
    if (!poId) throw new AppError('Purchase Order ID is required', 400, 'BAD_REQUEST');

    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });
      if (!po) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
      if (po.status === 'COMPLETED' || po.status === 'Completed') {
        throw new AppError('This Purchase Order is already Completed. No further GRNs can be recorded.', 400, 'READ_ONLY_ORDER');
      }

      const grnId = id || `GRN-${Date.now().toString().slice(-4)}`;
      const isFinal = !savedAsDraft;

      if (isFinal) {
        if (!invoiceNumber || !invoiceNumber.trim()) {
          throw new AppError('Supplier Invoice reference number is required before final GRN save.', 400, 'BAD_REQUEST');
        }

        const existingInvoice = await tx.gRN.findFirst({
          where: {
            supplierId: po.supplierId,
            invoiceNumber: invoiceNumber.trim(),
            id: { not: grnId }
          }
        });
        if (existingInvoice) {
          throw new AppError('This invoice number already exists for this supplier. Please request or enter a different invoice number.', 400, 'DUPLICATE_INVOICE');
        }

        if (shipmentId) {
          const existingGRN = await tx.gRN.findFirst({
            where: { shipmentId, id: { not: grnId } }
          });
          if (existingGRN) {
            throw new AppError(`A GRN (${existingGRN.id}) has already been recorded for this Shipment. Duplicate entry blocked.`, 400, 'DUPLICATE_GRN');
          }
        }
      }

      if (id) {
        await tx.gRNItem.deleteMany({
          where: { grnId: id }
        });
      }

      let grnStatus = 'Approved';
      let allResolved = true;

      const grnItemsToCreate = [];
      for (const item of (items || [])) {
        const poItem = po.items.find(pi => pi.medicineId === item.medicineId);
        if (!poItem) {
          throw new AppError(`Item ${item.medicineName} is not part of this Purchase Order.`, 400, 'INVALID_ITEM');
        }

        const ordered = poItem.qty;
        const rx = parseInt(item.receivedQty) || 0;
        const dmg = parseInt(item.damagedQty) || 0;
        const accepted = Math.max(0, rx - dmg);
        const cancelled = parseInt(item.cancelledQty) || 0;
        const pending = Math.max(0, ordered - poItem.receivedQty - rx - cancelled);

        if (isFinal) {
          if (rx + cancelled <= 0) {
            throw new AppError(`Total processed quantity (Received + Cancelled) for ${item.medicineName} must be greater than zero.`, 400, 'INVALID_QUANTITY');
          }
          const remainingOrdered = ordered - poItem.receivedQty - poItem.cancelledQty;
          if (rx + cancelled > remainingOrdered) {
            throw new AppError(`Received quantity + cancelled quantity (${rx + cancelled}) for ${item.medicineName} cannot exceed the remaining ordered quantity (${remainingOrdered}).`, 400, 'EXCEEDED_ORDER_QTY');
          }
          if (dmg > rx) {
            throw new AppError(`Damaged quantity (${dmg}) cannot exceed received quantity (${rx}) for ${item.medicineName}.`, 400, 'INVALID_DAMAGED_QTY');
          }
          if (accepted > 0) {
            if (!item.batchNumber || !item.batchNumber.trim()) {
              throw new AppError(`Batch Number is mandatory for accepted items of ${item.medicineName}.`, 400, 'BATCH_REQUIRED');
            }
            if (!item.expiryDate) {
              throw new AppError(`Expiry Date is mandatory for accepted items of ${item.medicineName}.`, 400, 'EXP_DATE_REQUIRED');
            }
            const exp = new Date(item.expiryDate);
            const today = new Date();
            if (exp <= today) {
              throw new AppError(`Expired medicine ${item.medicineName} (Expiry: ${exp.toLocaleDateString()}) cannot be accepted.`, 400, 'EXPIRED_MEDICINE');
            }
          }
        }

        let itemStatus = 'Pending';
        if (cancelled > 0 && rx === 0) {
          itemStatus = 'Cancelled';
        } else if (dmg > 0 && accepted === 0) {
          itemStatus = 'Damaged';
        } else if (rx > 0 && pending === 0) {
          itemStatus = 'Received';
        } else if (rx > 0) {
          itemStatus = 'Partially Received';
        }

        if (pending > 0) {
          allResolved = false;
        }

        grnItemsToCreate.push({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          orderedQty: ordered,
          receivedQty: rx,
          damagedQty: dmg,
          acceptedQty: accepted,
          pendingQty: pending,
          cancelledQty: cancelled,
          batchNumber: item.batchNumber || 'N/A',
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(),
          mfgDate: item.mfgDate ? new Date(item.mfgDate) : new Date(),
          status: itemStatus,
          remarks: item.remarks || '',
          cancelledBy: item.cancelledBy || null,
          cancelledDate: item.cancelledDate || null,
          cancelledTime: item.cancelledTime || null,
          cancelReason: item.cancelReason || null
        });
      }

      if (allResolved && isFinal) {
        grnStatus = 'Completed';
      } else if (isFinal) {
        grnStatus = 'Partially Received';
      }

      const grnData = {
        poId,
        supplierId: po.supplierId,
        shipmentId: shipmentId || null,
        invoiceNumber: invoiceNumber ? invoiceNumber.trim() : null,
        receivedBy: receivedBy || 'Inventory Staff',
        status: savedAsDraft ? 'Draft' : grnStatus,
        savedAsDraft: !!savedAsDraft,
        completedDate: savedAsDraft ? null : new Date(),
        receivedDate: new Date()
      };

      const createdGRN = await tx.gRN.upsert({
        where: { id: grnId },
        update: grnData,
        create: {
          id: grnId,
          ...grnData
        }
      });

      for (const gi of grnItemsToCreate) {
        await tx.gRNItem.create({
          data: {
            grnId: createdGRN.id,
            ...gi
          }
        });
      }

      if (isFinal) {
        if (shipmentId) {
          await tx.shipment.update({
            where: { id: shipmentId },
            data: { status: 'Delivered', deliveryDate: new Date() }
          });
        }

        for (const gi of grnItemsToCreate) {
          const acceptedQty = gi.acceptedQty;
          const poItem = po.items.find(pi => pi.medicineId === gi.medicineId);

          const newReceivedQty = poItem.receivedQty + gi.receivedQty;
          const newDamagedQty = poItem.damagedQty + gi.damagedQty;
          const newCancelledQty = poItem.cancelledQty + gi.cancelledQty;

          let poItemStatus = 'Pending';
          if (newReceivedQty + newCancelledQty >= poItem.qty) {
            poItemStatus = 'Received';
          } else if (newReceivedQty > 0) {
            poItemStatus = 'Partially Received';
          }

          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQty: newReceivedQty,
              damagedQty: newDamagedQty,
              cancelledQty: newCancelledQty,
              status: poItemStatus
            }
          });

          if (acceptedQty <= 0) continue;

          const batchNo = gi.batchNumber.trim();
          const existingBatch = await tx.medicineBatch.findFirst({
            where: { batchNumber: batchNo, medicineId: gi.medicineId }
          });

          if (existingBatch) {
            await tx.medicineBatch.update({
              where: { id: existingBatch.id },
              data: { stockQty: { increment: acceptedQty } }
            });
          } else {
            await tx.medicineBatch.create({
              data: {
                medicineId: gi.medicineId,
                batchNumber: batchNo,
                expiryDate: gi.expiryDate,
                stockQty: acceptedQty,
                status: 'Active'
              }
            });
          }

          await tx.medicine.update({
            where: { id: gi.medicineId },
            data: { stockQuantity: { increment: acceptedQty } }
          });

          const activeCompartments = await tx.compartment.findMany({
            where: { isDeleted: false, status: 'Active' },
            include: { rack: true, medicineLocations: true }
          });

          const medicine = await tx.medicine.findUnique({
            where: { id: gi.medicineId },
            include: { category: true }
          });
          const categoryName = medicine?.category?.name || 'General';

          let allocatedComp = activeCompartments.find(c => {
            const compCat = (c.category || '').toLowerCase();
            const matchesCategory = compCat.includes(categoryName.toLowerCase());
            const currentUsage = c.medicineLocations.reduce((sum, loc) => sum + loc.qty, 0);
            return matchesCategory && (c.maxCapacity - currentUsage) > 0;
          });

          if (!allocatedComp) {
            allocatedComp = activeCompartments.find(c => {
              const currentUsage = c.medicineLocations.reduce((sum, loc) => sum + loc.qty, 0);
              return (c.maxCapacity - currentUsage) > 0;
            });
          }

          let rackQty = 0;
          let warehouseQty = acceptedQty;

          if (allocatedComp) {
            const currentUsage = allocatedComp.medicineLocations.reduce((sum, loc) => sum + loc.qty, 0);
            const space = allocatedComp.maxCapacity - currentUsage;
            if (acceptedQty <= space) {
              rackQty = acceptedQty;
              warehouseQty = 0;
            } else {
              rackQty = space;
              warehouseQty = acceptedQty - space;
            }

            await tx.medicineLocation.create({
              data: {
                compartmentId: allocatedComp.id,
                medicineId: gi.medicineId,
                batchNumber: batchNo,
                qty: rackQty
              }
            });
          }

          if (warehouseQty > 0) {
            let warehouse = await tx.warehouse.findFirst({
              where: { status: 'Active', isDeleted: false }
            });
            if (!warehouse) {
              warehouse = await tx.warehouse.create({
                data: { name: 'Central Warehouse A', code: 'CWH-A', status: 'Active', type: 'Central' }
              });
            }
            await tx.warehouseStock.upsert({
              where: { warehouseId_medicineId: { warehouseId: warehouse.id, medicineId: gi.medicineId } },
              update: { qty: { increment: warehouseQty } },
              create: { warehouseId: warehouse.id, medicineId: gi.medicineId, qty: warehouseQty }
            });
          }

          await tx.inventoryLog.create({
            data: {
              medicineId: gi.medicineId,
              medicineName: gi.medicineName,
              type: 'Stock In',
              qty: acceptedQty,
              user: receivedBy || 'Inventory Staff',
              remarks: `GRN ${createdGRN.id} — Rack: ${rackQty}, Warehouse: ${warehouseQty}`
            }
          });

          await tx.stockLedger.create({
            data: {
              medicineId: gi.medicineId,
              batchNumber: batchNo,
              transactionType: 'GRN_RECEIVE',
              quantity: acceptedQty,
              referenceId: createdGRN.id
            }
          });
        }

        const updatedPOItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: poId }
        });
        const allDone = updatedPOItems.every(pi => pi.receivedQty + pi.cancelledQty >= pi.qty);
        const anyDone = updatedPOItems.some(pi => pi.receivedQty > 0);

        let newPOStatus = 'PO_CONFIRMED';
        if (allDone) {
          newPOStatus = 'Completed';
        } else if (anyDone) {
          newPOStatus = 'Partially Received';
        }

        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: newPOStatus }
        });
      }

      // Verify user exists before setting FK to avoid constraint violation
      let auditUserId = null;
      if (user?.userId) {
        const existingUser = await tx.user.findUnique({ where: { id: user.userId }, select: { id: true } });
        if (existingUser) auditUserId = existingUser.id;
      }

      await tx.auditLog.create({
        data: {
          userId: auditUserId,
          userName: user?.email || receivedBy || 'Inventory Staff',
          action: savedAsDraft ? 'GRN Draft Saved' : 'GRN Logged',
          details: `GRN ${createdGRN.id} ${savedAsDraft ? 'draft saved' : 'generated'} for PO ${poId}`
        }
      });

      return {
        ...createdGRN,
        items: await tx.gRNItem.findMany({ where: { grnId: createdGRN.id } })
      };
    });
  },

  getAllGRNs: async () => purchaseRepo.findAllGRNs(),
  getGRNById: async (id) => {
    const g = await purchaseRepo.findGRNById(id);
    if (!g) throw new AppError('GRN not found', 404, 'NOT_FOUND');
    return g;
  },

  getCompletedPOs: async () => {
    return prisma.purchaseOrder.findMany({
      where: { status: { in: ['COMPLETED', 'Completed'] } },
      include: {
        items: { include: { medicine: true } },
        supplier: true,
        grns: { include: { items: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  getCompletedGRNs: async () => {
    return prisma.gRN.findMany({
      where: {
        status: { in: ['COMPLETED', 'Completed', 'Approved', 'Finalized'] }
      },
      include: {
        items: { include: { medicine: true } },
        purchaseOrder: { include: { supplier: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  validateInvoiceNumber: async (supplierId, invoiceNumber, excludeGrnId) => {
    if (!supplierId || !invoiceNumber) return false;
    
    // Find if any completed or draft GRN for this supplier has the same invoice number
    const whereClause = {
      purchaseOrder: {
        supplierId: supplierId
      },
      invoiceNumber: invoiceNumber
    };
    
    if (excludeGrnId) {
      whereClause.id = { not: excludeGrnId };
    }
    
    const existing = await prisma.gRN.findFirst({
      where: whereClause
    });
    
    return !!existing;
  },

  updateGRN: async (id, data, user) => {
    const grn = await prisma.gRN.findUnique({ where: { id } });
    if (!grn) throw new AppError('GRN not found', 404);
    
    // Process update logic similar to createGRN but replacing the existing one
    // Since this is updating an existing GRN, we just update fields for now
    // Actually, in an ERP, modifying a saved GRN draft is allowed.
    // If it's finalized, it might be restricted.
    
    // To implement GRN Draft Editability properly, we update it
    const updateData = {
      invoiceNumber: data.invoiceNumber || grn.invoiceNumber,
      savedAsDraft: data.savedAsDraft !== undefined ? data.savedAsDraft : grn.savedAsDraft,
      status: data.savedAsDraft ? 'Draft' : 'COMPLETED'
    };
    
    const updatedGrn = await prisma.gRN.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        purchaseOrder: { include: { supplier: true } }
      }
    });
    
    return updatedGrn;
  },

  getLowStockMedicines: async () => {
    const medicines = await prisma.medicine.findMany({
      where: {
        isDeleted: false,
        isActive: true
      },
      include: {
        supplier: true,
        purchaseOrderItems: {
          where: {
            purchaseOrder: {
              status: { not: 'CANCELLED' }
            }
          },
          include: {
            purchaseOrder: true
          },
          orderBy: {
            id: 'desc'
          }
        }
      }
    });

    const lowStockList = [];
    for (const med of medicines) {
      const poItems = med.purchaseOrderItems || [];
      poItems.sort((a, b) => new Date(b.purchaseOrder.createdAt) - new Date(a.purchaseOrder.createdAt));
      const latestPOItem = poItems[0];
      const latestPO = latestPOItem ? latestPOItem.purchaseOrder : null;

      let status = 'Pending Approval';
      let poId = null;
      let lastOrderedDate = null;

      if (latestPO) {
        lastOrderedDate = latestPO.createdAt;
        if (latestPO.status === 'COMPLETED' || latestPO.status === 'Completed') {
          if (med.stockQuantity <= med.reorderLevel) {
            status = 'Pending Approval';
            poId = null;
          } else {
            status = 'Completed';
            poId = latestPO.id;
          }
        } else if (latestPO.status !== 'CANCELLED' && latestPO.status !== 'Cancelled') {
          status = 'PO Generated';
          poId = latestPO.id;
        }
      }

      const isLowStock = med.stockQuantity <= med.reorderLevel;

      if (isLowStock || status === 'Completed' || status === 'PO Generated') {
        lowStockList.push({
          id: med.id,
          medicineName: med.medicineName,
          medicineCode: med.skuCode || med.id,
          stockQuantity: med.stockQuantity,
          reorderLevel: med.reorderLevel,
          defaultSupplierId: med.supplierId,
          defaultSupplierName: med.supplier ? med.supplier.name : 'Unknown Supplier',
          suggestedQuantity: Math.max(med.reorderLevel * 2, 50),
          status,
          poId,
          lastOrderedDate
        });
      }
    }
    return lowStockList;
  },

  createPOFromLowStock: async (data, user) => {
    const { medicineId, qty } = data;
    if (!medicineId) throw new AppError('Medicine ID is required', 400);

    const med = await prisma.medicine.findUnique({
      where: { id: medicineId },
      include: { supplier: true }
    });

    if (!med) throw new AppError('Medicine not found', 404);

    let supplierId = med.supplierId;
    if (!supplierId) {
      const firstSupplier = await prisma.supplier.findFirst({
        where: { isDeleted: false, isActive: true }
      });
      if (!firstSupplier) {
        throw new AppError('No active suppliers found in database to map this medicine.', 400);
      }
      supplierId = firstSupplier.id;
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: {
        status: { in: ['PO_GENERATED', 'PO_CONFIRMED', 'PARTIALLY_RECEIVED', 'Pending', 'Confirmed', 'Partially Received'] },
        items: {
          some: {
            medicineId
          }
        }
      }
    });

    if (existingPO) {
      throw new AppError(`A Purchase Order (${existingPO.id}) already exists for this medicine.`, 400);
    }

    const poId = await generatePOId(null);

    const orderQty = parseInt(qty) || Math.max(med.reorderLevel * 2, 50);
    const price = Number(med.pricePerPiece) || 15.00;
    const taxPercentage = Number(med.taxPercentage) || 0;
    const itemTotal = orderQty * price * (1 + (taxPercentage / 100));
    const subtotalVal = orderQty * price;

    const now = new Date();
    const poTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return prisma.purchaseOrder.create({
      data: {
        id: poId,
        supplierId,
        poDate: now,
        poTime: poTimeStr,
        subtotal: subtotalVal,
        total: itemTotal,
        status: 'PO_GENERATED',
        createdBy: user?.email || 'System Dashboard',
        items: {
          create: [{
            medicineId,
            medicineName: med.medicineName,
            qty: orderQty,
            defaultPrice: price,
            unitPrice: price,
            tax: taxPercentage,
            total: itemTotal,
            receivedQty: 0,
            damagedQty: 0,
            cancelledQty: 0,
            status: 'Pending'
          }]
        }
      },
      include: {
        items: { include: { medicine: true } },
        supplier: true
      }
    });
  },

  confirmPO: async (id) => {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status !== 'PO_GENERATED' && po.status !== 'Draft') {
      throw new AppError(`Only POs in PO_GENERATED or Draft status can be confirmed. Current status: ${po.status}`, 400);
    }
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'PO_CONFIRMED' },
      include: { items: { include: { medicine: true } }, supplier: true }
    });
  },

  cancelPO: async (id) => {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status === 'COMPLETED' || po.status === 'CANCELLED' || po.status === 'Completed' || po.status === 'Cancelled') {
      throw new AppError(`Completed or already cancelled POs cannot be cancelled.`, 400);
    }
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { medicine: true } }, supplier: true }
    });
  },

  getGRNByPOId: async (poId) => {
    return prisma.gRN.findMany({
      where: { poId },
      include: { items: { include: { medicine: true } } }
    });
  },

  getProcurementHistory: async () => {
    return prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED', 'Completed', 'Cancelled'] }
      },
      include: {
        items: { include: { medicine: true } },
        supplier: true,
        grns: {
          include: {
            items: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }
};

// ─── PURCHASE CONTROLLER ─────────────────────────────────────────────────────
export const purchaseController = {
  // ── Purchase Requests ─────────────────────────────────────────────────────
  getAllPRs: async (req, res, next) => {
    try {
      const d = await purchaseService.getAllPRs();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getPRById: async (req, res, next) => {
    try {
      const d = await purchaseService.getPRById(req.params.id);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createPR: async (req, res, next) => {
    try {
      const d = await purchaseService.createPR(req.body);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  updatePR: async (req, res, next) => {
    try {
      const d = await purchaseService.updatePR(req.params.id, req.body);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  approvePR: async (req, res, next) => {
    try {
      const d = await purchaseService.approvePR(req.params.id, req.body.items);
      res.json({ success: true, data: d, message: 'Purchase Request approved successfully.' });
    } catch (e) { next(e); }
  },

  rejectPR: async (req, res, next) => {
    try {
      const { remarks } = req.body;
      const d = await purchaseService.rejectPR(req.params.id, remarks);
      res.json({ success: true, data: d, message: 'Purchase Request rejected.' });
    } catch (e) { next(e); }
  },

  // ── Purchase Orders ───────────────────────────────────────────────────────
  getAllPOs: async (req, res, next) => {
    try {
      const d = await purchaseService.getAllPOs();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getPOById: async (req, res, next) => {
    try {
      const d = await purchaseService.getPOById(req.params.id);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createPO: async (req, res, next) => {
    try {
      const d = await purchaseService.createPO(req.body);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  updatePO: async (req, res, next) => {
    try {
      const d = await purchaseService.updatePO(req.params.id, req.body);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createPOFromPR: async (req, res, next) => {
    try {
      const { prId, ...poData } = req.body;
      if (!prId) return res.status(400).json({ success: false, message: 'prId is required' });
      const d = await purchaseService.createPOFromPR(prId, poData);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  sendPO: async (req, res, next) => {
    try {
      const d = await purchaseService.sendPO(req.params.id);
      res.json({ success: true, data: d, message: 'Purchase Order marked as Sent.' });
    } catch (e) { next(e); }
  },

  closePO: async (req, res, next) => {
    try {
      const d = await purchaseService.closePO(req.params.id);
      res.json({ success: true, data: d, message: 'Purchase Order completed successfully.' });
    } catch (e) { next(e); }
  },

  updatePOStatus: async (req, res, next) => {
    try {
      const d = await purchaseService.updatePOStatus(req.params.id, req.body);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getPOProgress: async (req, res, next) => {
    try {
      const po = await purchaseService.getPOById(req.params.id);
      const totalOrdered = po.items.reduce((sum, item) => sum + item.qty, 0);
      const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQty, 0);
      const progress = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
      res.json({ success: true, data: { progress, totalOrdered, totalReceived } });
    } catch (e) { next(e); }
  },

  getCompletedPOs: async (req, res, next) => {
    try {
      const d = await purchaseService.getCompletedPOs();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  // ── Shipments ─────────────────────────────────────────────────────────────
  getAllShipments: async (req, res, next) => {
    try {
      const d = await purchaseRepo.findAllShipments();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getShipmentsByPO: async (req, res, next) => {
    try {
      const d = await purchaseService.getShipmentsByPO(req.params.poId);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createShipment: async (req, res, next) => {
    try {
      const d = await purchaseService.createShipment(req.body);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  updateShipmentStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const d = await purchaseService.updateShipmentStatus(req.params.id, status);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  // ── GRN ──────────────────────────────────────────────────────────────────
  getAllGRNs: async (req, res, next) => {
    try {
      const d = await purchaseService.getAllGRNs();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getGRNById: async (req, res, next) => {
    try {
      const d = await purchaseService.getGRNById(req.params.id);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createGRN: async (req, res, next) => {
    try {
      const d = await purchaseService.createGRN(req.body, req.user);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getCompletedGRNs: async (req, res, next) => {
    try {
      const d = await purchaseService.getCompletedGRNs();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  getLowStockMedicines: async (req, res, next) => {
    try {
      const d = await purchaseService.getLowStockMedicines();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  createPOFromLowStock: async (req, res, next) => {
    try {
      const d = await purchaseService.createPOFromLowStock(req.body, req.user);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  confirmPO: async (req, res, next) => {
    try {
      const d = await purchaseService.confirmPO(req.params.id);
      res.json({ success: true, data: d, message: 'Purchase Order confirmed successfully.' });
    } catch (e) { next(e); }
  },

  cancelPO: async (req, res, next) => {
    try {
      const d = await purchaseService.cancelPO(req.params.id);
      res.json({ success: true, data: d, message: 'Purchase Order cancelled successfully.' });
    } catch (e) { next(e); }
  },

  getGRNByPOId: async (req, res, next) => {
    try {
      const d = await purchaseService.getGRNByPOId(req.params.poId);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  validateInvoiceNumber: async (req, res, next) => {
    try {
      const { supplierId, invoiceNumber, excludeGrnId } = req.query;
      const d = await purchaseService.validateInvoiceNumber(supplierId, invoiceNumber, excludeGrnId);
      res.json({ success: true, exists: d });
    } catch (e) { next(e); }
  },

  updateGRN: async (req, res, next) => {
    try {
      const d = await purchaseService.updateGRN(req.params.id, req.body, req.user);
      res.json({ success: true, data: d, message: 'GRN updated successfully.' });
    } catch (e) { next(e); }
  },

  updateStockAfterGRN: async (req, res, next) => {
    try {
      const { medicineId, qty } = req.body;
      if (!medicineId) return res.status(400).json({ success: false, message: 'medicineId is required' });
      const updated = await prisma.medicine.update({
        where: { id: medicineId },
        data: { stockQuantity: { increment: parseInt(qty) || 0 } }
      });
      res.json({ success: true, data: updated, message: 'Stock updated successfully.' });
    } catch (e) { next(e); }
  },

  getProcurementHistory: async (req, res, next) => {
    try {
      const d = await purchaseService.getProcurementHistory();
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  }
};
