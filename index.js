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
    const employeeRouter = require('./routes/employees')
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

   app.use('/employees', employeeRouter);
    app.use('/employees', employeeRouter);

   const bankRouter = require('./routes/bank');
   app.use('/banks', bankRouter);

    const userRouter = require('./routes/users')
    app.use('/users', userRouter);



    /* Error handler middleware */
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        console.error(err.message, err.stack);
        res.status(statusCode).json({'message': err.message});
        return;
    });


    app.get('/', (req, res)=>{

        res.send('Hello World')
    });

    app.get('/api/courses', (req, res)=>{
        res.send([1, 2, 3]);
    })
    const port = process.env.PORT || 9500

    app.listen(port, ()=>{
        console.log(`Listening on ${port}`);
    })
