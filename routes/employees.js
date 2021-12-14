const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const employees = require('../services/employeeService');



/* GET employees. */
router.get('/', async function(req, res, next) {
    try {

        await employees.getAllEmployee().then((data)=>{
         res.send(data);
      });

     await employees.getOneEmployee(9).then((data)=>{

        });

    } catch (err) {
        console.error(`Error while getting employees `, err.message);
        next(err);
    }
});

router.get('/getemployee', async function(req, res, next){

})
router.post('/employee-enrollment', employees.createNewEmployee);

module.exports = router;
