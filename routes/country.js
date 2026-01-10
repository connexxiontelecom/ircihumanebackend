const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const countries = require('../services/countryService');

router.get('/', auth(), countries.getCountries);
router.get('/:id', auth(), countries.getCountryById);
router.post('/add-country', auth(), countries.setNewCountry);
router.patch('/:id', auth(), countries.updateCountry);


module.exports = router;
