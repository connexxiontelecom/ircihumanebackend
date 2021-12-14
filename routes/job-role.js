const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const jobRoleService = require('../services/jobRoleService');

/* Pension provider routes. */

router.get('/',auth, jobRoleService.getJobRoles);
router.post('/',auth, jobRoleService.setNewJobRole);
router.get('/:id',auth, jobRoleService.getJobRoleById);
router.patch('/:id',auth, jobRoleService.updateJobRole);


module.exports = router;
