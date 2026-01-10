const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const countryCodeService = require('../services/countryCodeService');

router.get('/', auth(), countryCodeService.getCountryCodes);
router.post('/', auth(), countryCodeService.createCountryCode);
router.get('/:id', auth(), countryCodeService.getCountryCodeById);
router.patch('/:id', auth(), countryCodeService.updateCountryCode);


router.get('/list/countries', auth(), countryCodeService.getCountries);
router.get('/list/countries/:id', auth(), countryCodeService.getCountryById);
router.post('/list/countries/add-country', auth(), countryCodeService.setNewCountry);
router.patch('/list/countries/:id', auth(), countryCodeService.updateCountry);


module.exports = router;
