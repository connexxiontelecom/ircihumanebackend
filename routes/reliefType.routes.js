const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reliefTypes = require('../services/reliefType.service');


router.get('/', auth(), reliefTypes.getReliefTypes);
router.get('/:id', auth(), reliefTypes.getReliefTypeById);
router.post('/add-relief-type', auth(), reliefTypes.createReliefType);
router.patch('/:id', auth(), reliefTypes.updateReliefType);
router.delete('/:id', auth(), reliefTypes.deleteReliefType);

module.exports = router;
