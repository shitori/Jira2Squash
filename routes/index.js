var express = require('express')
var router = express.Router()

const controller = require('../controllers/defaultController')
const controller_test = require('../controllers/testController')

router.get('/', controller.home)

router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

router.post('/file', controller.getFile)

router.post('/rf2squash', controller.rf2squash)

router.post('/rf2squashnofile', controller.rf2squashnofile)

// ! TEST

router.get('/test', controller_test.test)

router.get('/testSocket', controller_test.testSocket)

module.exports = router
