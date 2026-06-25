import { useState } from 'react';
import { useDB } from '../../db/DBContext';

export function useColdStorageController() {
  const {
    currentTemp,
    setCurrentTemp,
    tempLogs,
    setTempLogs,
    notifications,
    setNotifications
  } = useDB();

  const [vaccinesChecklist, setVaccinesChecklist] = useState([
    { id: 1, name: 'Covishield Vaccine', activeTemp: '4.2°C', safetyCheck: true },
    { id: 2, name: 'BCG Vaccine', activeTemp: '3.8°C', safetyCheck: true },
    { id: 3, name: 'Hepatitis B lot', activeTemp: '4.5°C', safetyCheck: false }
  ]);

  const handleTempSlider = (e) => {
    const newVal = parseFloat(e.target.value);
    setCurrentTemp(newVal);
    
    let status = 'Normal';
    if (newVal > 8.0 || newVal < 2.0) {
      status = 'Critical';
    }
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTempLogs([{ time: timeStr, temp: newVal, status: status }, ...tempLogs.slice(0, 5)]);

    if (status === 'Critical') {
      setNotifications([
        {
          id: Date.now(),
          type: 'danger',
          message: `⚠️ TEMPERATURE ALERT: Fridge is too warm/cold at ${newVal}°C!`,
          time: 'Just now',
          resolved: false
        },
        ...notifications
      ]);
    }
  };

  return {
    currentTemp,
    tempLogs,
    vaccinesChecklist,
    handleTempSlider
  };
}
