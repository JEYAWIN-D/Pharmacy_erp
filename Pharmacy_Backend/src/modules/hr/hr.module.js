import { Router } from 'express';
import { hrController } from './hr.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// --- DASHBOARD SUMMARY API (Quick aggregation, we can expand later) ---
router.get('/dashboard', authorize('Admin', 'HR Manager'), async (req, res, next) => {
  try {
    const [employees, present, absent, leaves, payrolls] = await Promise.all([
      import('../../config/prisma.js').then(m => m.default.employee.count()),
      import('../../config/prisma.js').then(m => m.default.attendance.count({ where: { date: new Date(new Date().setHours(0,0,0,0)), status: 'Present' }})),
      import('../../config/prisma.js').then(m => m.default.attendance.count({ where: { date: new Date(new Date().setHours(0,0,0,0)), status: 'Absent' }})),
      import('../../config/prisma.js').then(m => m.default.leave.count({ where: { status: 'Pending' }})),
      import('../../config/prisma.js').then(m => m.default.payroll.aggregate({ _sum: { netSalary: true }, where: { status: 'Paid' } }))
    ]);
    res.json({
      success: true,
      data: {
        totalEmployees: employees,
        presentToday: present,
        absentToday: absent,
        pendingLeaves: leaves,
        monthlyPayroll: payrolls._sum.netSalary || 0
      }
    });
  } catch(e) { next(e); }
});

// --- DEPARTMENTS ---
router.get('/departments', hrController.getDepartments);
router.post('/departments', authorize('Admin', 'HR Manager'), hrController.createDepartment);
router.put('/departments/:id', authorize('Admin', 'HR Manager'), hrController.updateDepartment);
router.delete('/departments/:id', authorize('Admin', 'HR Manager'), hrController.deleteDepartment);

// --- DESIGNATIONS ---
router.get('/designations', hrController.getDesignations);
router.post('/designations', authorize('Admin', 'HR Manager'), hrController.createDesignation);
router.put('/designations/:id', authorize('Admin', 'HR Manager'), hrController.updateDesignation);
router.delete('/designations/:id', authorize('Admin', 'HR Manager'), hrController.deleteDesignation);

// --- EMPLOYEES ---
router.get('/employees', hrController.getEmployees);
router.get('/employees/:id', hrController.getEmployeeById);
router.post('/employees', authorize('Admin', 'HR Manager'), hrController.createEmployee);
router.put('/employees/:id', authorize('Admin', 'HR Manager'), hrController.updateEmployee);
router.delete('/employees/:id', authorize('Admin', 'HR Manager'), hrController.deleteEmployee);

// --- SHIFTS ---
router.get('/shifts', hrController.getShifts);
router.post('/shifts', authorize('Admin', 'HR Manager'), hrController.createShift);
router.put('/shifts/:id', authorize('Admin', 'HR Manager'), hrController.updateShift);
router.delete('/shifts/:id', authorize('Admin', 'HR Manager'), hrController.deleteShift);
router.post('/shifts/assign', authorize('Admin', 'HR Manager'), hrController.assignShift);

// --- ATTENDANCE ---
// Pharmacist / Store Manager can check in/out themselves
router.post('/attendance/check-in', hrController.checkIn);
router.post('/attendance/check-out', hrController.checkOut);
router.get('/attendance', hrController.getAttendance);

// --- LEAVES ---
router.post('/leaves', hrController.applyLeave);
router.get('/leaves', hrController.getLeaves);
router.put('/leaves/:id/status', authorize('Admin', 'HR Manager'), hrController.updateLeaveStatus);

// --- PAYROLL ---
router.post('/payrolls', authorize('Admin', 'HR Manager'), hrController.generatePayroll);
router.get('/payrolls', hrController.getPayrolls);
router.get('/payrolls/:id', hrController.getPayrollById);

// --- DOCUMENTS ---
router.post('/documents', authorize('Admin', 'HR Manager'), hrController.uploadDocument);
router.delete('/documents/:id', authorize('Admin', 'HR Manager'), hrController.deleteDocument);

export { router as hrRoutes };
