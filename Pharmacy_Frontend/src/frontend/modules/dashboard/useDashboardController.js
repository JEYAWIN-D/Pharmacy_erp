import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';
import { dashboardAPI } from '../../db/api';

export function useDashboardController(role) {
  const db = useDB();
  const {
    salesHistory,
    medicines,
    suppliers,
    purchaseOrders,
    batches,
    prescriptions,
    warehouseStock,
    notifications,
    racks,
    setRacks,
    setNotifications
  } = db;

  // Date filter state: 'today' | 'yesterday' | 'custom'
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState({
    totalSalesToday: 0,
    todayCollectionsCash: 0,
    todayCollectionsUPI: 0,
    creditSalesToday: 0,
    lowStockAlertsCount: 0,
    lowStockItems: [],
    totalWarehouseStock: 0,
    totalRackStock: 0,
    totalSupplierPayable: 0,
    customerReceivable: 0,
    urgentNotifications: [],
    salesChart: [],
    totalBillsCount: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await dashboardAPI.getStats();
      if (res.success && res.data) {
        setStats({
          totalSalesToday:         Number(res.data.todaySales ?? 0),
          todayCollectionsCash:    Number(res.data.todayCashCollection ?? 0),
          todayCollectionsUPI:     Number(res.data.todayUpiCollection ?? 0),
          creditSalesToday:        Number(res.data.todayCreditAmount ?? 0),
          lowStockAlertsCount:     res.data.lowStockMedicines ?? 0,
          lowStockItems:           res.data.lowStockItems || [],
          totalWarehouseStock:     res.data.warehouseStockSummary ?? 0,
          totalRackStock:          res.data.rackStockSummary ?? 0,
          totalSupplierPayable:    Number(res.data.supplierPayableAmount ?? 0),
          customerReceivable:      Number(res.data.customerReceivableAmount ?? 0),
          urgentNotifications:     res.data.urgentNotifications || [],
          salesChart:              res.data.salesChart || [],
          totalBillsCount:         0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [salesHistory, warehouseStock]);

  // Compute filtered sales based on dateFilter
  const getFilteredSales = () => {
    if (!Array.isArray(salesHistory)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return salesHistory.filter(s => {
      const sDate = new Date(s.createdAt || s.date);
      sDate.setHours(0, 0, 0, 0);
      if (dateFilter === 'today') return sDate.getTime() === today.getTime();
      if (dateFilter === 'yesterday') return sDate.getTime() === yesterday.getTime();
      if (dateFilter === 'custom') {
        const cd = new Date(customDate);
        cd.setHours(0, 0, 0, 0);
        return sDate.getTime() === cd.getTime();
      }
      return true;
    });
  };

  const handleRackReallocationSimulation = () => {
    const updatedRacks = racks.map(rack => {
      if (rack.id === 'A1') return { ...rack, status: 'Full' };
      return rack;
    });
    setRacks(updatedRacks);
    const newAlert = {
      id: Date.now(),
      type: 'warning',
      message: 'Automatic Allocation Alert: Rack A1 is full! Diverting Paracetamol lot to Rack A2.',
      time: 'Just now',
      resolved: false
    };
    setNotifications([newAlert, ...notifications]);
    alert('Rack A1 marked Full. Auto-diversion log pushed to alerts.');
  };

  return {
    salesHistory,
    medicines,
    suppliers,
    purchaseOrders,
    batches,
    prescriptions,
    warehouseStock,
    notifications,
    handleRackReallocationSimulation,
    stats,
    loadingStats,
    refetchStats: fetchStats,
    // Date filter
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    getFilteredSales,
  };
}
