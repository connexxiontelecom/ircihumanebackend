const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const countryCodeService = require('../services/countryCodeService');

router.get('/', auth(), countryCodeService.getCountryCodes);
router.post('/', auth(), countryCodeService.createCountryCode);
router.get('/:id', auth(), countryCodeService.getCountryCodeById);
router.patch('/:id', auth(), countryCodeService.updateCountryCode);

module.exports = router;