const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controller');

// GET / - Homepage
router.get('/', homeController.index);

// GET /set-locale/:lang - Switch language (vi / en)
router.get('/set-locale/:lang', homeController.setLocale);

module.exports = router;

