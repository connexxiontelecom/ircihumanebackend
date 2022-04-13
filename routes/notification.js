const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
const {sequelize, Sequelize} = require("../services/db");
const notificationModel = require('../models/notification')(sequelize, Sequelize);

/* Notification  router */

router.get('/',auth, async (req, res)=>{
  const notifications = await notificationModel.getAllNotifications();
  return  res.status(200).json(notifications);
});
router.get('/:empId',auth, async (req, res)=>{
  const empId = req.params.empId;
  const notifications = await notificationModel.getAllEmployeeUnreadNotifications(parseInt(empId));
  return  res.status(200).json(notifications);
});



module.exports = router;
