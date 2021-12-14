const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const subsidiaryService = require('../services/subsidiaryService');

/* Pension provider routes. */

router.get('/',auth, subsidiaryService.getSubsidiaries);
router.post('/',auth, subsidiaryService.setNewSubsidiary);
router.get('/:id',auth, subsidiaryService.getSubsidiaryById);
router.patch('/:id',auth, subsidiaryService.updateSubsidiary);


module.exports = router;
