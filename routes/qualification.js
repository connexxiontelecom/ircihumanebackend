const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
=======

>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const qualificationService = require('../services/qualificationService');

/* Pension provider routes. */

router.get('/',auth, qualificationService.getQualifications);
router.post('/',auth, qualificationService.setNewQualification);
router.get('/:id',auth, qualificationService.getQualificationById);
router.patch('/:id',auth, qualificationService.updateQualification);


module.exports = router;
