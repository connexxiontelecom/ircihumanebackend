const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const bank = require('../services/bankSetup');



/* GET employees. */
router.get('/', async function(req, res, next) {
    try {
        await bank.getBanks().then((data)=>{
            res.send(data);
        });

        await employees.getOneEmployee(9).then((data)=>{

        });

    } catch (err) {
        console.error(`Error while getting banks `, err.message);
        next(err);
    }
});

router.get('/banks', async function(req, res, next){

})

module.exports = router;
