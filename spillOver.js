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
  try {
    const readOpts = { // <--- need these settings in readFile options
      cellText:false,
      cellDates:true
    };
    const leaveSpillOverFile = reader.readFile('./leave_spill_over_to_fy23GGG.xlsx');
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
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(
        leaveSpillOverFile.Sheets[leaveSpillOverFile.SheetNames[i]])
      for (const res1 of temp) {
        //console.log('Date:: '+ExcelDateToJSDate(res1.StartDate));
        const emp = await employeeModel.getEmployeeByUniqueId(res1.T7)
        //const hrpoints = await hrFocalPointModel.getHrFocalPointsByLocationId(emp.emp_location_id);
        let leaveType = await leaveTypeService.getLeaveTypeByName(res1.LeaveType).then(res=>{
          return res;
        });
        let leaveTypeId;
        if(res1.LeaveType === 'R&R'){
          leaveTypeId = 7;
        }else{
          leaveTypeId = leaveType.leave_type_id;
        }

        const accrualData = {
          lea_emp_id: emp.emp_id,
          lea_month: 10,
          lea_year: 2022,
          lea_leave_type: leaveTypeId || 1,
          lea_rate: res1.NumberOfDays,
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: '1990-01-01',
          lea_fy: 'FY2023',
          leave_narration:'Leave legacy'
        };
        const accrualLeave = await leaveAccrualService.addLeaveAccrual(accrualData);
        //Submit leave application
      //console.log(`Date Full: ${res1.StartDate}`);
        const leaveAppData = {
          leapp_empid: emp.emp_id,
          leapp_leave_type: leaveTypeId,
          leapp_start_date: ExcelDateToJSDate(res1.StartDate), //`${new Date(res1.StartDate).getFullYear()}-${new Date(res1.StartDate).getMonth()+1}-${new Date(res1.StartDate).getDay()}`,
          leapp_end_date: ExcelDateToJSDate(res1.EndDate),//`${new Date(res1.EndDate).getFullYear()}-${new Date(res1.EndDate).getMonth()+1}-${new Date(res1.EndDate).getDay()}`,
          leapp_total_days: res1.NumberOfDays,
          leapp_year: 2022,
          leapp_alt_phone: null,
          leapp_alt_email:null,
          leapp_status:0,
        }
        const leaveApplicationResponse = await leaveApplication.addLeaveApplication(leaveAppData).then((data) => {
          return data
        })
        const leaveAppId = leaveApplicationResponse.leapp_id;
       /* hrpoints.map(async (hrp) => {
          const subject = "New leave application";
          const body = "Kindly attend to this leave application.";
          const templateParams = {
            firstName: `${hrp.focal_person.emp_first_name}`,
            title: `New Leave Application - Authorization Request`,
          };
          //emp
          const authorizationResponse = authorizationAction.registerNewAction(1, leaveAppId, hrp.hfp_emp_id, 0, "Leave application initiated").then((data) => {
            return data
          });
          //const url = "leave-authorization";
          //const notifySupervisor = await notificationModel.registerNotification(subject, body, hrp.hfp_emp_id, 0, url);
        });*/
        //add authorizer
        const authorizationResponse = await authorizationAction.registerNewAction(1, leaveAppId, 351, 0, "Legacy Leave application initiated").then((data) => {
          return data
        });
        //Update authorization status
        const auth = await authorizationModel.update({
          auth_status: 1,
          auth_comment: 'Legacy leaves',
          auth_role_id: 1,//role,
        }, {
          where: {
            auth_travelapp_id: leaveAppId, auth_type: 1, auth_officer_id: 351
          }
        });

        //update leave application status as approved
        await leaveAppModel.update({
          leapp_status: 1,
          leapp_approve_comment: 'Legacy leaves',
          leapp_approve_date: new Date(),
          leapp_approve_by: 351,
        }, {
          where: {
            leapp_id: leaveAppId
          }
        });

        //Push negative to accrual
        const negativeAccrualData = {
          lea_emp_id: emp.emp_id,
          lea_month: 10,
          lea_year: 2022,
          lea_leave_type: leaveTypeId || 1,
          lea_rate: 0 - res1.NumberOfDays,
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: '1990-01-01',
          lea_fy: 'FY23',
        };
        const negativeAccrualLeave = await leaveAccrualService.addLeaveAccrual(negativeAccrualData);
      }
    }

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
