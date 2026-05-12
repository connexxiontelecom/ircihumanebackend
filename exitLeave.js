const {sequelize, Sequelize} = require('./services/db');

const leaveApplication = require('./services/leaveApplicationService')
const leaveAccrualService = require("./services/leaveAccrualService");
const hrFocalPointModel = require("./models/hrfocalpoint")(sequelize, Sequelize.DataTypes);
const employeeModel = require("./models/Employee")(sequelize, Sequelize.DataTypes);
const authorizationModel = require("./models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const leaveAppModel = require("./models/leaveapplication")(sequelize, Sequelize.DataTypes);
const leaveTypeService = require('./services/leaveTypeService');
const reader = require('xlsx')
const fs = require('fs')
const _ = require("lodash");
const authorizationAction = require("./services/authorizationActionService");
const mailer = require("./services/IRCMailer");
const notificationModel = require('./models/notification')(sequelize, Sequelize.DataTypes);

async function runLeaveSpillOver() {
  let counter = 0;
  try {
    const readOpts = { // <--- need these settings in readFile options
      cellText:false,
      cellDates:true
    };
    const leaveSpillOverFile = reader.readFile('./Exit_Leave_2.xlsx', readOpts);
   // console.log(leaveSpillOverFile)
    let rows = [];
    const jsonOpts = {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false,
      dateNF: 'd"/"m"/"yyyy' // <--- need dateNF in sheet_to_json options (note the escape chars)
    }
    const sheets = leaveSpillOverFile.SheetNames;
    const temp = reader.utils.sheet_to_json(
      leaveSpillOverFile.Sheets[leaveSpillOverFile.SheetNames[0]])
    //console.log(temp)
    //console.log("I got her");

    for (const res1 of temp) {
      const emp = await employeeModel.getEmployeeByUniqueId(res1.T7)
      let month = getMonthFromDate(normalizeExcelDate(res1.StartDate));
      const accrualData = {
        lea_emp_id: emp.emp_id,
        lea_month: month,
        lea_year: 2025,
        lea_leave_type:  15,
        lea_rate: res1.LeaveLength,
        lea_archives: 0,
        lea_leaveapp_id: 0,
        lea_expires_on: '1990-01-01',
        lea_fy: 'FY2025',
        leave_narration:'Exit leave'
      };
      const leaveApp = {
        leapp_empid: emp.emp_id,
        leapp_leave_type: 15,
        leapp_start_date: normalizeExcelDate(res1.StartDate),
        leapp_end_date: normalizeExcelDate(res1.EndDate),
        leapp_total_days: res1.LeaveLength,
        leapp_year: 2025,
        leapp_alt_phone: emp.leapp_alt_phone,
        leapp_alt_email: emp.leapp_alt_phone,
        leapp_holidays: 1,
        leapp_locations: 1,
        leapp_status: 4,
        /* leapp_verify_date: normalizeExcelDate(res1.EndDate),
        leapp_approve_date: normalizeExcelDate(res1.EndDate),
        leapp_verify_by:640,
        leapp_approve_by:640, */

      }
      //console.log('==================== Hello =============== \n');
      await leaveApplication.addLeaveApplication(leaveApp);
      await leaveAccrualService.addLeaveAccrual(accrualData);
      //console.log(res1.T7, res1.StartDate, res1.EndDate, res1.LeaveLength)
      counter++;
    }
    console.log(`${counter} records inserted`)
    counter = 0;

  } catch (e) {
    console.error("Error:", e);
  }
}

function ExcelDateToJSDate(serial) {
  let utc_days  = Math.floor(serial - 25569 + 1);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);
  let fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  let seconds = total_seconds % 60;
  total_seconds -= seconds;
  let hours = Math.floor(total_seconds / (60 * 60));
  let minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}
function normalizeExcelDate(d) {
  if (!d) return null;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof d === 'number') {
    const date = new Date((d - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof d === 'string') {
    const parts = d.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(n => Number(n));
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}
function getMonthFromDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return null;
  return d.getMonth() + 1;
}

runLeaveSpillOver();
