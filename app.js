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
    const {addLeaveAccrual} = require("./routes/leaveAccrual");
    const salary = require("./services/salaryService");
    const employee = require("./services/employeeService");
    const Joi = require("joi");
    app.use('/payroll-journal', payrollJournalRouter);

    app.get('/',  async function(req, res) {
        res.send('you got here. so get out')
    });

    async function updateApprovedLeaveStatus() {
      try {
        const approvedLeaves = await leaveApplicationService.getLeavesByStatus(1);
        const activeLeaves = await leaveApplicationService.getLeavesByStatus(3);
        //update approved leaves to the status of active
        approvedLeaves.map(async (re) => {
          if ((new Date().getTime() >= new Date(re.leapp_start_date).getTime()) && (re.leapp_status === 1) ) {
            await leaveApplicationService.updateLeaveAppStatus(re.leapp_id, 3);
          }
        })
        //update active leaves to the status of finished
        activeLeaves.map(async (act) => {
          if ((new Date().getTime() >= new Date(act.leapp_end_date).getTime()) && (act.leapp_status === 3) ) {
            await leaveApplicationService.updateLeaveAppStatus(act.leapp_id, 4);
          }
        })
      } catch (e) {
      }
    }

    async function travelDayLeaveAccrual(){
      try {
        const travelDayLeave = await leaveTypeService.getLeaveTypeByName('Travel Day');
        const cDate = new Date();
        const currentDay = cDate.getDate();
        const currentMonth = new Date().getMonth()+1;
        const currentYear = new Date().getFullYear();
        const currentDate = `${currentDay}-${currentMonth}-${currentYear}`;
        //const reverseCurrentDate = `${currentYear}-${currentMonth < 10 ? '0'+currentMonth : currentMonth}-${currentDay}`;

        let travelAccrualDays = [`1-10-${currentYear}`, `1-1-${currentYear}`,`1-4-${currentYear}`, `1-7-${currentYear}`];
        let travelAccrualExpires = [`${currentYear+1}-1-14`, `${currentYear}-4-14`,`${currentYear}-7-14`, `${currentYear}-9-14`];
        if(!(_.isEmpty(travelDayLeave)) || !(_.isNull(travelDayLeave))){
          const nonRelocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(0);

          if(travelAccrualDays.includes(currentDate)){
            nonRelocatableEmployees.map(async (reEmp) => {
              const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(reEmp.emp_id, currentMonth, currentYear, travelDayLeave.leave_type_id);
              const calendarYear = currentMonth >= 1 || currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear+1}`;
              if(_.isEmpty(existing) || _.isNull(existing)){
                let expiresOn = null;
                if(currentDate === travelAccrualDays[0]){
                  expiresOn = travelAccrualExpires[0]
                }else if(currentDate === travelAccrualDays[1]){
                  expiresOn = travelAccrualExpires[1]
                }else if(currentDate === travelAccrualDays[2]){
                  expiresOn = travelAccrualExpires[2]
                }else if(currentDate === travelAccrualDays[3]){
                  expiresOn = travelAccrualExpires[3]
                }
                const data = {
                  lea_emp_id: reEmp.emp_id,
                  lea_month: currentMonth,
                  lea_year: currentYear,
                  lea_leave_type: travelDayLeave.leave_type_id,
                  lea_rate: parseFloat(travelDayLeave.leave_duration),
                  lea_archives: 0,
                  lea_leaveapp_id: 0,
                  lea_expires_on: expiresOn,
                  lea_fy: calendarYear
                }
                await leaveAccrualService.addLeaveAccrual(data);

              }

            })
          }
          const leaveAccruals = await leaveAccrualService.getLeaveAccruals();
          leaveAccruals.map(async (leaveAccr) => {
            if((new Date()  >= new Date(leaveAccr.lea_expires_on)) && leaveAccr.lea_archives === 0){
              const inst = await leaveAccrualService.archiveAccrual(leaveAccr.lea_id);
            }
          })
        }
      } catch (e) {

      }
    }

    async function runCronJobForRnRLeaveType(){
      try {
        const months = [2,4,6,8,10,12];
        const cDate = new Date();
        const currentDay = cDate.getDate();
        const currentMonth = new Date().getMonth()+1;
        const currentYear = new Date().getFullYear();
        const result = await leaveApplicationService.getApprovedLeaves();
        const rNrLeaveType = await leaveTypeService.getLeaveTypeByName('R & R');
        if(!(_.isEmpty(rNrLeaveType)) || !(_.isNull(rNrLeaveType))){
          const relocatableEmployees = await employeeService.getEmployeeByRelocatableStatus(1);

          if(months.includes(currentMonth)){
            relocatableEmployees.map(async (reEmp) => {
              const existing = await leaveAccrualService.findLeaveAccrualByLeaveApplication(reEmp.emp_id, currentMonth, currentYear, rNrLeaveType.leave_type_id);
              if(_.isEmpty(existing) || _.isNull(existing)){
                let expiresOn = `${currentYear}-${currentMonth === 12 ? 1 : currentMonth+1}-15`;
                const calendarYear = currentMonth >= 1 || currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear+1}`;
                const data = {
                  lea_emp_id: reEmp.emp_id,
                  lea_month: currentMonth,
                  lea_year: currentYear,
                  lea_leave_type: rNrLeaveType.leave_type_id,
                  lea_rate: parseFloat(rNrLeaveType.leave_duration),
                  lea_archives: 0,
                  lea_leaveapp_id: 0,
                  lea_expires_on: expiresOn,
                  lea_fy: calendarYear
                }
                await leaveAccrualService.addLeaveAccrual(data);
              }

            })
          }

        }
      } catch (e) {
        //return res.status(400).json('Whoops!');
      }
    }

    async function runGeneralMonthlyLeaveRoutine(){
        const leaveTypesData = await leaveTypeService.getLeavesWithOptions(1, 0, 1 ).then((data) => {
            return data
        })
        const employees = await employee.getActiveEmployees().then((data) => {
            return data
        })

        const currentMonth = new Date().getMonth()+1;
        const currentYear = new Date().getFullYear();

        const calendarYear = currentMonth >= 1 || currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear+1}`;
        const leaveYear = currentMonth >= 1 || currentMonth <= 9 ? currentYear : currentYear+1;
        const expiresOn = `${leaveYear}-09-30`
        for (const emp of employees){
            for (const leaveType of leaveTypesData) {
                const leaveAccrual = {
                    lea_emp_id: emp.emp_id,
                    lea_month: currentMonth,
                    lea_year: currentYear,
                    lea_leave_type: leaveType.leave_type_id,
                    lea_rate: parseFloat(leaveType.lt_rate),
                    lea_leaveapp_id: 0,
                    lea_archives: 0,
                    lea_expires_on: expiresOn,
                    lea_fy: calendarYear
                }
                const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
                    return data
                })

            }
        }

    }

    async function runGeneralYearlyLeaveRoutine(){
        const leaveTypesData = await leaveTypeService.getLeavesWithOptions(1, 0, 2 ).then((data) => {
            return data
        })
        const employees = await employee.getActiveEmployees().then((data) => {
            return data
        })

        const currentMonth = new Date().getMonth()+1;
        const currentYear = new Date().getFullYear();

        const calendarYear = currentMonth >= 1 || currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear+1}`;
        const leaveYear = currentMonth >= 1 || currentMonth <= 9 ? currentYear : currentYear+1;
        const expiresOn = `${leaveYear}-09-30`
        for (const emp of employees){
            for (const leaveType of leaveTypesData) {
                const leaveAccrual = {
                    lea_emp_id: emp.emp_id,
                    lea_month: currentMonth,
                    lea_year: currentYear,
                    lea_leave_type: leaveType.leave_type_id,
                    lea_rate: parseFloat(leaveType.lt_rate),
                    lea_leaveapp_id: 0,
                    lea_archives: 0,
                    lea_expires_on: expiresOn,
                    lea_fy: calendarYear
                }
                const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
                    return data
                })

            }
        }

    }

    nodeCron.schedule("0 6 * * *", updateApprovedLeaveStatus).start();
    nodeCron.schedule("0 6 * * *", travelDayLeaveAccrual).start();
    nodeCron.schedule("0 0 1 * *", runCronJobForRnRLeaveType).start();
    nodeCron.schedule("0 0 1 * *", runGeneralMonthlyLeaveRoutine).start();
    nodeCron.schedule("0 0 0 1 OCT * *", runGeneralYearlyLeaveRoutine).start();



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
