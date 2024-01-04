const dotenv = require('dotenv');
const {sequelize, Sequelize} = require('../db');
const _ = require('lodash');
const isWeekend = require('date-fns/isWeekend');
const {addLeaveAccrual} = require("../../routes/leaveAccrual");
const leaveApplicationService = require("../leaveApplicationService");
const differenceInBusinessDays = require("date-fns/differenceInBusinessDays");
const timeSheetService = require("../timeSheetService");
const EmployeeModel = require("../../models/Employee")(sequelize, Sequelize.DataTypes);
const leaveApplicationModel = require("../../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const leaveAccrualModel = require("../../models/leaveaccrual")(sequelize, Sequelize.DataTypes);
const publicHolidayModel = require("../../models/PublicHoliday")(sequelize, Sequelize.DataTypes);


//const bcrypt = require("bcrypt");
/*const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logs = require('../services/logService')

const helper = require('../helper');
const errHandler = (err) => {
  console.log("Error: ", err);
}*/
/*const getDepartments = async (req, res) => {
  try {
    let sectorLeadIds = [];
    const departments = await department.findAll({
      attributes: ['department_name', 'department_id', 'd_t3_code', 'd_sector_lead_id'],
    });
    departments.map((depart) => {
      sectorLeadIds.push(depart.d_sector_lead_id);
    })
    const sectorsLeads = await EmployeeModel.findAll({where: {emp_id: sectorLeadIds}}).then((emp) => {
      return emp;
    });
    departmentObj = {
      departments,
      sectorsLeads
    }
    res.status(200).json(departmentObj);
  } catch (e) {
    res.status(500).json({message: "Something went wrong. Try again later"});
  }
}


async function findDepartmentById(departmentId) {
  return await department.findOne({where: {department_id: departmentId}});
}*/
let targetDate = '2023-12-01';

const getAllLeaveApplicationFromStartDate = async ()=>{
  try{
    const leaveApplications = await leaveApplicationModel.getAllLeaveApplicationsFromADate(targetDate);
    //console.log(leaveApplications)
      //loop leaves
      leaveApplications.map(async leave => {


        const startDate = new Date(leave.leapp_start_date);
        const endDate = new Date(leave.leapp_end_date)
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const pubHolidays = [];
        let publicHolidays = 0;
        let weekends = 0;
        const steps = 1;

        let currentDate = new Date(startDate);

        const pHolidays = await publicHolidayModel.getThisYearsPublicHolidays();
        let holidays = [];
        pHolidays.map((pub) => {
          holidays.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
        });


        while (currentDate <= new Date(endDate)) {
          if (isWeekend(currentDate)) {
            weekends++;
            pubHolidays.push(currentDate);
          }
          let setDate = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth() + 1}-${(currentDate.getUTCDate())}`
          if (holidays.includes(setDate)) {
            if (!isWeekend(new Date(setDate))) {
              pubHolidays.push(currentDate);
            }
            publicHolidays++;
          }
          currentDate.setUTCDate(currentDate.getUTCDate() + steps);
        }
        let dateDifference = diffDays - parseInt(pubHolidays.length); //duration ;

        //let dateDifference = dateDiff(leave.leapp_start_date, leave.leapp_end_date);
        //console.log("Difference: "+dateDifference)

        if (parseInt(leave.leapp_total_days) !== parseInt(dateDifference)) {
          //update leave total days
          await leaveApplicationModel.update({
            leapp_total_days: dateDifference
          }, {
            where: {leapp_id: leave.leapp_id}
          });
          //update leave accrual
          let accrual = await leaveAccrualModel.findOne({
            where:{lea_leaveapp_id: leave.leapp_id}
          });
          console.log('Existing accrual')
          //console.log(accrual)
          if(!(_.isNull(accrual)) || !(_.isEmpty(accrual))){
            //delete leave accruals
            await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(parseInt(leave.leapp_id));
            //insert new record
            await markLeaveApplicationAsFinal(leave.leapp_start_date, leave.leapp_end_date, leave.leapp_empid, leave.leapp_leave_type, leave.leapp_id)
            //update accrual
            //await leaveAccrualModel.updateLeaveAccrualDuration(parseInt(leave.leapp_id), parseInt(dateDifference));
          }
        }
      })

    //console.log(leaveApplications);
  }catch (e) {
    console.log(e.message);
  }
}

  getAllLeaveApplicationFromStartDate();



async function dateDiff(leaveStartDate, leaveEndDate) {
  const startDate = new Date(leaveStartDate);
  const endDate = new Date(leaveEndDate)
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const pubHolidays = [];
  let publicHolidays = 0;
  let weekends = 0;
  const steps = 1;

  let currentDate = new Date(startDate);

  const pHolidays = await publicHolidayModel.getThisYearsPublicHolidays();
  let holidays = [];
  pHolidays.map((pub) => {
    holidays.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
  });


  while (currentDate <= new Date(endDate)) {
    if (isWeekend(currentDate)) {
      weekends++;
      pubHolidays.push(currentDate);
    }
    let setDate = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth() + 1}-${(currentDate.getUTCDate())}`
    if (holidays.includes(setDate)) {
      if (!isWeekend(new Date(setDate))) {
        pubHolidays.push(currentDate);
      }
      publicHolidays++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + steps);
  }
  let dateDifference = diffDays - parseInt(pubHolidays.length); //duration ;
  //console.log(`Number of Days: ${parseInt(dateDifference)}`)
  return parseInt(dateDifference);

}

/*function dateRange(startDate, endDate, steps = 1) {
  const dateArray = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dateArray.push(new Date(currentDate));
    // Use UTC date to prevent problems with time zones and DST
    currentDate.setUTCDate(currentDate.getUTCDate() + steps);
  }
  return dateArray;
}*/

async function addToLeaveAccrual(empId, year, month, leaveType, noDays, leaveId) {
  //console.log('I got to this point...')
  //const currentDate = new Date();
  const calendarYear = parseInt(month) <= 9 ? `FY${year}` : `FY${year + 1}`;
  //const calendarYear = currentDate.getMonth() + 1 >= 1 || currentDate.getMonth() + 1 <= 9 ? `FY${currentDate.getFullYear()}` : `FY${currentDate.getFullYear() + 1}`;
  const val = {
    lea_emp_id: empId,
    lea_year: year,
    lea_month: month,
    lea_leave_type: leaveType,
    lea_rate: 0 - noDays,
    lea_archives: 0,
    lea_leaveapp_id: leaveId,
    lea_expires_on: '1900-01-01',
    lea_fy: calendarYear,
    leave_narration: `${noDays} deducted from accrued leaves`,
  }
  const addAccrualResponse = await addLeaveAccrual(val).then((data) => {
    return data
  })
}

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());
  const dates = [];

  while (date <= endDate) {
    if(isWeekend(date)){
    }
    let newDate = new Date(date);
    let formattedNewDate = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()}`;
    dates.push(formattedNewDate);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

async function markLeaveApplicationAsFinal(leapp_start_date, leapp_end_date, leapp_empid, leapp_leave_type, leapp_id){


  let startDate = new Date(leapp_start_date);
  let endDate = new Date(leapp_end_date);
  //let daysRequested
  const holidays = await publicHolidayModel.getThisYearsPublicHolidays()
  const holidaysArray = [];
  holidays.map((pub) => {
    holidaysArray.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
  });
  let validLeaveDates = [];
  const datesWithin = getDatesInRange(startDate, endDate);
  let one = 0, oneDate,
    two = 0, twoDate,
    three = 0, threeDate,
    four = 0, fourDate,
    five = 0, fiveDate,
    six = 0, sixDate,
    seven = 0, sevenDate,
    eight = 0, eightDate,
    nine = 0, nineDate,
    ten = 0, tenDate,
    eleven = 0, elevenDate,
    twelve = 0, twelveDate;
  datesWithin.map((dw)=>{
    if(!(holidaysArray.includes(dw)) && !(isWeekend(new Date(dw))) ){
      validLeaveDates.push(dw);
    }
  });
  validLeaveDates.map(async (vd) => {
    let validDate = new Date(vd);
    let validMonth = validDate.getMonth() + 1;
    switch (parseInt(validMonth)) {
      case 1:
        oneDate = new Date(vd);
        one++;
        break;
      case 2:
        twoDate = new Date(vd);
        two++;
        break;
      case 3:
        threeDate = new Date(vd);
        three++;
        break;
      case 4:
        fourDate = new Date(vd);
        four++;
        break;
      case 5:
        fiveDate = new Date(vd);
        five++;
        break;
      case 6:
        sixDate = new Date(vd);
        six++;
        break;
      case 7:
        sevenDate = new Date(vd);
        seven++;
        break;
      case 8:
        eightDate = new Date(vd);
        eight++;
        break;
      case 9:
        nineDate = new Date(vd);
        nine++;
        break;
      case 10:
        tenDate = new Date(vd);
        ten++;
        break;
      case 11:
        elevenDate = new Date(vd);
        eleven++;
        break;
      case 12:
        twelveDate = new Date(vd);
        twelve++;

    }
  });
  holidays.map((pub) => {
    holidaysArray.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
  });
  //if(parseInt(status) === 1){
    //Insert individually
    for(let m = 1; m<= 12; m++){
      let number = parseInt(m);
      if (number === 1) {
        if (one > 0) {
          await addToLeaveAccrual(leapp_empid, oneDate.getFullYear(), oneDate.getMonth() + 1, leapp_leave_type, one, leapp_id);
        }
      }else if (number === 2) {
        if (two > 0) {
          await addToLeaveAccrual(leapp_empid, twoDate.getFullYear(), twoDate.getMonth() + 1, leapp_leave_type, two, leapp_id);
        }
      }else if (number === 3) {
        if (three > 0) {
          await addToLeaveAccrual(leapp_empid, threeDate.getFullYear(), threeDate.getMonth() + 1, leapp_leave_type, three, leapp_id);
        }
      }else if (number === 4) {
        if (four > 0) {
          await addToLeaveAccrual(leapp_empid, fourDate.getFullYear(), fourDate.getMonth() + 1, leapp_leave_type, four, leapp_id);
        }
      }else if (number === 5) {
        if (five > 0) {
          await addToLeaveAccrual(leapp_empid, fiveDate.getFullYear(), fiveDate.getMonth() + 1, leapp_leave_type, five, leapp_id);
        }
      }else if (number === 6) {
        if (six > 0) {
          await addToLeaveAccrual(leapp_empid, sixDate.getFullYear(), sixDate.getMonth() + 1, leapp_leave_type, six, leapp_id);
        }
      }else if (number === 7) {
        if (seven > 0) {
          await addToLeaveAccrual(leapp_empid, sevenDate.getFullYear(), sevenDate.getMonth() + 1, leapp_leave_type, seven, leapp_id);
        }
      }else if (number === 8) {
        if (eight > 0) {
          await addToLeaveAccrual(leapp_empid, eightDate.getFullYear(), eightDate.getMonth() + 1, leapp_leave_type, eight, leapp_id);
        }
      }else if (number === 9) {
        if (nine > 0) {
          await addToLeaveAccrual(leapp_empid, nineDate.getFullYear(), nineDate.getMonth() + 1, leapp_leave_type, nine, leapp_id);
        }
      }else if (number === 10) {
        if (ten > 0) {
          await addToLeaveAccrual(leapp_empid, tenDate.getFullYear(), tenDate.getMonth() + 1, leapp_leave_type, ten, leapp_id);
        }
      } else if (number === 11) {
        if (eleven > 0) {
          await addToLeaveAccrual(leapp_empid, elevenDate.getFullYear(), elevenDate.getMonth() + 1, leapp_leave_type, eleven, leapp_id);
        }
      } else if (number === 12) {
        if (twelve > 0) {
          await addToLeaveAccrual(leapp_empid, twelveDate.getFullYear(), twelveDate.getMonth() + 1, leapp_leave_type, twelve, leapp_id);
        }
      }
    }

    /*const leaveApp = await leaveApplicationModel.getLeaveApplicationById(leapp_id);
    if(!(_.isNull(leaveApp)) || !(_.isEmpty(leaveApp)) ){
      let startDate = new Date(leaveApp.leapp_start_date);
      let endDate = new Date(leaveApp.leapp_end_date);
      let numDays
      if(startDate.getDay() === 6 || startDate.getDay() === 0){
        numDays = await differenceInBusinessDays(endDate, startDate) + 2;
      }else{
        numDays = await differenceInBusinessDays(endDate, startDate) + 1;
      }
      let i = 0;
      if(numDays > 0){
        for(i=0; i<= numDays; i++){
          const loopPeriod = {
            emp_id:leaveApp.leapp_empid,
            day:i === 0 ? startDate.getUTCDate() : (startDate.getUTCDate() + i),
            month: startDate.getUTCMonth() + 1,
            year: startDate.getUTCFullYear()
          }
          await timeSheetService.updateTimesheetByDateRange(loopPeriod);
        }
      }

    }*/
  //}

}
module.exports = {
  //getDepartments,
  getAllLeaveApplicationFromStartDate,
}
