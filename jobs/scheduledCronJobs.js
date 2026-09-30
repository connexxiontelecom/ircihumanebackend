const _ = require('lodash');
const differenceInCalendarMonths = require('date-fns/differenceInCalendarMonths');
const { generateMasterList } = require('../services/master_list_service');
const leaveApplicationService = require('../services/leaveApplicationService');
const leaveTypeService = require('../services/leaveTypeService');
const employeeService = require('../services/employeeService');
const leaveAccrualService = require('../services/leaveAccrualService');
const employee = require('../services/employeeService');
const user = require('../services/userService');
const logs = require('../services/logService');
const { addLeaveAccrual } = require('../routes/leaveAccrual');

async function updateApprovedLeaveStatus() {
  try {
    const approvedLeaves = await leaveApplicationService.getLeavesByStatus(1);
    const activeLeaves = await leaveApplicationService.getLeavesByStatus(3);
    approvedLeaves.map(async (re) => {
      if (new Date().getTime() >= new Date(re.leapp_start_date).getTime() && re.leapp_status === 1) {
        await leaveApplicationService.updateLeaveAppStatus(re.leapp_id, 3);
      }
    });
    activeLeaves.map(async (act) => {
      if (new Date().getTime() >= new Date(act.leapp_end_date).getTime() && act.leapp_status === 3) {
        await leaveApplicationService.updateLeaveAppStatus(act.leapp_id, 4);
      }
    });
    await logs.addLog({
      log_user_id: 1,
      log_description: 'Update Approved Leave Status Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error from update approved leave status cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
  }
}

async function travelDayLeaveAccrual() {
  try {
    const travelDayLeave = await leaveTypeService.getLeaveTypeByName('Travel Day');
    const cDate = new Date();
    const currentDay = cDate.getDate();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentDate = `${currentDay}-${currentMonth}-${currentYear}`;

    let travelAccrualDays = [`1-10-${currentYear}`, `1-1-${currentYear}`, `1-4-${currentYear}`, `1-7-${currentYear}`];
    let travelAccrualExpires = [`${currentYear + 1}-1-14`, `${currentYear}-4-14`, `${currentYear}-7-14`, `${currentYear}-9-14`];
    if (!_.isEmpty(travelDayLeave) || !_.isNull(travelDayLeave)) {
      const nonRelocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(0);

      if (travelAccrualDays.includes(currentDate)) {
        nonRelocatableEmployees.map(async (reEmp) => {
          const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(
            reEmp.emp_id,
            currentMonth,
            currentYear,
            travelDayLeave.leave_type_id
          );
          const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
          if (_.isEmpty(existing) || _.isNull(existing)) {
            let expiresOn = null;
            if (currentDate === travelAccrualDays[0]) {
              expiresOn = travelAccrualExpires[0];
            } else if (currentDate === travelAccrualDays[1]) {
              expiresOn = travelAccrualExpires[1];
            } else if (currentDate === travelAccrualDays[2]) {
              expiresOn = travelAccrualExpires[2];
            } else if (currentDate === travelAccrualDays[3]) {
              expiresOn = travelAccrualExpires[3];
            }
            const data = {
              lea_emp_id: reEmp.emp_id,
              lea_month: currentMonth,
              lea_year: currentYear,
              lea_leave_type: travelDayLeave.leave_type_id,
              lea_rate: parseFloat(travelDayLeave.lt_rate),
              lea_archives: 0,
              lea_leaveapp_id: 0,
              lea_expires_on: expiresOn,
              lea_fy: calendarYear
            };
            await leaveAccrualService.addLeaveAccrual(data);
          }
        });
      }
      const leaveAccruals = await leaveAccrualService.getLeaveAccruals();
      leaveAccruals.map(async (leaveAccr) => {
        if (new Date() >= new Date(leaveAccr.lea_expires_on) && leaveAccr.lea_archives === 0) {
          await leaveAccrualService.archiveAccrual(leaveAccr.lea_id);
        }
      });
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'Travel Day Leave Routine Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error from travel day leave routine cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
  }
}

async function runCronJobForRnRLeaveType() {
  try {
    const months = [2, 4, 6, 8, 10, 12];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    await leaveApplicationService.getApprovedLeaves();
    const rNrLeaveType = await leaveTypeService.getLeaveTypeByName('R & R');
    if (!_.isEmpty(rNrLeaveType) || !_.isNull(rNrLeaveType)) {
      const relocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(1);

      if (months.includes(currentMonth)) {
        relocatableEmployees.map(async (reEmp) => {
          const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(
            reEmp.emp_id,
            currentMonth,
            currentYear,
            rNrLeaveType.leave_type_id
          );
          if (_.isEmpty(existing) || _.isNull(existing)) {
            let expiresOn = `${currentYear}-${currentMonth === 12 ? 1 : currentMonth + 1}-15`;
            const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
            const data = {
              lea_emp_id: reEmp.emp_id,
              lea_month: currentMonth,
              lea_year: currentYear,
              lea_leave_type: rNrLeaveType.leave_type_id,
              lea_rate: parseFloat(rNrLeaveType.lt_rate),
              lea_archives: 0,
              lea_leaveapp_id: 0,
              lea_expires_on: expiresOn,
              lea_fy: calendarYear
            };
            await leaveAccrualService.addLeaveAccrual(data);
          }
        });
      }
      await logs.addLog({
        log_user_id: 1,
        log_description: 'R N R Leave Routine Cron Job',
        log_date: new Date()
      });
    }
  } catch (e) {
    const errorMessage = `error from R N R leave routine cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
  }
}

async function runGeneralMonthlyLeaveRoutine() {
  try {
    const leaveTypesData = await leaveTypeService.getLeavesWithOptions(1, 0, 1);
    const employees = await employee.getAllActiveEmployees();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
    const leaveYear = currentMonth <= 9 ? currentYear : currentYear + 1;
    const expiresOn = `${leaveYear}-09-30`;
    for (const emp of employees) {
      for (const leaveType of leaveTypesData) {
        const existingLeaveAccruals = await leaveAccrualService.findLeaveAccrualByLeaveTypePositive(
          emp.emp_id,
          currentMonth,
          currentYear,
          leaveType.leave_type_id
        );
        if (_.isEmpty(existingLeaveAccruals) || _.isNull(existingLeaveAccruals)) {
          const leaveAccrual = {
            lea_emp_id: emp.emp_id,
            lea_month: currentMonth,
            lea_year: currentYear,
            lea_leave_type: leaveType.leave_type_id,
            lea_rate: parseFloat(leaveType.lt_rate),
            lea_leaveapp_id: 0,
            lea_archives: 0,
            lea_expires_on: expiresOn,
            lea_fy: calendarYear
          };
          await addLeaveAccrual(leaveAccrual);
        }
      }
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'General Monthly Leave Routine Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error general monthly leave routine cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
    console.error(e);
  }
}

async function runGeneralYearlyLeaveRoutine() {
  try {
    const leaveTypesData = await leaveTypeService.getLeavesWithOptions(1, 0, 2);
    const employees = await employee.getAllActiveEmployees();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
    const leaveYear = currentMonth <= 9 ? currentYear : currentYear + 1;
    const expiresOn = `${leaveYear}-09-30`;
    for (const emp of employees) {
      for (const leaveType of leaveTypesData) {
        const existingLeaveAccruals = await leaveAccrualService.findLeaveAccrualByLeaveTypeFYyearPositiveExcludeMonth(
          emp.emp_id,
          calendarYear,
          leaveType.leave_type_id
        );
        if (_.isEmpty(existingLeaveAccruals) || _.isNull(existingLeaveAccruals)) {
          const leaveAccrual = {
            lea_emp_id: emp.emp_id,
            lea_month: currentMonth,
            lea_year: currentYear,
            lea_leave_type: leaveType.leave_type_id,
            lea_rate: parseFloat(leaveType.lt_rate),
            lea_leaveapp_id: 0,
            lea_archives: 0,
            lea_expires_on: expiresOn,
            lea_fy: calendarYear
          };
          await addLeaveAccrual(leaveAccrual);
        }
      }
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'General Yearly Leave Routine Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error from general yearly leave routine cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
    console.error(e);
  }
}

async function endEmployeeContract() {
  try {
    const employees = await employee.getActiveEmployees([1, 2]);
    for (const emp of employees) {
      let contractEndDate = new Date(emp.emp_contract_end_date);
      let contractEndYear = contractEndDate.getFullYear();
      let contractEndMonth = contractEndDate.getMonth() + 1;
      let contractEndDay = contractEndDate.getDate();
      if (contractEndDay < 10) contractEndDay = '0' + contractEndDay;
      if (contractEndMonth < 10) contractEndMonth = '0' + contractEndMonth;
      const today = new Date();
      const yyyy = today.getFullYear();
      let mm = today.getMonth() + 1;
      let dd = today.getDate();
      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;
      const currentDateFormatted = `${yyyy}-${mm}-${dd}`;
      const contractEndDateFormatted = `${contractEndYear}-${contractEndMonth}-${contractEndDay}`;
      if (currentDateFormatted === contractEndDateFormatted) {
        await user.suspendUser(emp.emp_unique_id);
      }
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'End Employee Contract Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error from end employee contract cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
  }
}

async function updateHireType() {
  try {
    const employees = await employee.getActiveEmployees([1, 2]);
    for (const emp of employees) {
      const employeeType = emp.emp_employee_type;
      if (!employeeType) {
        continue;
      }
      if (employeeType.toLowerCase() === 'employee') {
        let hiredDate = new Date(emp.emp_hire_date);
        const differenceInMonthsFromHireDateToToday = differenceInCalendarMonths(new Date(), hiredDate);
        let hireType = null;
        if (differenceInMonthsFromHireDateToToday > 0 && differenceInMonthsFromHireDateToToday <= 6) {
          hireType = 'short-term';
        } else if (differenceInMonthsFromHireDateToToday > 6 && differenceInMonthsFromHireDateToToday <= 36) {
          hireType = 'limited-term';
        } else if (differenceInMonthsFromHireDateToToday > 36) {
          hireType = 'regular';
        }
        await employeeService.updateEmployeeHireType(emp.emp_id, hireType);
      }
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'Update Hire Type Cron Job',
      log_date: new Date()
    });
  } catch (e) {
    const errorMessage = `error from update hire type cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
    console.log('error from update hire type');
    console.log(e.message);
  }
}

async function clearOldLogs() {
  try {
    await logs.deleteLogs();
  } catch (e) {
    const errorMessage = `error clear old logs cron job ${e.message}`;
    await logs.addLog({
      log_user_id: 1,
      log_description: errorMessage,
      log_date: new Date()
    });
  }
}

function startCronJobs() {
  const nodeCron = require('node-cron');
  const salaryCronJobs = require('../routes/cronJobs/salary_cron');

  nodeCron.schedule('0 6 * * *', updateApprovedLeaveStatus).start();
  nodeCron.schedule('0 6 * * *', travelDayLeaveAccrual).start();
  nodeCron.schedule('0 0 1 * *', runCronJobForRnRLeaveType).start();
  nodeCron.schedule('0 5 * * *', runGeneralMonthlyLeaveRoutine).start();
  nodeCron.schedule('0 5 * * *', runGeneralYearlyLeaveRoutine).start();
  nodeCron.schedule('* 6 * * *', endEmployeeContract).start();
  nodeCron.schedule('0 4 * * *', updateHireType).start();
  nodeCron.schedule('* 3 * * *', clearOldLogs).start();
  nodeCron.schedule('0 0 * * *', generateMasterList).start();
  nodeCron.schedule('0 */1 * * *', salaryCronJobs.computeSalaryLocations).start();

  console.log('[startup] Cron jobs enabled');
}

module.exports = { startCronJobs };
