const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
<<<<<<< HEAD


=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const bank = require('../services/bankSetupService');

/* GET banks. */

router.get('/', auth, bank.getBanks);
router.post('/', auth, bank.setNewBank);
router.get('/:id', auth, bank.getBankById);
router.patch('/:id', auth, bank.updateBank);


module.exports = router;
