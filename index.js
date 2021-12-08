    const express = require("express");
    const dotenv = require("dotenv");
    const bodyParser = require('body-parser');
    const cors = require('cors');

    const app = express();
    app.use(cors());
    app.use(express.json());
    dotenv.config();

    //Routes
    const employeeRouter = require('./routes/employees')
    app.use('/employees', employeeRouter);
   
   const bankRouter = require('./routes/bank');
   app.use('/banks', bankRouter);

    const userRouter = require('./routes/users')
    app.use('/users', userRouter);

    const paymentDefinitionRouter = require('./routes/paymentDefinitions')
    app.use('/payment-definitions', paymentDefinitionRouter)

    const logRouter = require('./routes/logs')
    app.use('/logs', logRouter)



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
