const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const departmentService = require('../services/departmentService');

/* Pension provider routes. */

router.get('/', departmentService.getDepartments);
router.post('/', departmentService.setNewDepartment);
router.get('/:id', departmentService.getDepartmentById);
router.patch('/:id', departmentService.updateDepartment);


module.exports = router;
