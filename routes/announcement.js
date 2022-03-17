const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const announcementService = require('../services/announcementService');

/* education provider routes. */

router.post('/',auth, announcementService.publishAnnouncement);
router.get('/:id',auth, announcementService.getAnnouncementByAuthor);
router.get('/all/announcements',auth, announcementService.getAllAnnouncements);




module.exports = router;
