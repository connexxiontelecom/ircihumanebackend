const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");

const employeeCategoryService = require('../services/employeeCategoryService');

/* employee category routes. */

router.get('/', auth, employeeCategoryService.getEmployeeCategories);
router.post('/', auth, employeeCategoryService.setNewEmployeeCategory);
router.get('/:id', auth, employeeCategoryService.getEmployeeCategoryById);
router.patch('/:id', auth, employeeCategoryService.updateEmployeeCategory);

module.exports = router;
