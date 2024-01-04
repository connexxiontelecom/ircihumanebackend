const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash');
const {sequelize, Sequelize} = require("../services/db");
const {where} = require("sequelize");
const performanceImprovementModel = require('../models/PerformanceImprovement')(sequelize, Sequelize.DataTypes);
const employeeModel = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const performancePlanMasterModel = require('../models/PerformancePlanMaster')(sequelize, Sequelize.DataTypes);
const performancePlanAssessmentModel = require('../models/PerformancePlanAssessment')(sequelize, Sequelize.DataTypes);
const performancePlanSupervisorResponseModel = require('../models/PerformancePlanSupervisorResponse')(sequelize, Sequelize.DataTypes);
const performancePlanCompetencyModel = require('../models/PerformancePlanCategoriesOfCompetency')(sequelize, Sequelize.DataTypes);
const performancePlanOveralPerformanceModel = require('../models/PerformancePlanOverallPerformance')(sequelize, Sequelize.DataTypes);


router.get('/', auth(), async function(req, res){
  try{
    const performance = await performanceImprovementModel.getPerformanceImprovement();
    const obj = {
      performance
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later'+e.message);
  }
});

router.post('/add-performance-improvement', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      employees: Joi.array().required().messages({ 'any.required': 'Choose an employee' }),
      start_date: Joi.string().required().messages({ 'any.required': 'What is the start date?' }),
      end_date: Joi.string().required().messages({ 'any.required': 'What is the end date?' }),
      max_end_date: Joi.number().required(),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }

    const { employees, start_date, end_date, max_end_date } = req.body;


    const maxEndDate = new Date(max_end_date);
    const endDate = new Date(end_date);
    if( endDate.getTime()  >  maxEndDate.getTime() ){
      return res.status(400).json('End date is beyond the allocated period of 3 months');
    }



     await employees.map(async emp => {
       const empPerformances = await performanceImprovementModel.getEmployeePerformanceImprovement(parseInt(emp.value));
       if(!(_.isNull(empPerformances)) || !(_.isEmpty(empPerformances)) ){
         empPerformances.map(async empPerf => {
           if (parseInt(empPerf.pi_status) === 1) {
             await performanceImprovementModel.updatePerformanceStatus(empPerf.pi_id, 0);
           }
         });
       }
        const data = {
          emp_id:emp.value,
          start_date:start_date,
          end_date:endDate,
          status:1
        };
        await performanceImprovementModel.addPerformanceImprovement(data);
      });
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.`)
  }
});

router.post('/update-performance-improvement', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      start_date: Joi.string().required().messages({ 'any.required': 'What is the start date?' }),
      end_date: Joi.string().required().messages({ 'any.required': 'What is the end date?' }),
      max_end_date: Joi.number().required(),
      empId: Joi.number().required(),
      performanceId: Joi.number().required(),
      status:Joi.number().required(),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }

    const {performanceId,empId, status, start_date, end_date, max_end_date } = req.body;


    const maxEndDate = new Date(max_end_date);
    const endDate = new Date(end_date);
    if( endDate.getTime()  >  maxEndDate.getTime() ){
      return res.status(400).json('End date is beyond the allocated period of 3 months');
    }

       const empPerformances = await performanceImprovementModel.getEmployeePerformanceImprovement(parseInt(empId));
       if(!(_.isNull(empPerformances)) || !(_.isEmpty(empPerformances)) ){
         empPerformances.map(async empPerf => {
           if (parseInt(empPerf.pi_status) === 1) {
             await performanceImprovementModel.updatePerformanceStatus(empPerf.pi_id, 0);
           }
         });
       }
        const performance = await performanceImprovementModel.getPerformanceImprovementById(parseInt(performanceId));
        if(!(_.isNull(performance)) || !(_.isEmpty(performance))){
            await performanceImprovementModel.updatePerformanceDetails(parseInt(performanceId), parseInt(status), start_date, end_date);
        }

    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.`)
  }
});


router.get('/delete-performance-improvement/:performanceId', auth(), async function (req, res, next) {
  try {
    const performanceId = req.params.performanceId;

    if(_.isNull(performanceId) || _.isEmpty(performanceId)){
      return res.status(400).json("Something went wrong. Try again later.");
    }

    const performance = await performanceImprovementModel.getPerformanceImprovementById(parseInt(performanceId));
    if(!(_.isNull(performance)) || !(_.isEmpty(performance))){
        await performanceImprovementModel.deletePerformanceImprovement(parseInt(performanceId));
    }
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.`)
  }
});

router.post('/add-performance-plan', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      employee: Joi.number().required().messages({ 'any.required': 'Specify employee' }),
      goals: Joi.array().required().messages({ 'any.required': 'Indicate goals' }),
      type: Joi.number().required().messages({ 'any.required': 'Indicate submission type(improvement or development)' }),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const { employee, goals, type} = req.body;
    const empDetails = await employeeModel.getEmployeeById(parseInt(employee));

    if(_.isNull(empDetails) || _.isEmpty(empDetails)){
      return res.status(400).json("Employee does not exist.");
    }
    let start_date = null, end_date = null;
    if( _.isUndefined(empDetails.emp_supervisor_id) ){
      return res.status(400).json("Supervisor not found");
    }
    if(parseInt(empDetails.emp_probation) === 1){
      end_date = new Date(empDetails.emp_probation_end_date);
      start_date = new Date(empDetails.emp_contract_hire_date);
    }
    if(parseInt(empDetails.emp_probation) === 0){
      const empPerform = await performanceImprovementModel.getEmployeeActivePerformanceImprovement(parseInt(empDetails.emp_id));

      if((!_.isNull(empPerform)) || (!_.isEmpty(empPerform)) ){
        end_date = new Date(empPerform.pi_end_date);
        start_date = new Date(empPerform.pi_start_date);
      }

      if(_.isNull(empPerform) || _.isEmpty(empPerform)){
        return res.status(400).json("Whoops! There's no performance improvement plan scheduled for this employee");
      }

    }
    const masterObj = {
      emp_id:empDetails.emp_id,
      start_date:start_date,
      end_date:end_date,
      status:0,
      supervisor_id:empDetails.emp_supervisor_id,
      type:type
    };
    //submit to performance master table
    const performanceMaster = await performancePlanMasterModel.addPerformancePlanMaster(masterObj);
    //publish goals
    goals.map(async goal => {
      const goalObj = {
        goal: goal.goal,
        ppm_id: performanceMaster.ppm_id
      };
      await performancePlanAssessmentModel.addPerformanceAssessment(goalObj);
    });
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.${err.message}`)
  }
});

router.get('/get-employee-performance-plan/:empId', auth(), async function(req, res){
  try{
    const empId = req.params.empId;
    const performance = await performancePlanMasterModel.getEmployeePerformancePlanMasterByEmpId(parseInt(empId));
    const obj = {
      performance
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later'+e.message);
  }
});


router.get('/get-performance-dev-details/:performanceId', auth(), async function(req, res){
  try{
    const id = req.params.performanceId;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(id));
    const obj = {
      performance
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later');
  }
});


router.get('/get-all-supervisor-performance-assessments/:supervisorId', auth(), async function(req, res){
  try{
    const id = req.params.supervisorId;
    const performance = await performancePlanMasterModel.getAllPerformanceAssessmentBySupervisorId(parseInt(id));
    const obj = {
      performance
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later');
  }
});


router.get('/get-supervisor-performance-assessment/:performanceId', auth(), async function(req, res){
  try{
    const id = req.params.performanceId;
    const performance = await performancePlanMasterModel.getSinglePerformanceAssessmentById(parseInt(id));
    const obj = {
      performance
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later'+e.message);
  }
});




router.post('/save-performance-assessment-changes', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      goals: Joi.array().required().messages({ 'any.required': 'Indicate goals' }),
      performanceId: Joi.number().required().messages({'any:required': ''}),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const { goals,performanceId} = req.body;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(performanceId));
    if(_.isNull(performance) ||  _.isEmpty(performance)){
      return res.status(400).json("No record found");
    }
   /* const assessments = await performancePlanAssessmentModel.getPerformanceAssessmentsByPpmId(parseInt(performanceId));
    let assessmentIds = [];
    assessments.map(assess=>{
      assessmentIds.push(assess.ppa_id);
    })*/
    //clear assessment first
    await performancePlanAssessmentModel.destroyPerformanceAssessment(parseInt(performanceId));
    goals.map(async goal => {
      const goalObj = {
        goal: goal.goal,
        ppm_ppm_id: performanceId,
        ppm_measure: goal.measure
      };
      await performancePlanAssessmentModel.savePerformanceAssessment(goalObj);
    });
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.${err.message}`)
  }
});



router.post('/approve-performance-assessment', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      performanceId: Joi.number().required().messages({ 'any.required': 'Provide performance' }),
      supervisorId: Joi.number().required().messages({ 'any.required': 'Provide supervisor' }),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const { performanceId, supervisorId} = req.body;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(performanceId));
    if(_.isNull(performance) ||  _.isEmpty(performance)){
      return res.status(400).json("No record found");
    }

    if(parseInt(performance.ppm_supervisor_id) !== parseInt(supervisorId)){
      return res.status(400).json("Access denied.");
    }
    //approve assessment
    await performancePlanMasterModel.approvePerformanceAssessment(1, parseInt(performanceId));
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.${err.message}`)
  }
});


router.get('/employee-end-of-year-performance/:performanceId', auth(), async function(req, res){
  try{
    const id = req.params.performanceId;
    const performance = await performancePlanMasterModel.getSinglePerformanceAssessmentById(parseInt(id));
    if(_.isNull(performance) || _.isEmpty(performance)){
      return res.status(400).json('Whoops! No record found. Try again later');
    }
    const supervisorResponse = await performancePlanSupervisorResponseModel.getSingleSupervisorEndOfYearPerformanceResponseById(parseInt(id));

    if(!(_.isNull(supervisorResponse)) || !(_.isEmpty(supervisorResponse))){
      const overallPerformance = await performancePlanOveralPerformanceModel.getSingleOverallPerformanceByMasterId(parseInt(id));
      const competency = await performancePlanCompetencyModel.getSinglePerformanceCompetenceByMasterId(parseInt(id));
      const obj = {
        performance,
        overallPerformance,
        competency,
        supervisorResponse
      }
      return res.status(200).json(obj);
    }else{
      const overallPerformance = {};
      const competency = {};
      const supervisorResponse = {};
      const obj = {
        performance,
        overallPerformance,competency,supervisorResponse
      }
      return res.status(200).json(obj);
    }
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later');
  }
});



router.get('/supervisor-end-of-year-performance/:performanceId', auth(), async function(req, res){
  try{
    const id = req.params.performanceId;
    if(_.isNull(id)){
      return res.status(400).json('Whoops! Something went wrong. Try again later'+e.message);
    }
    const performance = await performancePlanMasterModel.getSinglePerformanceAssessmentById(parseInt(id));
    let supervisorResponse = await performancePlanSupervisorResponseModel.getSingleSupervisorEndOfYearPerformanceResponseById(parseInt(id));
    let overallPerformance = await performancePlanOveralPerformanceModel.getSingleOverallPerformanceByMasterId(parseInt(id));
    let competency = await performancePlanCompetencyModel.getSinglePerformanceCompetenceByMasterId(parseInt(id));

    const obj = {
      performance,
      supervisorResponse:supervisorResponse || {},
      overallPerformance:overallPerformance || {},
      competency:competency || {}
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later');
  }
});




router.post('/save-performance-achievements', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      goals: Joi.array().required().messages({ 'any.required': 'Indicate goals' }),
      performanceId: Joi.number().required().messages({'any:required': ''}),
      accomplishments:Joi.string().required().messages({'any:required': 'Enter accomplishments'}),
      general_comments:Joi.string().required().messages({'any:required': 'General comments is required'}),
      challenges:Joi.string().required().messages({'any:required': 'What were the challenges you faced?'}),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const { goals,performanceId, accomplishments, general_comments, challenges} = req.body;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(performanceId));
    if(_.isNull(performance) ||  _.isEmpty(performance)){
      return res.status(400).json("No record found");
    }

    //update performance plan master with new values for
    const performanceMasterObj = {
      ppm_accomplishments:accomplishments,
      ppm_challenges:challenges,
      ppm_general_comments:general_comments
    };
    await performancePlanMasterModel.updatePerformanceAssessment(performanceMasterObj, performanceId)

    //clear assessment first
    await performancePlanAssessmentModel.destroyPerformanceAssessment(parseInt(performanceId));
    goals.map(async goal => {
      const goalObj = {
        goal: goal.goal,
        ppm_ppm_id: performanceId,
        ppm_measure: goal.measure,
        ppm_achievement:goal.achievements,
      };
      await performancePlanAssessmentModel.savePerformanceAssessment(goalObj);
    });
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.${err.message}`)
  }
});


router.post('/submit-supervisor-end-of-year-performance-assessment', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      critical_accomplishments: Joi.string().required(),
      employee_strength: Joi.string().required(),
      growth_area: Joi.string().required(),
      action_plan: Joi.string().required(),
      additional_supervisor_comment: Joi.string().required(),
      rate_employee: Joi.string().required(),
      supervisor_recommendation: Joi.string().required(),
      work_quantity: Joi.string().required(),
      work_quality: Joi.string().required(),
      job_knowledge: Joi.string().required(),
      organization_work: Joi.string().required(),
      teamwork: Joi.string().required(),
      initiative_creativity: Joi.string().required(),
      communication_skills: Joi.string().required(),
      performanceId: Joi.number().required().messages({'any:required': ''}),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const {
      critical_accomplishments,growth_area, performanceId, employee_strength,action_plan, additional_supervisor_comment,
      work_quantity,work_quality, job_knowledge,communication_skills, organization_work, teamwork, initiative_creativity,
      rate_employee, supervisor_recommendation} = req.body;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(performanceId));
    if(_.isNull(performance) ||  _.isEmpty(performance)){
      return res.status(400).json("No record found");
    }
    const supervisorResponseObj = {
      performanceId:performanceId,
      accomplishments:critical_accomplishments,
      employee_strength:employee_strength,
      growth_areas:growth_area,
      action_plan:action_plan,
      supervisor_comment:additional_supervisor_comment
    };

    const existingSupervisorResponse = await performancePlanSupervisorResponseModel.getSingleSupervisorEndOfYearPerformanceResponseById(parseInt(performanceId));
    if(_.isNull(existingSupervisorResponse) || _.isEmpty(existingSupervisorResponse)){
      //store supervisor response
      await performancePlanSupervisorResponseModel.addSupervisorEndOfYearPerformanceResponse(supervisorResponseObj);
    }else{
      //update supervisor response
      await performancePlanSupervisorResponseModel.updateSupervisorEndOfYearPerformanceResponse(supervisorResponseObj, performanceId);
    }

    //competency
    const competenceObj = {
      work_quantity,
      work_quality,
      job_knowledge,
      organization_work,
      teamwork,
      initiative_creativity,
      communication_skills,
      performanceId
    }
    const existingCompetence = await performancePlanCompetencyModel.getSinglePerformanceCompetenceByMasterId(parseInt(performanceId));
    if(_.isNull(existingCompetence) || _.isEmpty(existingCompetence)){
      //store competence
      await performancePlanCompetencyModel.addPerformancePlanCompetence(competenceObj);
    }else{
      //update competence
      await performancePlanCompetencyModel.updatePerformancePlanCompetence(competenceObj, parseInt(performanceId));
    }


    const overallObj = {
      rate_employee,
      supervisor_recommendation,
      performanceId
    }
    const existingOverallPerf = await performancePlanOveralPerformanceModel.getSingleOverallPerformanceByMasterId(parseInt(performanceId));
    if(_.isNull(existingOverallPerf) || _.isEmpty(existingOverallPerf)){
      //store overall performance
      await performancePlanOveralPerformanceModel.addPerformancePlanMaster(overallObj)
    }else{
      //update overall performance
      await performancePlanOveralPerformanceModel.updatePerformancePlanMaster(overallObj, parseInt(performanceId))
    }

    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later.${err.message}`)
  }
});



router.post('/approve-supervisor-performance-assessment', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      performanceId: Joi.number().required().messages({ 'any.required': 'Provide performance' }),
      supervisorId: Joi.number().required().messages({ 'any.required': 'Provide supervisor' }),
    });
    const performanceRequest = req.body
    const validationResult = schema.validate(performanceRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const { performanceId, supervisorId} = req.body;
    const performance = await performancePlanMasterModel.getSingleEmployeePerformancePlanMasterDetailById(parseInt(performanceId));
    if(_.isNull(performance) ||  _.isEmpty(performance)){
      return res.status(400).json("No record found");
    }

    if(parseInt(performance.ppm_supervisor_id) !== parseInt(supervisorId)){
      return res.status(400).json("Access denied.");
    }

    //supervisor response
    const existingSupervisorResponse = await performancePlanSupervisorResponseModel.getSingleSupervisorEndOfYearPerformanceResponseById(parseInt(performanceId));
    if(_.isNull(existingSupervisorResponse) || _.isEmpty(existingSupervisorResponse)){
      return res.status(400).json("Supervisor response not found.");
    }
    //update performance master
    await performancePlanMasterModel.approvePerformanceAssessment(2, parseInt(performanceId))
    //approve assessment
    await performancePlanSupervisorResponseModel.updateSupervisorEndOfYearPerformanceStatus(1,parseInt(performanceId))
    return res.status(200).json(`Action successful.`)

  } catch (err) {
    return res.status(400).json(`Something went wrong. Try again later`)
  }
});



router.get('/scheduled-performance-improvement/:empId', auth(), async function(req, res){
  try{
    const id = req.params.empId;
    if(_.isNull(id)){
      return res.status(400).json('Whoops! Something went wrong. Try again later');
    }
    const performance = await performanceImprovementModel.getEmployeeActivePerformanceImprovement(parseInt(id));

    const obj = {
      performance,
    }
    return res.status(200).json(obj);
  }catch (e) {
    return res.status(400).json('Whoops! Something went wrong. Try again later');
  }
});



module.exports = router;
