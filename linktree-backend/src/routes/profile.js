const { Router } = require('express');
const { getPublicProfile } = require('../controllers/profileController');

const router = Router();

router.get('/:username', getPublicProfile);

module.exports = router;