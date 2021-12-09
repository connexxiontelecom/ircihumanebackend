const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const leaveService = require('../services/leaveTypeService');

/* Pension provider routes. */

router.get('/', leaveService.getLeaveTypes);
router.post('/', leaveService.setNewLeaveType);
router.get('/:id', leaveService.getLeaveTypeById);
router.patch('/:id', leaveService.updateLeaveType);


module.exports = router;
