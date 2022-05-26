const express = require('express');
const router = express.Router();
//const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
const leaveService = require('../services/leaveTypeService');

/* leave routes. */

router.get('/',auth(), leaveService.getLeaveTypes);
router.post('/',auth(), leaveService.setNewLeaveType);
router.get('/:id',auth(), leaveService.getLeaveTypeById);
router.patch('/:id',auth(), leaveService.updateLeaveType);


module.exports = router;
