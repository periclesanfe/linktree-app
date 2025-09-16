const { Router } = require('express');
const { recordClickAndRedirect } = require('../controllers/analyticsController');

const router = Router();

router.get('/:linkId', recordClickAndRedirect);

module.exports = router;