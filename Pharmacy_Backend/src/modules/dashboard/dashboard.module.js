import prisma from '../../config/prisma.js';

// ─── DASHBOARD MODULE ──────────────────────────────────────────────────────────

export const dashboardController = {
  getStats: async (req, res, next) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [
        todayBills,
        todayCash,
        todayUpi,
        whStockCount,
        rackStockCount,
        supplierPayableAgg,
        customerReceivableAgg,
        urgentNotifs
      ] = await Promise.all([
        prisma.bill.findMany({
          where: { isDeleted: false, createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.paymentTransaction.aggregate({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _sum: { cashPaid: true }
        }),
        prisma.paymentTransaction.aggregate({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _sum: { upiPaid: true }
        }),
        prisma.warehouseStock.aggregate({
          _sum: { qty: true }
        }),
        prisma.rackStock.aggregate({
          _sum: { qty: true }
        }),
        prisma.financeSupplierPayment.aggregate({
          where: { status: { in: ['Pending', 'Partially Paid'] } },
          _sum: { pendingAmount: true }
        }),
        prisma.customer.aggregate({
          _sum: { outstandingBalance: true }
        }),
        prisma.notification.findMany({
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      const todaySales = todayBills.reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);
      const todayCredit = todayBills.reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0);

      // Enforce reorderLevel exact counts
      const allActiveMed = await prisma.medicine.findMany({
        where: { isDeleted: false, isActive: true },
        select: { stockQuantity: true, reorderLevel: true }
      });
      const lowStockRealCount = allActiveMed.filter(m => m.stockQuantity <= m.reorderLevel).length;

      // 7-day chart
      const salesChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        const dayRevenue = await prisma.bill.aggregate({
          where: { isDeleted: false, createdAt: { gte: start, lte: end } },
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
          todaySales,
          todayCashCollection: Number(todayCash._sum.cashPaid || 0),
          todayUpiCollection: Number(todayUpi._sum.upiPaid || 0),
          todayCreditAmount: todayCredit,
          lowStockMedicines: lowStockRealCount,
          warehouseStockSummary: whStockCount._sum.qty || 0,
          rackStockSummary: rackStockCount._sum.qty || 0,
          supplierPayableAmount: Number(supplierPayableAgg._sum.pendingAmount || 0),
          customerReceivableAmount: Number(customerReceivableAgg._sum.outstandingBalance || 0),
          urgentNotifications: urgentNotifs.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            resolved: n.resolved
          })),
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
