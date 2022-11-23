var express = require('express')
var router = express.Router()

const controller = require('../controllers/defaultController')

router.get('/', controller.game)

module.exports = router
