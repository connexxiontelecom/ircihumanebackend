const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const jobRoleService = require('../services/jobRoleService');

/* Pension provider routes. */

router.get('/',auth(), jobRoleService.getJobRoles);
router.post('/',auth(), jobRoleService.setNewJobRole);
router.get('/:id',auth(), jobRoleService.getJobRoleById);
router.patch('/:id',auth(), jobRoleService.updateJobRole);


module.exports = router;
