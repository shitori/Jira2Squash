var express = require('express')
var router = express.Router()

const controller = require('../controllers/guiController')

//? GET ROUTE
router.get('/', controller.home)

router.get('/rfhtml', controller.getRobotFrameWorkHtml)

router.get('/fakeCRM', controller.fakeCRM)

//? POST ROUTE
router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

router.post('/file', controller.getFile)

router.post('/rf2squashnofile', controller.rf2squashnofile)

router.post('/rf2squash', controller.rf2squash)

module.exports = router
