const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const leaveService = require('../services/leaveTypeService');

/* leave routes. */

router.get('/',auth, leaveService.getLeaveTypes);
router.post('/',auth, leaveService.setNewLeaveType);
router.get('/:id',auth, leaveService.getLeaveTypeById);
router.patch('/:id',auth, leaveService.updateLeaveType);


module.exports = router;
