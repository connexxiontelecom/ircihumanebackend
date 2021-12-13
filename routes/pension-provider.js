const express = require('express');
const router = express.Router();
const pensionprovider = require('../services/pensionProivderService');

/* Pension provider routes. */

router.get('/', pensionprovider.getPensionProviders);
router.post('/', pensionprovider.setNewPensionProvider);
router.get('/:id', pensionprovider.getPensionProviderById);
router.patch('/:id', pensionprovider.updatePensionProvider);


module.exports = router;
