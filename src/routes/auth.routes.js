const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login
router.get('/login', (req, res) => authController.getLogin(req, res));
router.post('/login', (req, res, next) => authController.postLogin(req, res, next));

// Register
router.get('/register', (req, res) => authController.getRegister(req, res));
router.post('/register', (req, res, next) => authController.postRegister(req, res, next));

// Logout
router.post('/logout', (req, res) => authController.postLogout(req, res));

module.exports = router;

