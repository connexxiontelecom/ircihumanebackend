const express = require('express');
const router = express.Router();
const subsidiaryService = require('../services/subsidiaryService');

/* Pension provider routes. */

router.get('/', subsidiaryService.getSubsidiaries);
router.post('/', subsidiaryService.setNewSubsidiary);
router.get('/:id', subsidiaryService.getSubsidiaryById);
router.patch('/:id', subsidiaryService.updateSubsidiary);


module.exports = router;
