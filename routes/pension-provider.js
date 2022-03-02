const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const pensionprovider = require('../services/pensionProivderService');

/* Pension provider routes. */

router.get('/',auth, pensionprovider.getPensionProviders);
router.post('/',auth, pensionprovider.setNewPensionProvider);
router.get('/:id',auth, pensionprovider.getPensionProviderById);
router.patch('/:id',auth, pensionprovider.updatePensionProvider);


module.exports = router;
