    const express = require("express");
    const dotenv = require("dotenv");
    const bodyParser = require('body-parser');
    const cors = require('cors');

    const app = express();
    app.use(cors());
    app.use(express.json());
    dotenv.config();
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
    app.use('/payment-definitions', paymentDefinitionRouter)

    const logRouter = require('./routes/logs')
    app.use('/logs', logRouter)

    const taxRateRouter = require('./routes/taxRates')
    app.use('/tax-rates', taxRateRouter)

    const minimumTaxRateRouter = require('./routes/minimumTaxRates')
    app.use('/minimum-tax-rate', minimumTaxRateRouter)

    const locationAllowanceRouter = require('./routes/locationAllowances')
    app.use('/location-allowance',locationAllowanceRouter)


    const donorRouter = require('./routes/donor')
    app.use('/donor',donorRouter)

    const grantChartRouter = require('./routes/grantChart')
    app.use('/grant-chart',grantChartRouter)

    const leaveApplication = require('./routes/leaveApplication')
    app.use('/leave-application', leaveApplication)

    const supervisorAssignment = require('./routes/supervisorAssignment')
    app.use('/supervisor-assignment', supervisorAssignment)

    const timeSheet = require('./routes/timeSheet')
    app.use('/time-sheet', timeSheet)

    const timeAllocation = require('./routes/timeAllocation')
    app.use('/time-allocation', timeAllocation)

    const payrollMonthYearRouter = require('./routes/payrollMonthYear')
    app.use('/payroll-month-year', payrollMonthYearRouter)

    const salaryGradeRouter = require('./routes/salaryGrade')
    app.use('/salary-grade', salaryGradeRouter)

    const salaryStructureRouter = require('./routes/salaryStructure')
    app.use('/salary-structure', salaryStructureRouter)

    app.get('/',  async function(req, res) {

        res.send('you got here. so get out')
    });

    /* Error handler middleware */
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        console.error(err.message, err.stack);
        return res.status(statusCode).json({'message': err.message});

    });

     let port;


    if(process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'PRODUCTION' ){
        port = process.env.PORT || 9500
    }

    if(process.env.NODE_ENV === 'TEST'){
        port = 0
    }



    const server =   app.listen(port, ()=>{
        console.log(`Listening on ${port}`);
    })


    module.exports = server
