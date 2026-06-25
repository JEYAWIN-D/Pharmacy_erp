import { hrService } from './hr.service.js';

export const hrController = {
  // Employees
  getEmployees: async (req, res, next) => {
    try { const data = await hrService.getEmployees(); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  getEmployeeById: async (req, res, next) => {
    try { const data = await hrService.getEmployeeById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  createEmployee: async (req, res, next) => {
    try { const data = await hrService.createEmployee(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  updateEmployee: async (req, res, next) => {
    try { const data = await hrService.updateEmployee(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  deleteEmployee: async (req, res, next) => {
    try { await hrService.deleteEmployee(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); }
  },

  // Departments
  getDepartments: async (req, res, next) => {
    try { const data = await hrService.getDepartments(); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  createDepartment: async (req, res, next) => {
    try { const data = await hrService.createDepartment(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  updateDepartment: async (req, res, next) => {
    try { const data = await hrService.updateDepartment(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  deleteDepartment: async (req, res, next) => {
    try { await hrService.deleteDepartment(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); }
  },

  // Designations
  getDesignations: async (req, res, next) => {
    try { const data = await hrService.getDesignations(); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  createDesignation: async (req, res, next) => {
    try { const data = await hrService.createDesignation(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  updateDesignation: async (req, res, next) => {
    try { const data = await hrService.updateDesignation(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  deleteDesignation: async (req, res, next) => {
    try { await hrService.deleteDesignation(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); }
  },

  // Shifts
  getShifts: async (req, res, next) => {
    try { const data = await hrService.getShifts(); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  createShift: async (req, res, next) => {
    try { const data = await hrService.createShift(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  updateShift: async (req, res, next) => {
    try { const data = await hrService.updateShift(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  deleteShift: async (req, res, next) => {
    try { await hrService.deleteShift(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); }
  },
  assignShift: async (req, res, next) => {
    try { const data = await hrService.assignShift(req.body.employeeId, req.body.shiftId); res.json({ success: true, data }); } catch (e) { next(e); }
  },

  // Attendance
  checkIn: async (req, res, next) => {
    try { const data = await hrService.checkIn(req.body.employeeId); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  checkOut: async (req, res, next) => {
    try { const data = await hrService.checkOut(req.body.employeeId); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  getAttendance: async (req, res, next) => {
    try { const data = await hrService.getAttendance(req.query); res.json({ success: true, data }); } catch (e) { next(e); }
  },

  // Leaves
  applyLeave: async (req, res, next) => {
    try { const data = await hrService.applyLeave(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  getLeaves: async (req, res, next) => {
    try { const data = await hrService.getLeaves(req.query); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  updateLeaveStatus: async (req, res, next) => {
    try { const data = await hrService.updateLeaveStatus(req.params.id, req.body.status, req.user?.username || 'Admin'); res.json({ success: true, data }); } catch (e) { next(e); }
  },

  // Payroll
  generatePayroll: async (req, res, next) => {
    try { const data = await hrService.generatePayroll(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  getPayrolls: async (req, res, next) => {
    try { const data = await hrService.getPayrolls(req.query); res.json({ success: true, data }); } catch (e) { next(e); }
  },
  getPayrollById: async (req, res, next) => {
    try { const data = await hrService.getPayrollById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
  },

  // Documents
  uploadDocument: async (req, res, next) => {
    try { const data = await hrService.uploadDocument(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
  },
  deleteDocument: async (req, res, next) => {
    try { await hrService.deleteDocument(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); }
  }
};
