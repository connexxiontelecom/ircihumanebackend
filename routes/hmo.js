const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');

=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const hmoservice = require('../services/hmoService');

/* Pension provider routes. */

router.get('/', auth, hmoservice.getHmos);
router.post('/', auth, hmoservice.setNewHmo);
router.get('/:id', auth, hmoservice.getHmoById);
router.patch('/:id', auth, hmoservice.updateHmo);


module.exports = router;
