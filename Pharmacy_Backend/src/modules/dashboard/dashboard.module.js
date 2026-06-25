import prisma from '../../config/prisma.js';

// ─── DASHBOARD MODULE ──────────────────────────────────────────────────────────

export const dashboardController = {
  getStats: async (req, res, next) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const [
        totalMedicines,
        lowStockMedicines,
        totalSuppliers,
        totalBatches,
        expiringBatches,
        pendingPrescriptions,
        totalCustomers,
        todayBillCount,
        todayRevenue,
        unresolvedNotifications,
        pendingPOs,
        totalInventoryLogs
      ] = await Promise.all([
        prisma.medicine.count({ where: { isDeleted: false, isActive: true } }),
        prisma.medicine.count({ where: { isDeleted: false, isActive: true, stockQuantity: { lte: prisma.medicine.fields.reorderLevel } } }).catch(() => 0),
        prisma.supplier.count({ where: { isDeleted: false, isActive: true } }),
        prisma.medicineBatch.count({ where: { isDeleted: false, status: 'Active' } }),
        prisma.medicineBatch.count({ where: { isDeleted: false, status: 'Active', expiryDate: { lte: ninetyDays, gte: new Date() } } }),
        prisma.prescription.count({ where: { isDeleted: false, status: 'Pending' } }),
        prisma.customer.count({ where: { isDeleted: false } }),
        prisma.bill.count({ where: { isDeleted: false, createdAt: { gte: startOfDay } } }),
        prisma.bill.aggregate({ where: { isDeleted: false, createdAt: { gte: startOfDay }, paymentStatus: 'Paid' }, _sum: { grandTotal: true } }),
        prisma.notification.count({ where: { resolved: false } }),
        prisma.purchaseOrder.count({ where: { status: 'Pending Approval' } }),
        prisma.inventoryLog.count()
      ]);

      // Get medicines with actual low stock (manual check)
      const medicines = await prisma.medicine.findMany({
        where: { isDeleted: false, isActive: true },
        select: { id: true, medicineName: true, stockQuantity: true, reorderLevel: true }
      });
      const lowStock = medicines.filter(m => m.stockQuantity <= m.reorderLevel).length;

      // Recent sales for chart (last 7 days)
      const salesChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        const dayRevenue = await prisma.bill.aggregate({
          where: { isDeleted: false, paymentStatus: 'Paid', createdAt: { gte: start, lte: end } },
          _sum: { grandTotal: true }
        });
        salesChart.push({
          date: start.toISOString().split('T')[0],
          revenue: Number(dayRevenue._sum.grandTotal || 0)
        });
      }

      res.json({
        success: true,
        data: {
          totalMedicines,
          lowStockMedicines: lowStock,
          totalSuppliers,
          totalBatches,
          expiringBatches,
          pendingPrescriptions,
          totalCustomers,
          todayBillCount,
          todayRevenue: Number(todayRevenue._sum.grandTotal || 0),
          unresolvedNotifications,
          pendingPOs,
          totalInventoryLogs,
          salesChart
        }
      });
    } catch (e) { next(e); }
  },

  getTopMedicines: async (req, res, next) => {
    try {
      const topBilled = await prisma.billItem.groupBy({
        by: ['name'],
        _sum: { qty: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10
      });
      res.json({ success: true, data: topBilled });
    } catch (e) { next(e); }
  }
};
