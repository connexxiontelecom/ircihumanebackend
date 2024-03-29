const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const announcementService = require('../services/announcementService');
const ROLES = require('../roles')
const _ = require("lodash");
/* education provider routes. */

router.post('/',auth(), announcementService.publishAnnouncement);
router.get('/:id',auth(), announcementService.getAnnouncementByAuthor);
router.get('/all/announcements',auth(), announcementService.getAllAnnouncements);
router.get('/employee/:id',auth(), announcementService.getEmployeeAnnouncements);

router.post('/announcement-doc/:announcementId', auth(), announcementService.uploadFiles);


module.exports = router;
