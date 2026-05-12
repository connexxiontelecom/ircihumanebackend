const {sequelize, Sequelize} = require('../../services/db');
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

const updateEmployeeVendorCode = async ()=>{
  try{
    const dir = '../../bulkEmployeeUpdate25012024.xlsx';
    const workBook = await reader.readFile(dir);
    counter = 0;
    //convert xlsx to JSON
    const sheets = workBook.SheetNames;
    const temp = reader.utils.sheet_to_json(
      workBook.Sheets[workBook.SheetNames[1]])
    console.log(temp)
     for (const res1 of temp) {
      let emp = await EmployeeModel.findOne({
        where:{emp_unique_id: res1.T7}
      });
      if(!(_.isEmpty(emp)) || !(_.isNull(emp))){
        let updateEmp = await EmployeeModel.update({
          emp_vendor_account: res1.VENDORACCOUNT,
        },{
          where:{emp_id: emp.emp_id}
        });
        fs.appendFileSync('../../assets/vendorUpdated.txt', `${res1.T7}\n`)
        counter++;
      }else{
        fs.appendFileSync('../../assets/vendorFailed.txt', `${res1.T7}\n`)
      }
    }
    //console.log(`${counter} records updated!`)


  }catch (e) {
    console.log(e.message);
  }
}

updateEmployeeVendorCode();


module.exports = {
  updateEmployeeVendorCode,
}
