var express = require('express')
var router = express.Router()

const controller = require('../controllers/defaultController')

/* GET home page. */
router.get('/', controller.home)

router.get('/test', controller.test)

router.get('/testSocket', controller.testSocket)

router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

router.post('/file', controller.getFile)

router.post('/rf2squash', controller.rf2squash)

router.post('/rf2squashnofile', controller.rf2squashnofile)

module.exports = router
