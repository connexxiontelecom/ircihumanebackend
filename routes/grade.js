const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");

=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const gradeService = require('../services/gradeService');

/* Pension provider routes. */

router.get('/',auth, gradeService.getGrades);
router.post('/',auth, gradeService.setNewGrade);
router.get('/:id',auth, gradeService.getGradeById);
router.patch('/:id',auth, gradeService.updateGrade);


module.exports = router;
