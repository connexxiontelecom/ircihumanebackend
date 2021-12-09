const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const jobRoleService = require('../services/jobRoleService');

/* Pension provider routes. */

router.get('/', jobRoleService.getJobRoles);
router.post('/', jobRoleService.setNewJobRole);
router.get('/:id', jobRoleService.getJobRoleById);
router.patch('/:id', jobRoleService.updateJobRole);


module.exports = router;
