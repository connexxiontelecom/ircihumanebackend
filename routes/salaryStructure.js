const { sequelize, Sequelize } = require('../services/db');
const Joi = require('joi');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salaryGrade = require('../services/salaryGradeService');
const salaryStructure = require('../services/salaryStructureService');
const paymentDefinition = require('../services/paymentDefinitionService');
const employee = require('../services/employeeService');
const locationAllowance = require('../services/locationAllowanceService');
const salaryStrucModel = require('../models/salarystructure')(sequelize, Sequelize.DataTypes);
const paymentDefModel = require('../models/paymentdefinition')(sequelize, Sequelize.DataTypes);
const employeeModel = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const salaryGrossArchiveModel = require('../models/salarygrossarchive')(sequelize, Sequelize.DataTypes);
const salaryIncrementModel = require('../models/salaryIncrement')(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService');
const path = require('path');
const reader = require('xlsx');
const fileUpload = require('express-fileupload');

/* Get all Salary Structure */
router.get('/', auth(), async function (req, res, next) {
  try {
    const structure = await salaryStructure.findSalaryStructures();
    return res.status(200).json(structure);
  } catch (err) {
    return res.status(400).json(err.message);
    next(err);
  }
});

/* Add to Salary structure */
router.post('/add-salary-structure', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      ss_empid: Joi.number().required(),
      ss_gross: Joi.number().precision(2).required(),
      ss_grade: Joi.number().required()
    });

    const salaryStructureRequest = req.body;
    const validationResult = schema.validate(salaryStructureRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    let empId = salaryStructureRequest.ss_empid;

    const employeeData = await employee.getEmployee(empId);

    if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
      return res.status(400).json(`Employee Doesn't Exists`);
    }

    const empSalaryStructure = await salaryStructure.findSalaryStructure(empId);

    if (!(_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure))) {
      return res.status(400).json(`Salary Structure already set up, consider updating`);
    }

    const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade);

    if (_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade)) {
      return res.status(400).json(`Salary Grade Doesn't Exists`);
    }
    let gross = parseFloat(salaryStructureRequest.ss_gross);

    const grossPercentage = await paymentDefinition.findCodeWithGross();

    if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
      return res.status(400).json(`Update Payment Definitions to include Gross Percentage`);
    }
    let totalPercentageGross = await paymentDefinition.findSumPercentage();

    if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
      return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`);
    }

    try {
      await salaryStructure.deleteSalaryStructuresEmployee(empId);

      await employee.updateGrossSalary(empId, 0);

      await employee.updateSalaryGrade(empId, salaryStructureRequest.ss_grade);

      await Promise.allSettled([
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 1,
          ss_amount: gross,
          ss_grade: salaryStructureRequest.ss_grade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 2,
          ss_amount: 100000,
          ss_grade: salaryStructureRequest.ss_grade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 3,
          ss_amount: 100000,
          ss_grade: salaryStructureRequest.ss_grade
        })
      ]);
      const updateData = await employee.updateGrossSalary(empId, gross);

      if (_.isEmpty(updateData) || _.isNull(updateData)) {
        await salaryStructure.deleteSalaryStructuresEmployee(empId);
        return res.status(400).json(`An error occurred while updating Employee's Gross`);
      }
      const logData = {
        log_user_id: req.user.username.user_id,
        log_description: 'Updated salary structure',
        log_date: new Date()
      };
      await logs.addLog(logData);
      return res.status(200).json(`Action Successful`);
    } catch (e) {
      const errorMessage = `An error occurred while adding salary structure: ${e.message}`;
      await salaryStructure.deleteSalaryStructuresEmployee(empId);
      return res.status(400).json(errorMessage);
    }
  } catch (err) {
    const errorMessage = `An error occurred while adding salary structure: ${err.message}`;
    console.error(`Error while adding salary structure `, err.message);
    return res.status(400).json(errorMessage);
  }
});

/* Update Salary Structure */
router.patch('/update-salary-structure/:emp_id', auth(), async function (req, res, next) {
  try {
    const empId = req.params.emp_id;

    const schema = Joi.object({
      ss_gross: Joi.number().precision(2).required(),
      ss_grade: Joi.number().required()
    });

    const salaryStructureRequest = req.body;
    const validationResult = schema.validate(salaryStructureRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const employeeData = await employee.getEmployee(empId);

    if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
      return res.status(400).json(`Employee Doesn't Exists`);
    }

    const empSalaryStructure = await salaryStructure.findSalaryStructure(empId);

    if (_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure)) {
      return res.status(400).json(`Salary Structure was never setup, consider adding`);
    }

    const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade);

    if (_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade)) {
      return res.status(400).json(`Salary Grade Doesn't Exists`);
    }
    let gross = parseFloat(salaryStructureRequest.ss_gross);

    const grossPercentage = await paymentDefinition.findCodeWithGross();

    if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
      return res.status(400).json(`Update Payment Definitions to include Gross Percentage`);
    }
    let totalPercentageGross = await paymentDefinition.findSumPercentage();

    if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
      return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`);
    }

    try {
      await salaryStructure.deleteSalaryStructuresEmployee(empId);

      await employee.updateGrossSalary(empId, 0);

      await employee.updateSalaryGrade(empId, salaryStructureRequest.ss_grade);

      await Promise.allSettled([
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 1,
          ss_amount: gross,
          ss_grade: salaryStructureRequest.ss_grade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 2,
          ss_amount: 100000,
          ss_grade: salaryStructureRequest.ss_grade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 3,
          ss_amount: 100000,
          ss_grade: salaryStructureRequest.ss_grade
        })
      ]);
      const updateData = await employee.updateGrossSalary(empId, gross);

      if (_.isEmpty(updateData) || _.isNull(updateData)) {
        await salaryStructure.deleteSalaryStructuresEmployee(empId);
        return res.status(400).json(`An error occurred while updating Employee's Gross`);
      }
      const logData = {
        log_user_id: req.user.username.user_id,
        log_description: 'Updated salary structure',
        log_date: new Date()
      };
      await logs.addLog(logData);
      return res.status(200).json(`Action Successful`);
    } catch (e) {
      const errorMessage = `An error occurred while updating salary structure: ${e.message}`;
      await salaryStructure.deleteSalaryStructuresEmployee(empId);
      return res.status(400).json(errorMessage);
    }
  } catch (err) {
    const errorMessage = `An error occurred while updating salary structure: ${err.message}`;
    console.error(`Error while adding salary structure `, err.message);
    return res.status(400).json(errorMessage);
  }
});

router.get('/get-salary-structure/:emp_id', auth(), async function (req, res, next) {
  try {
    const empId = req.params.emp_id;

    const employeeData = await employee.getEmployee(empId).then((data) => {
      return data;
    });

    if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
      const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data) => {
        return data;
      });

      if (_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure)) {
        return res.status(400).json(`Salary Structure was never setup, consider setting up`);
      } else {
        return res.status(200).json(empSalaryStructure);
      }
    } else {
      return res.status(400).json(`Employee Doesn't Exists`);
    }
  } catch (err) {
    console.error(`Error while Fetching `, err.message);
    next(err);
  }
});

router.get('/salary-increment-index', auth(), async function (req, res) {
  try {
    const salaryInc = await salaryIncrementModel.getSalaryIncrements();
    const salaryData = [];
    salaryInc.map((sal, index) => {
      const data = {
        name: `${sal.employee.emp_first_name} ${sal.employee.emp_last_name} - ${sal.employee.emp_unique_id}`,
        sn: index + 1,
        prev_gross: `${sal.employee.emp_gross.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} `,
        new_gross: `${sal.si_new_gross.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} `,
        reason: `${sal.si_reason} `,
        tdate: `${new Date(sal.createdAt).toDateString()}`
      };
      salaryData.push(data);
    });
    return res.status(200).json(salaryData);
  } catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later.');
  }
});
router.get('/salary-gross-archives', auth(), async function (req, res) {
  try {
    const salaryArc = await salaryGrossArchiveModel.getSalaryArchives();
    const salaryData = [];
    salaryArc.map((sal, index) => {
      const data = {
        name: `${sal.employee.emp_first_name} ${sal.employee.emp_last_name} - ${sal.employee.emp_unique_id}`,
        sn: index + 1,
        new_gross: `${sal.sga_new_salary.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} `,
        prev_gross: `${sal.sga_prev_salary.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} `,
        reason: `${sal.sga_reason} `,
        tdate: `${new Date(sal.createdAt).toDateString()}`
      };
      salaryData.push(data);
    });
    return res.status(200).json(salaryData);
  } catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later.');
  }
});

router.post('/run-salary-gross-archive', auth(), async function (req, res) {
  try {
    const schema = Joi.object({
      attachment: Joi.string().allow('', null),
      reason: Joi.string().required()
    });

    const salaryGrossRequest = req.body;
    const validationResult = schema.validate(salaryGrossRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const attachment = req.files.attachment;
    const dir = __dirname + '/assets/' + attachment.name;
    const extensionName = path.extname(attachment.name);
    const allowedExtension = ['.xlsx'];
    if (!allowedExtension.includes(extensionName)) {
      return res.status(400).send('Invalid file format');
    }
    await attachment.mv(dir, async (err) => {
      if (err) {
        return res.status(400).json('File upload failed!'); // console.log('File upload failed!')
      }
      const workBook = await reader.readFile(dir);
      let errorBag = 0;
      const newValues = [];
      //convert xlsx to JSON
      const sheets = workBook.SheetNames;
      const temp = reader.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]]);
      for (const res1 of temp) {
        console.log(`D7 is : ${res1.D7}\n`);
        const emp = await employeeModel.getEmployeeByD7(res1.D7);
        if (emp) {
          const empArchiveData = {
            si_empid: emp.emp_id,
            si_d7: res1.D7,
            si_new_gross: res1['NewGross'],
            si_reason: req.body.reason
          };
          newValues.push(empArchiveData);
        } else {
          errorBag++;
        }
      }

      if (errorBag > 1) {
        return res.status(400).json('Something went wrong. Try again later.');
      } else {
        newValues.map(async (val) => {
          await salaryIncrementModel.addSalaryIncrement(val);
        });
        return res.status(200).json("Salary increment uploaded. Kindly inspect record to ensure it's accuracy.");
      }
    });
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again later.');
  }
});

router.post('/process-salary-increment', auth(), async function (req, res) {
  try {
    const schema = Joi.object({
      type: Joi.number().required()
    });

    const processRequest = req.body;
    const validationResult = schema.validate(processRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    if (parseInt(req.body.type) === 0) {
      await salaryIncrementModel.deleteSalaryIncrementRecords();
      return res.status(200).json('Salary increment record cleared!');
    }
    const salaryIncrementRecords = await salaryIncrementModel.getSalaryIncrements();
    if (!_.isEmpty(salaryIncrementRecords) || !_.isNull(salaryIncrementRecords)) {
      salaryIncrementRecords.map(async (salRecord) => {
        const emp = await employeeModel.getEmployeeById(parseInt(salRecord.si_empid));
        const empArchiveData = {
          sga_empid: salRecord.si_empid,
          sga_prev_salary: emp.emp_gross,
          sga_new_salary: salRecord.si_new_gross,
          sga_reason: salRecord.si_reason,
          sga_attachment: 'attachment'
        };
        await salaryGrossArchiveModel.archiveSalary(empArchiveData);
        await employeeModel.updateEmployeeGrossSalary(salRecord.si_empid, salRecord.si_new_gross);
        const ss = await salaryStrucModel.getEmployeeSalaryStructure(salRecord.si_empid);
        ss.map(async (s) => {
          let amt = (s.payment.pd_pr_gross / 100) * salRecord.si_new_gross;
          await salaryStrucModel.updateSalaryStructureAmount(s.ss_empid, amt, s.payment.pd_id);
        });
      });
      //clear salary increment table
      await salaryIncrementModel.deleteSalaryIncrementRecords();
      return res.status(200).json('Salary increment processed!');
    }
  } catch (e) {
    //console.log(e.message)
    return res.status(400).json('Something went wrong. Try again later.');
  }
});

module.exports = router;
