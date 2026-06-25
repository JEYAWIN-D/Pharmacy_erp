import { useState } from 'react';
import { useDB } from '../../db/DBContext';

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

  const [activePoint, setActivePoint] = useState(null);

  const chartData = [
    { day: 'Jun 01', inbound: 12000, outbound: 8000 },
    { day: 'Jun 02', inbound: 15000, outbound: 11000 },
    { day: 'Jun 03', inbound: 19000, outbound: 14000 },
    { day: 'Jun 04', inbound: 22000, outbound: 18000 },
    { day: 'Jun 05', inbound: 20000, outbound: 21000 },
    { day: 'Jun 06', inbound: 18000, outbound: 24000 },
    { day: 'Jun 07', inbound: 21000, outbound: 23000 },
    { day: 'Jun 08', inbound: 25000, outbound: 20000 },
    { day: 'Jun 09', inbound: 30000, outbound: 19000 },
    { day: 'Jun 10', inbound: 28000, outbound: 22000 },
    { day: 'Jun 11', inbound: 32000, outbound: 26000 },
    { day: 'Jun 12', inbound: 35000, outbound: 31000 },
    { day: 'Jun 13', inbound: 33000, outbound: 38000 },
    { day: 'Jun 14', inbound: 42000, outbound: 45000 }
  ];

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
    activePoint,
    setActivePoint,
    chartData,
    handleRackReallocationSimulation
  };
}
