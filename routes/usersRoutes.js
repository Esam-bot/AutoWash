const express = require('express')
const router = express.Router()
const userController = require('../controllers/users.js')

router.post('/register', userController.registeruser);
router.post('/login', userController.loginuser);

module.exports= router;