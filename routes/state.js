const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");

const stateService = require('../services/stateService');

/* state routes. */

router.get('/', auth, stateService.getStates);
router.post('/', auth, stateService.setNewState);
router.get('/:id', auth, stateService.getStateById);
router.patch('/:id', auth, stateService.updateState);

module.exports = router;
