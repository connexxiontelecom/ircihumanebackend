const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const bank = require('../services/bankSetupService');

/* GET banks. */

router.get('/', bank.getBanks);
router.post('/', bank.setNewBank);
router.get('/:id', bank.getBankById);
router.patch('/:id', bank.updateBank);


module.exports = router;
