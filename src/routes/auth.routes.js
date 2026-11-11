const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireGuest, requireAuth } = require('../middlewares/auth.middleware');

// Login
router.get('/login', requireGuest, (req, res) => authController.getLogin(req, res));
router.post('/login', requireGuest, (req, res, next) => authController.postLogin(req, res, next));

// Register
router.get('/register', requireGuest, (req, res) => authController.getRegister(req, res));
router.post('/register', requireGuest, (req, res, next) => authController.postRegister(req, res, next));

// Logout
router.post('/logout', requireAuth, (req, res) => authController.postLogout(req, res));

module.exports = router;

