const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const authorizationService = require('../services/authorizationActionService');

/* GET authorization. */

router.post('/', auth(), authorizationService.updateAuthorizationStatus);
router.get('/:type/:authId', auth(), authorizationService.getAuthorizationByOfficerId);


module.exports = router;

