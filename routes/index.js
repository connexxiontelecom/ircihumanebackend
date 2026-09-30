function registerRoutes(app) {
  const employeeRouter = require('./employees');
  app.use('/employees', employeeRouter);

  const bankRouter = require('./bank');
  app.use('/banks', bankRouter);

  const pensionProviderRouter = require('./pension-provider');
  app.use('/pension-providers', pensionProviderRouter);

  const hmoRouter = require('./hmo');
  app.use('/hmos', hmoRouter);

  const departmentRouter = require('./department');
  app.use('/departments', departmentRouter);

  const gradeRouter = require('./grade');
  app.use('/grades', gradeRouter);

  const jobRoleRouter = require('./job-role');
  app.use('/job-roles', jobRoleRouter);

  const locationRouter = require('./location');
  app.use('/locations', locationRouter);

  const qualificationRouter = require('./qualification');
  app.use('/qualifications', qualificationRouter);

  const subsidiaryRouter = require('./subsidiary');
  app.use('/subsidiaries', subsidiaryRouter);

  const leaveTypeRouter = require('./leave-type');
  app.use('/leave-types', leaveTypeRouter);

  const stateRouter = require('./state');
  app.use('/states', stateRouter);

  const countryCodeRouter = require('./country-code');
  app.use('/country-codes', countryCodeRouter);

  const reliefTypeRouter = require('./reliefType.routes');
  app.use('/relief-types', reliefTypeRouter);

  const taxReliefRouter = require('./taxRelief.routes');
  app.use('/tax-reliefs', taxReliefRouter);

  const employeeCategoryRouter = require('./employee-category');
  app.use('/employee-categories', employeeCategoryRouter);

  const countryRouter = require('./country');
  app.use('/countries', countryRouter);

  const userRouter = require('./users');
  app.use('/users', userRouter);

  const paymentDefinitionRouter = require('./paymentDefinitions');
  app.use('/payment-definitions', paymentDefinitionRouter);

  const lgaRouter = require('./lga');
  app.use('/local-government', lgaRouter);

  const educationRouter = require('./education');
  app.use('/education', educationRouter);

  const workExperienceRouter = require('./work-experience');
  app.use('/work-experience', workExperienceRouter);

  const announcementRouter = require('./announcement');
  app.use('/announcements', announcementRouter);

  const queryRouter = require('./query');
  app.use('/queries', queryRouter);

  const queryReplyRouter = require('./queryReply');
  app.use('/query-reply', queryReplyRouter);

  const logRouter = require('./logs');
  app.use('/logs', logRouter);

  const taxRateRouter = require('./taxRates');
  app.use('/tax-rates', taxRateRouter);

  const minimumTaxRateRouter = require('./minimumTaxRates');
  app.use('/minimum-tax-rate', minimumTaxRateRouter);

  const locationAllowanceRouter = require('./locationAllowances');
  app.use('/location-allowance', locationAllowanceRouter);

  const authorizationRoleRouter = require('./authorization-role');
  app.use('/authorization-roles', authorizationRoleRouter);

  const donorRouter = require('./donor');
  app.use('/donor', donorRouter);

  const grantChartRouter = require('./grantChart');
  app.use('/grant-chart', grantChartRouter);

  const leaveApplication = require('./leaveApplication');
  app.use('/leave-application', leaveApplication);

  const leaveDoc = require('./leaveDoc');
  app.use('/leavedoc', leaveDoc);

  const supervisorAssignment = require('./supervisorAssignment');
  app.use('/supervisor-assignment', supervisorAssignment);

  const publicHolidayRouter = require('./publicHolidays');
  app.use('/public-holidays', publicHolidayRouter);

  const travelApplicationRouter = require('./travelApplication');
  app.use('/travel-applications', travelApplicationRouter);

  const authorizationRouter = require('./authorization');
  app.use('/application-authorization', authorizationRouter);

  const variationalPaymentRouter = require('./variational-payment');
  app.use('/variational-payment', variationalPaymentRouter);

  const sectorLeadRouter = require('./sectorLead');
  app.use('/sector-leads', sectorLeadRouter);

  const timeSheet = require('./timeSheet');
  app.use('/time-sheet', timeSheet);

  const timeSheetPenalty = require('./time-sheet-penalty');
  app.use('/time-sheet-penalty', timeSheetPenalty);

  const timeAllocation = require('./timeAllocation');
  app.use('/time-allocation', timeAllocation);

  const payrollMonthYearRouter = require('./payrollMonthYear');
  app.use('/payroll-month-year', payrollMonthYearRouter);

  const salaryGradeRouter = require('./salaryGrade');
  app.use('/salary-grade', salaryGradeRouter);

  const salaryStructureRouter = require('./salaryStructure');
  app.use('/salary-structure', salaryStructureRouter);

  const goalSettingRouter = require('./goalSetting');
  app.use('/goal-setting', goalSettingRouter);

  const goalSettingYearRouter = require('./goalSettingYear');
  app.use('/goal-setting-year', goalSettingYearRouter);

  const selfAssessmentRouter = require('./selfAssessment');
  app.use('/self-assessment', selfAssessmentRouter);

  const hrFocalPointRouter = require('./hrfocalpoint');
  app.use('/hr-focal-point', hrFocalPointRouter);

  const endYearAssessmentRouter = require('./endOfYearAssessment');
  app.use('/end-year-assessment', endYearAssessmentRouter);

  const ratingRouter = require('./rating');
  app.use('/rating', ratingRouter);

  const endYearRatingRouter = require('./endYearRating');
  app.use('/end-year-rating', endYearRatingRouter);

  const performanceImprovement = require('./performance-improvement');
  app.use('/performance-improvement', performanceImprovement);

  const salaryRouter = require('./salary');
  app.use('/salary', salaryRouter);

  const leaveAccrualRouter = require('./leaveAccrual');
  app.use('/leave-accrual', leaveAccrualRouter.router);

  const notificationRouter = require('./notification');
  app.use('/notifications', notificationRouter);

  const endYearResponseRouter = require('./endOfYearResponse');
  app.use('/end-year-response', endYearResponseRouter);

  const payrollJournalRouter = require('./payroll-journal');
  app.use('/payroll-journal', payrollJournalRouter);

  const masterListRouter = require('./master-list');
  app.use('/master-list', masterListRouter);

  app.get('/', async function (req, res) {
    res.send('Get out');
  });
}

module.exports = { registerRoutes };
