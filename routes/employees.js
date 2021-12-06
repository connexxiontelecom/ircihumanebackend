const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
//const { sequelize } = require('./db');
const employees = require('../services/employeeService');
const { test, }= require('../models/test');

/* GET employees. */
router.get('/', async function(req, res, next) {
    try {
        await test.findAll().then((data)=>{
            [result, metadata] = data
            res.send(result);
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
