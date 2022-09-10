const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()

const leaveAccrual = require('../services/leaveAccrualService')
const leaveType = require('../services/leaveTypeService')
const employee = require("../services/employeeService");
const auth = require("../middleware/auth");
const leaveApplication = require("../services/leaveApplicationService");
const {sequelize, Sequelize} = require("../services/db");
const logs = require("../services/logService");

const leaveAccrualModel = require("../models/leaveaccrual")(sequelize, Sequelize.DataTypes);
const leaveTypeModel = require("../models/LeaveType")(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);

async function addLeaveAccrual(data) {
    const schema = Joi.object({
        lea_emp_id: Joi.number().required(),
        lea_month: Joi.number().required(),
        lea_year: Joi.number().required(),
        lea_leave_type: Joi.number().required(),
        lea_rate: Joi.number().precision(2).required(),
        lea_leaveapp_id : Joi.number().required(),
        lea_archives: Joi.number().required()
    })

    const validationResult = schema.validate(data)
    if (validationResult.error) {
        return validationResult.error.details[0].message
    } else {
        return await leaveAccrual.addLeaveAccrual(data)
    }
}


async function removeLeaveAccrual(data) {
    return await leaveAccrual.removeLeaveAccrual(data)

}

async function removeLeaveAccrualEmployees(data) {
    return await leaveAccrual.removeLeaveAccrualEmployees(data)
}

async function computeLeaveAccruals(data) {
    const schema = Joi.object({
        lea_emp_id: Joi.number().required(),
        lea_year: Joi.number().required(),
        lea_leave_type: Joi.number().required(),
    })

    const validationResult = schema.validate(data)
    if (validationResult.error) {
        return validationResult.error.details[0].message
    } else {

        return leaveAccrual.sumLeaveAccrualByYearEmployeeLeaveType(data.lea_year, data.lea_emp_id, data.lea_leave_type)
    }
}




router.get('/get-leave-acrruals/:emp_id', auth(), async function (req, res, next) {
    try {
        const empId = req.params.emp_id

        const d = new Date();
        const year = d.getFullYear();

        const employeeData = await employee.getEmployee(empId).then((data) => {
            return data

        })

        if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {


            const leaves = await leaveType.getAllLeaves().then((data) => {
                return data
            })


            if (_.isEmpty(leaves) || _.isNull(leaves)) {
                return res.status(400).json(`No leave set up`)
            } else {
                let responseData = []
                for (const leave of leaves) {
                    let finalLeaveAccrualObject;
                    if (parseInt(leave.lt_accrue) === 1) {
                        let usedLeaveValue = 0

                        let usedLeavesData = await leaveApplication.sumLeaveUsedByYearEmployeeLeaveType(year, empId, leave.leave_type_id).then((sumLeave) => {
                            return sumLeave
                        })

                        if (!(_.isNull(usedLeavesData) || parseInt(usedLeavesData) === 0)) {
                            usedLeaveValue = usedLeavesData
                        }
                        let leaveSumAccruals = await leaveAccrual.sumLeaveAccrualByYearEmployeeLeaveType(year, empId, leave.leave_type_id).then((data) => {
                            return data
                        })

                        let accrualValue = 0;
                        if (!(_.isNull(leaveSumAccruals) || parseInt(leaveSumAccruals) === 0)) {
                            accrualValue = leaveSumAccruals
                        }
                        finalLeaveAccrualObject = {
                            leave: leave,
                            accrual: accrualValue - usedLeaveValue
                        }
                    } else {
                        finalLeaveAccrualObject = {
                            leave: leave,
                            accrual: 'Not Accruable'
                        }
                    }


                    responseData.push(finalLeaveAccrualObject)
                }

                return res.status(200).json(responseData)
            }

        } else {
            return res.status(400).json(`Employee Doesn't Exists`)
        }
    } catch (err) {
        console.error(`Error while Fetching `, err.message);
        next(err);
    }

});

router.get('/employee-leave-accruals', auth(), async (req, res)=>{
  try{
    const accruals = await leaveAccrualModel.getAllLeaveAccruals();
    const leave_types = await leaveTypeModel.getAllLeaveTypes();
    const data = {
      accruals,
      leave_types
    }

    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }
});
router.post('/year', auth(), async (req, res)=>{
  try{
    const year = req.body.year;
    const employees = await employee.getActiveEmployees();
    const accruals = await leaveAccrualModel.getAllLeaveAccruals(year);
    const empAccruedIds = [];
    accruals.map((accruedIds)=>{
      empAccruedIds.push(accruedIds.lea_emp_id);
    })
    const notAccruedEmployees = await employee.getExcludedActiveEmployeesByIds(empAccruedIds);
    const leaveAccruals = [];
    employees.map((emp)=>{
      accruals.map((accrual)=>{
        if(emp.emp_id === accrual.lea_emp_id){
          let empAccruals = {
            emp_first_name: emp.emp_first_name,
            emp_last_name: emp.emp_last_name,
            emp_id: emp.emp_id,
            emp_unique_id: emp.emp_unique_id,
            t6:emp.location?.location_name,
            t7: emp.emp_unique_id,
            t3: emp.sector?.department_name,
            total: accrual.get('total') ,
            lea_year:year, //accrual.lea_fy,
            lea_emp_id:accrual.lea_emp_id
          }
          leaveAccruals.push(empAccruals)
        }

      })
    });
    notAccruedEmployees.map((nAcc)=>{
            let empAccruals = {
              emp_first_name: nAcc.emp_first_name,
              emp_last_name: nAcc.emp_last_name,
              emp_id: nAcc.emp_id,
              emp_unique_id: nAcc.emp_unique_id,
              t6:nAcc.location?.location_name,
              t7: nAcc.emp_unique_id,
              t3: nAcc.sector?.department_name,
              total:   0,
              lea_year:year,
              lea_emp_id:nAcc.emp_id
            }
        leaveAccruals.push(empAccruals)
      })

    //return res.status(200).json(leaveAccruals);
    return res.status(200).json(leaveAccruals);
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
  }
});

router.get('/:year/:empId', auth(), async (req, res)=>{
  try{
    const year = req.params.year;
    const empId = parseInt(req.params.empId);
    const total = await leaveAccrualModel.getTotalAccruedAllLeaveAccrualsByYearEmpId(year, empId);
      const leave_types = await leaveType.getAllLeaves();
     const employeeLeaveData = [ ]
      for(const leaveType of leave_types){
         const leaveTypeId = leaveType.leave_type_id;
         const totalAccrued = await leaveAccrual.getTotalAccruedLeaveAccrualByYearEmployeeLeaveType(year, empId, leaveTypeId);
            const totalTaken = await leaveAccrual.getTotalTakenLeaveAccrualByYearEmployeeLeaveType(year, empId, leaveTypeId);
            const totalArchived = await leaveAccrual.getArchivedLeaveAccrualByYearEmployeeLeaveType(year, empId, leaveTypeId);
         const employeeLeaveObject = {
             leaveType: leaveType.leave_name,
             totalTaken: totalTaken[0].totalTaken,
             totalAccrued: totalAccrued[0].totalAccrued,
             totalArchived : totalArchived.length,
         }
         employeeLeaveData.push(employeeLeaveObject);
      }
    const emp = await employee.getEmployeeByIdOnly(empId);
    const leaveTypes = await leaveTypeModel.getAllLeaveTypesByStatus() //0
      const leaveEmp = {
        employee:emp,
        employeeLeaveData,
        leaveTypes
      }
      //employeeLeaveData.push(leaveEmp);
    return res.status(200).json(leaveEmp);
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
  }
});

router.get('/employee-leave-accruals', auth(), async (req, res)=>{
  try{
    const accruals = await leaveAccrualModel.getAllLeaveAccruals();
    const leave_types = await leaveTypeModel.getAllLeaveTypes();
    const data = {
      accruals,
      leave_types
    }

    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }
});

router.post('/add-accruals', auth(), async (req, res)=>{
  try{
    const schema = Joi.object({
      noOfDays: Joi.number().required(),
      narration: Joi.string().required(),
      empId: Joi.number().required(),
      leaveType: Joi.number().required(),
      expiresOn: Joi.string().allow(null, ''),

    })

    const accrualRequest = req.body
    const validationResult = schema.validate(accrualRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const emp = await employee.getEmployeeByIdOnly(parseInt(req.body.empId));
    if(_.isNull(emp) || _.isEmpty(emp)){
      return res.status(400).json("Employee does not exist");
    }
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const accrual = await leaveAccrualModel.addLeaveAccrual(parseInt(req.body.empId),month, year, parseInt(req.body.leaveType), parseInt(req.body.noOfDays), req.body.expiresOn);
    //Log
    const logData = {
      "log_user_id": req.user.username.user_id,
      "log_description": `${req.body.narration}`,
      "log_date": new Date()
    }
    logs.addLog(logData).then((logRes) => {
      return res.status(200).json("Leave days added.");
    })

  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
});
module.exports = {
    router,
    addLeaveAccrual,
    computeLeaveAccruals,
    removeLeaveAccrual,
    removeLeaveAccrualEmployees

}
