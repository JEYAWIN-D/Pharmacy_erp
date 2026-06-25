import prisma from '../../config/prisma.js';

export const hrRepository = {
  // Departments
  findDepartments: () => prisma.department.findMany(),
  findDepartmentById: (id) => prisma.department.findUnique({ where: { id } }),
  createDepartment: (data) => prisma.department.create({ data }),
  updateDepartment: (id, data) => prisma.department.update({ where: { id }, data }),
  deleteDepartment: (id) => prisma.department.delete({ where: { id } }),

  // Designations
  findDesignations: () => prisma.designation.findMany(),
  findDesignationById: (id) => prisma.designation.findUnique({ where: { id } }),
  createDesignation: (data) => prisma.designation.create({ data }),
  updateDesignation: (id, data) => prisma.designation.update({ where: { id }, data }),
  deleteDesignation: (id) => prisma.designation.delete({ where: { id } }),

  // Employees
  findEmployees: () => prisma.employee.findMany({ include: { department: true, designation: true } }),
  findEmployeeById: (id) => prisma.employee.findUnique({ where: { id }, include: { department: true, designation: true, documents: true, shifts: { include: { shift: true } } } }),
  createEmployee: (data) => prisma.employee.create({ data }),
  updateEmployee: (id, data) => prisma.employee.update({ where: { id }, data }),
  deleteEmployee: (id) => prisma.employee.delete({ where: { id } }),

  // Shifts
  findShifts: () => prisma.shift.findMany(),
  findShiftById: (id) => prisma.shift.findUnique({ where: { id } }),
  createShift: (data) => prisma.shift.create({ data }),
  updateShift: (id, data) => prisma.shift.update({ where: { id }, data }),
  deleteShift: (id) => prisma.shift.delete({ where: { id } }),

  // Employee Shifts
  assignShift: (employeeId, shiftId) => prisma.employeeShift.upsert({
    where: { employeeId },
    update: { shiftId, assignedDate: new Date() },
    create: { employeeId, shiftId, assignedDate: new Date() }
  }),

  // Attendance
  findAttendance: (employeeId, date) => prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date } } }),
  findAttendances: (filter) => prisma.attendance.findMany({ where: filter, include: { employee: true }, orderBy: { date: 'desc' } }),
  createAttendance: (data) => prisma.attendance.create({ data }),
  updateAttendance: (id, data) => prisma.attendance.update({ where: { id }, data }),

  // Leaves
  findLeaves: (filter) => prisma.leave.findMany({ where: filter, include: { employee: true }, orderBy: { createdAt: 'desc' } }),
  findLeaveById: (id) => prisma.leave.findUnique({ where: { id } }),
  createLeave: (data) => prisma.leave.create({ data }),
  updateLeave: (id, data) => prisma.leave.update({ where: { id }, data }),

  // Payroll
  findPayrolls: (filter) => prisma.payroll.findMany({ where: filter, include: { employee: true }, orderBy: { createdAt: 'desc' } }),
  findPayrollById: (id) => prisma.payroll.findUnique({ where: { id }, include: { employee: { include: { department: true, designation: true } } } }),
  findPayrollByEmpAndMonth: (employeeId, payrollMonth) => prisma.payroll.findUnique({ where: { employeeId_payrollMonth: { employeeId, payrollMonth } } }),
  createPayroll: (data) => prisma.payroll.create({ data }),
  updatePayroll: (id, data) => prisma.payroll.update({ where: { id }, data }),

  // Documents
  createDocument: (data) => prisma.employeeDocument.create({ data }),
  deleteDocument: (id) => prisma.employeeDocument.delete({ where: { id } })
};
