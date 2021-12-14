const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");

=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const departmentService = require('../services/departmentService');

/* Pension provider routes. */

router.get('/', auth, departmentService.getDepartments);
router.post('/', auth, departmentService.setNewDepartment);
router.get('/:id', auth, departmentService.getDepartmentById);
router.patch('/:id', auth, departmentService.updateDepartment);


module.exports = router;
