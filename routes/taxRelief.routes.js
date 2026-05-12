const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const taxReliefs = require('../services/taxRelief.service');

router.get('/', auth(), taxReliefs.getTaxReliefs);
router.get('/:id', auth(), taxReliefs.getTaxReliefById);
router.post('/add-tax-relief', auth(), taxReliefs.createTaxRelief);
router.post('/bulk-upload', auth(), taxReliefs.bulkCreateTaxRelief);
router.patch('/:id', auth(), taxReliefs.updateTaxRelief);
router.delete('/:id', auth(), taxReliefs.deleteTaxRelief);

module.exports = router;
