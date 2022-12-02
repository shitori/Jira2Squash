var express = require('express')
var router = express.Router()

const controller = require('../controllers/defaultController')
const controller_test = require('../controllers/testController')
const controller_prototype = require('../controllers/protoController')

router.get('/', controller.home)

router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

router.post('/file', controller.getFile)

router.post('/rf2squashnofile', controller.rf2squashnofile)

router.get('/rfhtml', controller.getRobotFrameWorkHtml)

//! PROTOTYPE A FINIR

router.post('/rf2squash', controller_prototype.rf2squash)

// ! TEST

router.get('/test', controller_test.test)

router.get('/testSocket', controller_test.testSocket)

module.exports = router
