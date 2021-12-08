const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const hmoservice = require('../services/hmoService');

/* Pension provider routes. */

router.get('/', hmoservice.getHmos);
router.post('/', hmoservice.setNewHmo);
router.get('/:id', hmoservice.getHmoById);
router.patch('/:id', hmoservice.updateHmo);


module.exports = router;
