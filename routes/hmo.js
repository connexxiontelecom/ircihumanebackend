const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const hmoservice = require('../services/hmoService');

/* Pension provider routes. */

router.get('/', auth(), hmoservice.getHmos);
router.post('/', auth(), hmoservice.setNewHmo);
router.get('/:id', auth(), hmoservice.getHmoById);
router.patch('/:id', auth(), hmoservice.updateHmo);


module.exports = router;
