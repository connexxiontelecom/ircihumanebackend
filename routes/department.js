const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
const departmentService = require('../services/departmentService');

/* Pension provider routes. */

router.get('/', auth(), departmentService.getDepartments);
router.post('/', auth(), departmentService.setNewDepartment);
router.get('/:id', auth(), departmentService.getDepartmentById);
router.patch('/:id', auth(), departmentService.updateDepartment);


module.exports = router;
