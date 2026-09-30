#!/usr/bin/env node
/**
 * One-off cron runner for SSH / scheduled tasks.
 * Does NOT start Express — runs one job and exits.
 *
 * Usage (from /home/ircng/irc-api):
 *   node run-cron.js list
 *   node run-cron.js updateApprovedLeaveStatus
 *   node run-cron.js travelDayLeaveAccrual
 *   node run-cron.js runGeneralMonthlyLeaveRoutine
 */
require('dotenv').config();

const _ = require('lodash');
const differenceInCalendarMonths = require('date-fns/differenceInCalendarMonths');
const { generateMasterList } = require('./services/master_list_service');
const leaveApplicationService = require('./services/leaveApplicationService');
const leaveTypeService = require('./services/leaveTypeService');
const employeeService = require('./services/employeeService');
const leaveAccrualService = require('./services/leaveAccrualService');
const employee = require('./services/employeeService');
const user = require('./services/userService');
const logs = require('./services/logService');
const { addLeaveAccrual } = require('./routes/leaveAccrual');

async function updateApprovedLeaveStatus() {
  const approvedLeaves = await leaveApplicationService.getLeavesByStatus(1);
  const activeLeaves = await leaveApplicationService.getLeavesByStatus(3);
  for (const re of approvedLeaves) {
    if (new Date().getTime() >= new Date(re.leapp_start_date).getTime() && re.leapp_status === 1) {
      await leaveApplicationService.updateLeaveAppStatus(re.leapp_id, 3);
    }
  }
  for (const act of activeLeaves) {
    if (new Date().getTime() >= new Date(act.leapp_end_date).getTime() && act.leapp_status === 3) {
      await leaveApplicationService.updateLeaveAppStatus(act.leapp_id, 4);
    }
  }
  await logs.addLog({
    log_user_id: 1,
    log_description: 'Update Approved Leave Status Cron Job',
    log_date: new Date()
  });
}

async function travelDayLeaveAccrual(options = {}) {
  const force = Boolean(options.force);
  const travelDayLeave = await leaveTypeService.getLeaveTypeByName('Travel Day');
  const cDate = new Date();
  const currentDay = cDate.getDate();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentDate = `${currentDay}-${currentMonth}-${currentYear}`;
  // TEMP: use 21-7 so you can run today; change 4th entry back to `1-7-${currentYear}` after.
  const travelAccrualDays = [`1-10-${currentYear}`, `1-1-${currentYear}`, `1-4-${currentYear}`, `21-7-${currentYear}`];
  const travelAccrualExpires = [`${currentYear + 1}-1-14`, `${currentYear}-4-14`, `${currentYear}-7-14`, `${currentYear}-9-14`];

  console.log(`[travelDay] today=${currentDate} scheduledDays=${travelAccrualDays.join(', ')} force=${force}`);

  if (_.isEmpty(travelDayLeave) || _.isNull(travelDayLeave)) {
    console.log('[travelDay] Leave type "Travel Day" not found — nothing to do');
    return;
  }

  const nonRelocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(0);
  console.log(`[travelDay] non-relocatable employees=${nonRelocatableEmployees.length}`);

  const shouldAccrue = force || travelAccrualDays.includes(currentDate);
  if (!shouldAccrue) {
    console.log(
      `[travelDay] Skipped accrual (today is not 1 Jan / 1 Apr / 1 Jul / 1 Oct). ` +
        `Re-run with: node run-cron.js travelDayLeaveAccrual --force`
    );
  } else {
    // When forced off-schedule, use the Jul (Q3) bucket if we are in Jul–Sep, else nearest prior quarter day.
    let effectiveDate = currentDate;
    let expiresOn = null;
    if (force && !travelAccrualDays.includes(currentDate)) {
      if (currentMonth >= 10) {
        effectiveDate = travelAccrualDays[0];
        expiresOn = travelAccrualExpires[0];
      } else if (currentMonth >= 7) {
        effectiveDate = travelAccrualDays[3];
        expiresOn = travelAccrualExpires[3];
      } else if (currentMonth >= 4) {
        effectiveDate = travelAccrualDays[2];
        expiresOn = travelAccrualExpires[2];
      } else {
        effectiveDate = travelAccrualDays[1];
        expiresOn = travelAccrualExpires[1];
      }
      console.log(`[travelDay] Force mode using period date=${effectiveDate} expiresOn=${expiresOn}`);
    }

    let created = 0;
    let skippedExisting = 0;
    for (const reEmp of nonRelocatableEmployees) {
      const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(
        reEmp.emp_id,
        currentMonth,
        currentYear,
        travelDayLeave.leave_type_id
      );
      const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
      if (_.isEmpty(existing) || _.isNull(existing)) {
        if (!force || travelAccrualDays.includes(currentDate)) {
          expiresOn = null;
          if (currentDate === travelAccrualDays[0] || effectiveDate === travelAccrualDays[0]) {
            expiresOn = travelAccrualExpires[0];
          } else if (currentDate === travelAccrualDays[1] || effectiveDate === travelAccrualDays[1]) {
            expiresOn = travelAccrualExpires[1];
          } else if (currentDate === travelAccrualDays[2] || effectiveDate === travelAccrualDays[2]) {
            expiresOn = travelAccrualExpires[2];
          } else if (currentDate === travelAccrualDays[3] || effectiveDate === travelAccrualDays[3]) {
            expiresOn = travelAccrualExpires[3];
          }
        }
        await leaveAccrualService.addLeaveAccrual({
          lea_emp_id: reEmp.emp_id,
          lea_month: currentMonth,
          lea_year: currentYear,
          lea_leave_type: travelDayLeave.leave_type_id,
          lea_rate: parseFloat(travelDayLeave.lt_rate),
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: expiresOn,
          lea_fy: calendarYear
        });
        created += 1;
      } else {
        skippedExisting += 1;
      }
    }
    console.log(`[travelDay] Accruals created=${created} skippedExisting=${skippedExisting}`);
  }

  const leaveAccruals = await leaveAccrualService.getLeaveAccruals();
  let archived = 0;
  for (const leaveAccr of leaveAccruals) {
    if (new Date() >= new Date(leaveAccr.lea_expires_on) && leaveAccr.lea_archives === 0) {
      await leaveAccrualService.archiveAccrual(leaveAccr.lea_id);
      archived += 1;
    }
  }
  console.log(`[travelDay] Expired accruals archived=${archived}`);

  await logs.addLog({
    log_user_id: 1,
    log_description: 'Travel Day Leave Routine Cron Job',
    log_date: new Date()
  });
}

async function runCronJobForRnRLeaveType() {
  const months = [2, 4, 6, 8, 10, 12];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  await leaveApplicationService.getApprovedLeaves();
  const rNrLeaveType = await leaveTypeService.getLeaveTypeByName('R & R');
  if (!_.isEmpty(rNrLeaveType) || !_.isNull(rNrLeaveType)) {
    const relocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(1);
    if (months.includes(currentMonth)) {
      for (const reEmp of relocatableEmployees) {
        const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(
          reEmp.emp_id,
          currentMonth,
          currentYear,
          rNrLeaveType.leave_type_id
        );
        if (_.isEmpty(existing) || _.isNull(existing)) {
          const expiresOn = `${currentYear}-${currentMonth === 12 ? 1 : currentMonth + 1}-15`;
          const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
          await leaveAccrualService.addLeaveAccrual({
            lea_emp_id: reEmp.emp_id,
            lea_month: currentMonth,
            lea_year: currentYear,
            lea_leave_type: rNrLeaveType.leave_type_id,
            lea_rate: parseFloat(rNrLeaveType.lt_rate),
            lea_archives: 0,
            lea_leaveapp_id: 0,
            lea_expires_on: expiresOn,
            lea_fy: calendarYear
          });
        }
      }
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'R N R Leave Routine Cron Job',
      log_date: new Date()
    });
  }
}

async function runGeneralMonthlyLeaveRoutine(options = {}) {
  const leaveTypesData = await leaveTypeService.getLeavesWithOptions(1, 0, 1);
  let employees = await employee.getAllActiveEmployees();
  const filterIds = (options.employees || [])
    .map((id) => String(id).trim().toUpperCase())
    .filter(Boolean);

  if (filterIds.length) {
    employees = employees.filter((emp) =>
      filterIds.includes(String(emp.emp_unique_id || '').toUpperCase())
    );
    console.log(
      `[monthlyLeave] Filtering to ${filterIds.join(', ')} — matched ${employees.length} employee(s)`
    );
    const matched = new Set(employees.map((e) => String(e.emp_unique_id || '').toUpperCase()));
    const missing = filterIds.filter((id) => !matched.has(id));
    if (missing.length) {
      console.warn(`[monthlyLeave] Not found / inactive: ${missing.join(', ')}`);
    }
  } else {
    console.log(`[monthlyLeave] Processing all active employees (${employees.length})`);
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const calendarYear = currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear + 1}`;
  const leaveYear = currentMonth <= 9 ? currentYear : currentYear + 1;
  const expiresOn = `${leaveYear}-09-30`;
  let created = 0;
  let skipped = 0;

  for (const emp of employees) {
    for (const leaveType of leaveTypesData) {
      const existingLeaveAccruals = await leaveAccrualService.findLeaveAccrualByLeaveTypePositive(
        emp.emp_id,
        currentMonth,
        currentYear,
        leaveType.leave_type_id
      );
      if (_.isEmpty(existingLeaveAccruals) || _.isNull(existingLeaveAccruals)) {
        await addLeaveAccrual({
          lea_emp_id: emp.emp_id,
          lea_month: currentMonth,
          lea_year: currentYear,
          lea_leave_type: leaveType.leave_type_id,
          lea_rate: parseFloat(leaveType.lt_rate),
          lea_leaveapp_id: 0,
          lea_archives: 0,
          lea_expires_on: expiresOn,
          lea_fy: calendarYear
        });
        created += 1;
        console.log(
          `[monthlyLeave] Created ${leaveType.leave_name || leaveType.leave_type_id} for ${emp.emp_unique_id}`
        );
      } else {
        skipped += 1;
        if (filterIds.length) {
          console.log(
            `[monthlyLeave] Skipped ${emp.emp_unique_id} leave=${leaveType.leave_name || leaveType.leave_type_id} — existing record: id=${existingLeaveAccruals.lea_id} month=${existingLeaveAccruals.lea_month} year=${existingLeaveAccruals.lea_year} rate=${existingLeaveAccruals.lea_rate} fy=${existingLeaveAccruals.lea_fy} archives=${existingLeaveAccruals.lea_archives}`
          );
        }
      }
    }
  }

  console.log(`[monthlyLeave] Done. created=${created} skippedExisting=${skipped}`);
  await logs.addLog({
    log_user_id: 1,
    log_description: filterIds.length
      ? `General Monthly Leave Routine Cron Job (${filterIds.join(',')})`
      : 'General Monthly Leave Routine Cron Job',
    log_date: new Date()
  });
}

async function runGeneralYearlyLeaveRoutine() {
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
        await addLeaveAccrual({
          lea_emp_id: emp.emp_id,
          lea_month: currentMonth,
          lea_year: currentYear,
          lea_leave_type: leaveType.leave_type_id,
          lea_rate: parseFloat(leaveType.lt_rate),
          lea_leaveapp_id: 0,
          lea_archives: 0,
          lea_expires_on: expiresOn,
          lea_fy: calendarYear
        });
      }
    }
  }
  await logs.addLog({
    log_user_id: 1,
    log_description: 'General Yearly Leave Routine Cron Job',
    log_date: new Date()
  });
}

async function endEmployeeContract() {
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
    if (`${yyyy}-${mm}-${dd}` === `${contractEndYear}-${contractEndMonth}-${contractEndDay}`) {
      await user.suspendUser(emp.emp_unique_id);
    }
  }
  await logs.addLog({
    log_user_id: 1,
    log_description: 'End Employee Contract Cron Job',
    log_date: new Date()
  });
}

async function updateHireType() {
  const employees = await employee.getActiveEmployees([1, 2]);
  for (const emp of employees) {
    const employeeType = emp.emp_employee_type;
    if (!employeeType) continue;
    if (employeeType.toLowerCase() === 'employee') {
      const hiredDate = new Date(emp.emp_hire_date);
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
}

async function clearOldLogs() {
  await logs.deleteLogs();
}

async function computeSalaryLocations() {
  const salaryCronJobs = require('./routes/cronJobs/salary_cron');
  await salaryCronJobs.computeSalaryLocations();
}

const JOBS = {
  updateApprovedLeaveStatus,
  travelDayLeaveAccrual,
  runCronJobForRnRLeaveType,
  runGeneralMonthlyLeaveRoutine,
  runGeneralYearlyLeaveRoutine,
  endEmployeeContract,
  updateHireType,
  clearOldLogs,
  generateMasterList,
  computeSalaryLocations
};

async function main() {
  const args = process.argv.slice(2);
  const name = args.find((a) => !a.startsWith('-'));
  const force = args.includes('--force') || args.includes('-f');
  const employeesArg = args.find((a) => a.startsWith('--employees='));
  const employees = employeesArg
    ? employeesArg.replace('--employees=', '').split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!name || name === 'list' || name === '--help' || name === '-h') {
    console.log('Available jobs:');
    Object.keys(JOBS).forEach((n) => console.log(`  ${n}`));
    console.log('\nExample: node run-cron.js updateApprovedLeaveStatus');
    console.log('Force Travel Day off-schedule: node run-cron.js travelDayLeaveAccrual --force');
    console.log(
      'Monthly for specific staff: node run-cron.js runGeneralMonthlyLeaveRoutine --employees=NG1335,NG1446'
    );
    process.exit(name ? 0 : 1);
  }

  const fn = JOBS[name];
  if (!fn) {
    console.error(`Unknown job: ${name}`);
    console.error('Run: node run-cron.js list');
    process.exit(1);
  }

  console.log(`[cron] Starting ${name}...`);
  const started = Date.now();
  try {
    await fn({ force, employees });
    console.log(`[cron] Finished ${name} in ${Date.now() - started}ms`);
    process.exit(0);
  } catch (err) {
    console.error(`[cron] Failed ${name}:`, err);
    process.exit(1);
  }
}

main();
