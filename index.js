    const express = require("express");
    const dotenv = require("dotenv");
    const bodyParser = require('body-parser');
    const cors = require('cors');
   // const db = require("./services/db")
    const app = express();
    app.use(cors());
    app.use(express.json());
    dotenv.config();
    //Routes
    const employeeRouter = require('./routes/employees');
    app.use('/employees', employeeRouter);
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



    /* Error handler middleware */
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        console.error(err.message, err.stack);
        return res.status(statusCode).json({'message': err.message});

    });






    const port = process.env.PORT || 9500

    app.listen(port, ()=>{
        console.log(`Listening on ${port}`);
    })
