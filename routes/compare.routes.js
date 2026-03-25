const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compare.controller');

router.get('/', compareController.compareProducts);

module.exports = router;