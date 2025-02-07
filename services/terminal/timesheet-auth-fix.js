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

const authorizationModel = require("../../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const timeAllocationModel = require("../../models/timeallocation")(sequelize, Sequelize.DataTypes);
const fs = require('fs');

const timeallocationFix = async ()=>{
  let updatedAllocations = [];
  try{
    const auths = await authorizationModel.getAllPendingTimesheetAuthorizations(2,0);
   
    auths.map(async auth => {
      const timeAllocation = await timeAllocationModel.getOneTimesheetSubmissionByRefNo(auth.auth_travelapp_id);
      if((_.isNull(timeAllocation)) || (_.isEmpty(timeAllocation))){
        //update status to 2
        await authorizationModel.updateAuthorizationStatus(auth.auth_travelapp_id, 2);
        updatedAllocations.push(auth.auth_travelapp_id);
        console.log(`Status:: ${auth.auth_travelapp_id} \n`)
        fs.appendFileSync('../../assets/timeAllocation.txt', `${auth.auth_travelapp_id}\n`)
      }
    })
  }catch (e) {
    console.log(e.message);
  }
}



timeallocationFix();


module.exports = {
  //getDepartments,
  timeallocationFix,
}
