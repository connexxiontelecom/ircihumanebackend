const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
const subsidiaryService = require('../services/subsidiaryService');

/* Pension provider routes. */

router.get('/',auth, subsidiaryService.getSubsidiaries);
router.post('/',auth, subsidiaryService.setNewSubsidiary);
router.get('/:id',auth, subsidiaryService.getSubsidiaryById);
router.patch('/:id',auth, subsidiaryService.updateSubsidiary);


module.exports = router;
