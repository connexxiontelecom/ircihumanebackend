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
    const leaveSpillOverFile = reader.readFile('./CarryOverLeavesFY26.xlsx');
    //const leaveSpillOverFile = reader.readFile('./leaveSpillOver2024.xlsx');
    //const leaveSpillOverFile = reader.readFile('./spillOver2024.xlsx');
    //const workbook = reader.read(source, { 'type': type, cellDates: true });
//convert xlsx to JSON
    let rows = [];
    const jsonOpts = {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false,
      dateNF: 'd"/"m"/"yyyy' // <--- need dateNF in sheet_to_json options (note the escape chars)
    }
    const sheets = leaveSpillOverFile.SheetNames;
   // for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(
        leaveSpillOverFile.Sheets[leaveSpillOverFile.SheetNames[0]])
        //leaveSpillOverFile.Sheets[leaveSpillOverFile.SheetNames[i]])
      //console.log(temp)
      for (const res1 of temp) {
        //console.log('Date:: '+ExcelDateToJSDate(res1.StartDate));
        const emp = await employeeModel.getEmployeeByUniqueId(res1.T7)
        console.log(`${res1.T7}`)
        const accrualData = {
          lea_emp_id: emp.emp_id,
          lea_month: 10,
          lea_year: 2025,
          lea_leave_type:  1,
          lea_rate: res1.NumberOfDays,
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: '1990-01-01',
          lea_fy: 'FY2026',
          leave_narration:'Carry over leave'
          //leave_narration:'Spill over leave'
        };
        const accrualLeave = await leaveAccrualService.addLeaveAccrual(accrualData);

        counter++;

      }
      console.log(`${counter} records inserted`)
    //}
    counter = 0;

  } catch (e) {

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

runLeaveSpillOver();
