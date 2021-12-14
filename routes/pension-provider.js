const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const pensionprovider = require('../services/pensionProivderService');

/* Pension provider routes. */

router.get('/',auth, pensionprovider.getPensionProviders);
router.post('/',auth, pensionprovider.setNewPensionProvider);
router.get('/:id',auth, pensionprovider.getPensionProviderById);
router.patch('/:id',auth, pensionprovider.updatePensionProvider);


module.exports = router;
