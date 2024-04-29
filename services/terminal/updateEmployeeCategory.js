const dotenv = require('dotenv');
const {sequelize, Sequelize} = require('../db');
const _ = require('lodash');
const isWeekend = require('date-fns/isWeekend');
const {addLeaveAccrual} = require("../../routes/leaveAccrual");
const leaveApplicationService = require("../leaveApplicationService");
const differenceInBusinessDays = require("date-fns/differenceInBusinessDays");
const timeSheetService = require("../timeSheetService");
const path = require("path");
const reader = require("xlsx");
const EmployeeModel = require("../../models/Employee")(sequelize, Sequelize.DataTypes);
const leaveApplicationModel = require("../../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const leaveAccrualModel = require("../../models/leaveaccrual")(sequelize, Sequelize.DataTypes);
const publicHolidayModel = require("../../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const fs = require('fs');

const updateEmployeeCategory = async ()=>{
  try{
    const dir = '../../assets/UpdateEmpCategory.xlsx';
      const workBook = await reader.readFile(dir);
      counter = 0;
      //convert xlsx to JSON
      const sheets = workBook.SheetNames;
      const temp = reader.utils.sheet_to_json(
        workBook.Sheets[workBook.SheetNames[0]])
      for (const res1 of temp) {
        //console.log(`D7 is : ${res1.T7}\n`)
        let emp = await EmployeeModel.findOne({
          where:{emp_unique_id: res1.T7}
        });
        //console.log(emp)
        if(!(_.isEmpty(emp)) || !(_.isNull(emp))){
          //update category
          let updateEmp = await EmployeeModel.update({
            emp_employee_category: res1.EmployeeCategory,
            emp_employee_type:res1.EmployeeType
          },{
            where:{emp_id: emp.emp_id}
          });
            //store updated records to file
            fs.appendFileSync('../../assets/updated.txt', `${res1.T7}\n`)
            counter++;
        }else{
          fs.appendFileSync('../../assets/failed.txt', `${res1.T7}\n`)
        }
      }
      console.log(`${counter} records updated!`)


  }catch (e) {
    console.log(e.message);
  }
}

updateEmployeeCategory();



/*
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
}*/

module.exports = {
  updateEmployeeCategory,
}
