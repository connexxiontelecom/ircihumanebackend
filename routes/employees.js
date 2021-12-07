const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const { sequelize, Sequelize } = require('../services/db');
const employees = require('../services/employeeService');
const test = require("../models/test")(sequelize, Sequelize.DataTypes)


/* GET employees. */
router.get('/', async function(req, res, next) {
    try {
        test.save({

        })
        await test.findAll().then((data)=>{

            res.send(data);
            res.status(200)
        });

     // await employees.getAllEmployee().then((data)=>{
     //      [result, metadata] = data
     //     res.send(result);
     //  });
      //employees_request = toJSON(employees_request[0]);
      //res.send(employees_request);

    } catch (err) {
        console.error(`Error while getting employees `, err.message);
        next(err);
    }
});

module.exports = router;
