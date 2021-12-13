const express = require('express');
const router = express.Router();
const leaveService = require('../services/leaveTypeService');

/* leave routes. */

router.get('/', leaveService.getLeaveTypes);
router.post('/', leaveService.setNewLeaveType);
router.get('/:id', leaveService.getLeaveTypeById);
router.patch('/:id', leaveService.updateLeaveType);


module.exports = router;
