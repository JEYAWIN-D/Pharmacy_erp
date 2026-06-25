import { hrRepository } from './hr.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const hrService = {
  // Employees
  getEmployees: async () => hrRepository.findEmployees(),
  getEmployeeById: async (id) => hrRepository.findEmployeeById(id),
  createEmployee: async (data) => {
    // Unique check
    const existing = await hrRepository.findEmployees();
    if (existing.some(e => e.empCode === data.empCode)) throw new AppError('Employee Code already exists', 400);
    if (existing.some(e => e.email === data.email)) throw new AppError('Email already exists', 400);
    
    if (data.departmentId === '') data.departmentId = null;
    if (data.designationId === '') data.designationId = null;
    
    return hrRepository.createEmployee(data);
  },
  updateEmployee: async (id, data) => {
    if (data.departmentId === '') data.departmentId = null;
    if (data.designationId === '') data.designationId = null;
    return hrRepository.updateEmployee(id, data);
  },
  deleteEmployee: async (id) => hrRepository.deleteEmployee(id),

  // Departments & Designations
  getDepartments: async () => hrRepository.findDepartments(),
  createDepartment: async (data) => hrRepository.createDepartment(data),
  updateDepartment: async (id, data) => hrRepository.updateDepartment(id, data),
  deleteDepartment: async (id) => hrRepository.deleteDepartment(id),

  getDesignations: async () => hrRepository.findDesignations(),
  createDesignation: async (data) => hrRepository.createDesignation(data),
  updateDesignation: async (id, data) => hrRepository.updateDesignation(id, data),
  deleteDesignation: async (id) => hrRepository.deleteDesignation(id),

  // Shifts
  getShifts: async () => hrRepository.findShifts(),
  createShift: async (data) => hrRepository.createShift(data),
  updateShift: async (id, data) => hrRepository.updateShift(id, data),
  deleteShift: async (id) => hrRepository.deleteShift(id),
  assignShift: async (employeeId, shiftId) => hrRepository.assignShift(employeeId, shiftId),

  // Attendance
  checkIn: async (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await hrRepository.findAttendance(employeeId, today);
    if (attendance) {
      if (attendance.checkIn) throw new AppError('Already checked in today', 400);
      return hrRepository.updateAttendance(attendance.id, { checkIn: new Date(), status: 'Present' });
    }
    return hrRepository.createAttendance({
      employeeId,
      date: today,
      checkIn: new Date(),
      status: 'Present'
    });
  },
  checkOut: async (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await hrRepository.findAttendance(employeeId, today);
    if (!attendance || !attendance.checkIn) throw new AppError('Not checked in today', 400);
    if (attendance.checkOut) throw new AppError('Already checked out today', 400);

    const checkOutTime = new Date();
    const diffMs = checkOutTime - new Date(attendance.checkIn);
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Half day rule: less than 4 hours
    let status = attendance.status;
    if (diffHours < 4) status = 'Half Day';

    return hrRepository.updateAttendance(attendance.id, {
      checkOut: checkOutTime,
      workingHours: diffHours,
      status
    });
  },
  getAttendance: async (filter) => hrRepository.findAttendances(filter),

  // Leaves
  applyLeave: async (data) => {
    const { employeeId, startDate, endDate } = data;
    // Check overlaps
    const existing = await hrRepository.findLeaves({ employeeId, status: { in: ['Approved', 'Pending'] } });
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    
    for (const l of existing) {
      const ls = new Date(l.startDate);
      const le = new Date(l.endDate);
      if ((sDate >= ls && sDate <= le) || (eDate >= ls && eDate <= le) || (sDate <= ls && eDate >= le)) {
        throw new AppError('Leave dates overlap with an existing request', 400);
      }
    }
    return hrRepository.createLeave(data);
  },
  getLeaves: async (filter) => hrRepository.findLeaves(filter),
  updateLeaveStatus: async (id, status, approvedBy) => hrRepository.updateLeave(id, { status, approvedBy }),

  // Payroll
  generatePayroll: async (data) => {
    const { employeeId, payrollMonth, basicSalary, allowances = 0, deductions = 0 } = data;
    
    const exists = await hrRepository.findPayrollByEmpAndMonth(employeeId, payrollMonth);
    if (exists) throw new AppError('Payroll already generated for this month', 400);

    const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);
    
    return hrRepository.createPayroll({
      ...data,
      netSalary
    });
  },
  getPayrolls: async (filter) => hrRepository.findPayrolls(filter),
  getPayrollById: async (id) => hrRepository.findPayrollById(id),

  // Documents
  uploadDocument: async (data) => hrRepository.createDocument(data),
  deleteDocument: async (id) => hrRepository.deleteDocument(id)
};
