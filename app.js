    const express = require("express");
    const dotenv = require("dotenv");
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const fileUpload = require('express-fileupload');
    const _ = require('lodash')
    const app = express();
    app.use(cors());
    app.use(express.json());
    dotenv.config();
    app.use(fileUpload({
        createParentPath: true
    }));
    //Routes
    const employeeRouter = require('./routes/employees');
    const bankRouter = require('./routes/bank');
    const pensionProviderRouter = require('./routes/pension-provider');
    const hmoRouter = require('./routes/hmo');
    const departmentRouter = require('./routes/department');
    const gradeRouter = require('./routes/grade');
    const jobRoleRouter = require('./routes/job-role');
    const locationRouter = require('./routes/location');
    const qualificationRouter = require('./routes/qualification');
    const subsidiaryRouter = require('./routes/subsidiary');
    const leaveTypeRouter = require('./routes/leave-type');
    const stateRouter = require('./routes/state');
    const employeeCategoryRouter = require('./routes/employee-category');
    const leaveApplicationService = require('./services/leaveApplicationService');
    const leaveTypeService = require('./services/leaveTypeService');
    const employeeService = require('./services/employeeService');
    const leaveAccrualService = require('./services/leaveAccrualService');
    app.use('/employees', employeeRouter);
   app.use('/banks', bankRouter);
    app.use('/pension-providers', pensionProviderRouter);
   app.use('/hmos', hmoRouter);
   app.use('/departments', departmentRouter);
   app.use('/grades', gradeRouter);
   app.use('/job-roles', jobRoleRouter);
   app.use('/locations', locationRouter);
   app.use('/qualifications', qualificationRouter);
   app.use('/subsidiaries', subsidiaryRouter);
   app.use('/leave-types', leaveTypeRouter);
   app.use('/states', stateRouter);
   app.use('/employee-categories', employeeCategoryRouter);
   
    const userRouter = require('./routes/users')
    app.use('/users', userRouter);

    const paymentDefinitionRouter = require('./routes/paymentDefinitions')
    app.use('/payment-definitions', paymentDefinitionRouter);

    const lgaRouter = require('./routes/lga')
    app.use('/local-government', lgaRouter)

    const educationRouter = require('./routes/education')
    app.use('/education', educationRouter)

    const workExperienceRouter = require('./routes/work-experience')
    app.use('/work-experience', workExperienceRouter)

    const announcementRouter = require('./routes/announcement')
    app.use('/announcements', announcementRouter)

    const queryRouter = require('./routes/query')
    app.use('/queries', queryRouter)

    const queryReplyRouter = require('./routes/queryReply')
    app.use('/query-reply', queryReplyRouter)

    const logRouter = require('./routes/logs')
    app.use('/logs', logRouter)

    const taxRateRouter = require('./routes/taxRates')
    app.use('/tax-rates', taxRateRouter)

    const minimumTaxRateRouter = require('./routes/minimumTaxRates')
    app.use('/minimum-tax-rate', minimumTaxRateRouter)

    const locationAllowanceRouter = require('./routes/locationAllowances')
    app.use('/location-allowance',locationAllowanceRouter)

    const authorizationRoleRouter = require('./routes/authorization-role')
    app.use('/authorization-roles',authorizationRoleRouter)


    const donorRouter = require('./routes/donor')
    app.use('/donor',donorRouter)

    const grantChartRouter = require('./routes/grantChart')
    app.use('/grant-chart',grantChartRouter)

    const leaveApplication = require('./routes/leaveApplication')
    app.use('/leave-application', leaveApplication)

    const leaveDoc = require('./routes/leaveDoc')
    app.use('/leavedoc', leaveDoc)

    const supervisorAssignment = require('./routes/supervisorAssignment')
    app.use('/supervisor-assignment', supervisorAssignment)


    const publicHolidayRouter =require("./routes/publicHolidays");
    app.use('/public-holidays', publicHolidayRouter);

    const travelApplicationRouter =require("./routes/travelApplication");
    app.use('/travel-applications', travelApplicationRouter);

    const authorizationRouter = require("./routes/authorization");
    app.use('/application-authorization', authorizationRouter);

    const variationalPaymentRouter = require("./routes/variational-payment");
    app.use('/variational-payment', variationalPaymentRouter);

    const sectorLeadRouter =require("./routes/sectorLead");
    app.use('/sector-leads', sectorLeadRouter)


    const timeSheet = require('./routes/timeSheet')
    app.use('/time-sheet', timeSheet)

    const timeSheetPenalty = require('./routes/time-sheet-penalty')
    app.use('/time-sheet-penalty', timeSheetPenalty)

    const timeAllocation = require('./routes/timeAllocation')
    app.use('/time-allocation', timeAllocation)


    const payrollMonthYearRouter = require('./routes/payrollMonthYear')
    app.use('/payroll-month-year', payrollMonthYearRouter)

    const salaryGradeRouter = require('./routes/salaryGrade')
    app.use('/salary-grade', salaryGradeRouter)

    const salaryStructureRouter = require('./routes/salaryStructure')
    app.use('/salary-structure', salaryStructureRouter)

    const goalSettingRouter = require('./routes/goalSetting')
    app.use('/goal-setting', goalSettingRouter)

    const goalSettingYearRouter = require('./routes/goalSettingYear')
    app.use('/goal-setting-year', goalSettingYearRouter)

    const selfAssessmentRouter = require('./routes/selfAssessment')
    app.use('/self-assessment', selfAssessmentRouter)

    const hrFocalPointRouter = require('./routes/hrfocalpoint')
    app.use('/hr-focal-point', hrFocalPointRouter)

    const endYearAssessmentRouter = require('./routes/endOfYearAssessment')
    app.use('/end-year-assessment', endYearAssessmentRouter)

    const ratingRouter = require('./routes/rating')
    app.use('/rating', ratingRouter)

    const endYearRatingRouter = require('./routes/endYearRating')
    app.use('/end-year-rating', endYearRatingRouter)

    const salaryRouter = require('./routes/salary')
    app.use('/salary', salaryRouter)

    const leaveAccrualRouter = require('./routes/leaveAccrual')
    app.use('/leave-accrual', leaveAccrualRouter.router)

    const notificationRouter = require('./routes/notification')
    app.use('/notifications', notificationRouter);

    const endYearResponseRouter = require('./routes/endOfYearResponse')
    app.use('/end-year-response', endYearResponseRouter);

    const payrollJournalRouter = require('./routes/payroll-journal')
    const nodeCron = require("node-cron");
    app.use('/payroll-journal', payrollJournalRouter);

    app.get('/',  async function(req, res) {
        res.send('you got here. so get out')
    });

    async function updateApprovedLeaveStatus() {
      try {
        const result = await leaveApplicationService.getApprovedLeaves();
        const travelDayLeave = await leaveTypeService.getLeaveTypeByName('Travel Day');
        const cDate = new Date();
        const currentDay = cDate.getDate();
        const currentMonth = new Date().getMonth()+1;
        const currentYear = new Date().getFullYear();
        const currentDate = `${currentDay}-${currentMonth}-${currentYear}`;

        let travelAccrualDays = [`1-10-${currentYear}`, `1-1-${currentYear}`,`1-4-${currentYear}`, `1-7-${currentYear}`];
        let travelArchiveDays = [`14-10-${currentYear}`, `16-8-${currentYear}`,`14-4-${currentYear}`, `14-7-${currentYear}`];
        //console.log({travelArchiveDays})
        if(!(_.isEmpty(travelDayLeave)) || !(_.isNull(travelDayLeave))){
          const relocatableEmployees = await employeeService.getRelocatableEmployees();

          if(travelAccrualDays.includes(currentDate)){
            relocatableEmployees.map(async (reEmp) => {
              //check for existing one
              const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(reEmp.emp_id, currentMonth, currentYear, travelDayLeave.leave_type_id);
              if(_.isEmpty(existing) || _.isNull(existing)){
                const data = {
                  lea_emp_id: reEmp.emp_id,
                  lea_month: currentMonth,
                  lea_year: currentYear,
                  lea_leave_type: travelDayLeave.leave_type_id,
                  lea_rate: 1,
                  lea_archives: 0,
                  lea_leaveapp_id: 0
                }
                await leaveAccrualService.addLeaveAccrual(data);
              }

            })
          }
          if(travelArchiveDays.includes(currentDate)){
            relocatableEmployees.map(async (archEmp) => {
             // console.log(archEmp.emp_id, currentMonth, currentYear, travelDayLeave.leave_type_id);
              const inst = await leaveAccrualService.archiveLeaveAccrualByLeaveApplication(parseInt(archEmp.emp_id), currentMonth, currentYear, parseInt(travelDayLeave.leave_type_id));
              console.log(inst);
            })
          }

        }

        result.map(async (re) => {
          if ((new Date() >= new Date(re.leapp_start_date).getTime()) && (re.leapp_status === 1) ) {
            await leaveApplicationService.updateLeaveAppStatus(re.leapp_id, 3);
          }

        })
      } catch (e) {
        //return res.status(400).json('Whoops!');
      }
    }

    const job = nodeCron.schedule("*/1 * * * *", updateApprovedLeaveStatus);
    job.start();

    /* Error handler middleware */
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        console.error(err.message, err.stack);
        return res.status(statusCode).json({'message': err.message});

    });

     let port;


    if(process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'PRODUCTION' ){
        port = process.env.PORT || 4321
    }

    if(process.env.NODE_ENV === 'TEST'){
        port = 0
    }



    const server =   app.listen(port, ()=>{
        console.log(`Listening on ${port}`);
    });


    module.exports = server
