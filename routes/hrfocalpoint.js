const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const {sequelize, Sequelize} = require('../services/db');
const hrFocalPointModel = require('../models/hrfocalpoint')(sequelize, Sequelize.DataTypes);

/* GET HR Focal point. */
router.get('/:id', auth(), async (req, res)=>{
  try{
    const locationId = req.params.id;
    const focal_points = await hrFocalPointModel.getHrFocalPointsByLocationId(parseInt(locationId));
    return res.status(200).json(focal_points);
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }

});


module.exports = router;
