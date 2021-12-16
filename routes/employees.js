const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const employees = require('../services/employeeService');
const auth = require("../middleware/auth");


/* GET employees. */
router.get('/', auth, employees.getAllEmployee);
/*router.get('/getemployee', async function(req, res, next){

})*/
router.post('/employee-enrollment',auth, employees.createNewEmployee);

module.exports = router;
