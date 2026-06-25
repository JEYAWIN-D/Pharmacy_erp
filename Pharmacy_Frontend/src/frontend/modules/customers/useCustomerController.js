import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { CustomerModel } from './CustomerModel';

export function useCustomerController() {
  const { customers, setCustomers, salesHistory, setAuditLogs, auditLogs } = useDB();

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    loyaltyPoints: '0',
    outstandingBalance: '0.00'
  });

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const validation = CustomerModel.validate(newCustomer);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const customerObj = CustomerModel.create(newCustomer, nextId);

    setCustomers([...customers, customerObj]);

    // Log to Audit logs
    const newAuditLog = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin',
      action: 'Customer Registered',
      details: `Added customer profile ${customerObj.name} (Phone: ${customerObj.phone})`
    };
    setAuditLogs([newAuditLog, ...auditLogs]);

    alert('Customer profile created successfully.');
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      loyaltyPoints: '0',
      outstandingBalance: '0.00'
    });
  };

  const handleClearBalance = (customerId) => {
    const target = customers.find(c => c.id === customerId);
    if (!target) return;

    if (window.confirm(`Clear outstanding balance of ₹ ${target.outstandingBalance.toFixed(2)} for ${target.name}?`)) {
      setCustomers(customers.map(c => 
        c.id === customerId ? { ...c, outstandingBalance: 0.00 } : c
      ));

      const newAuditLog = {
        id: `LOG-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toLocaleString(),
        user: 'Admin',
        action: 'Credit Balance Cleared',
        details: `Cleared ₹ ${target.outstandingBalance.toFixed(2)} for customer ${target.name}`
      };
      setAuditLogs([newAuditLog, ...auditLogs]);

      alert(`Cleared balance for ${target.name}.`);
    }
  };

  return {
    customers,
    salesHistory,
    newCustomer,
    setNewCustomer,
    handleAddCustomer,
    handleClearBalance
  };
}
