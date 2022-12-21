var express = require('express')
var router = express.Router()

const controller = require('../controllers/apiController')

//? GET ROUTE
router.get('/oldResult', controller.getOldResult)

router.get('/jira/sprint', controller.getAllJiraSprint)

router.get('/jira/ano', controller.getAllJiraAnoUnresolved)

router.get('/squash/tests', controller.getAllSquashTests)

//? POST ROUTE
router.post('/fromFile', controller.fromFile)

router.post('/fromApi', controller.fromAPI)

router.post('/backup', controller.backup)

router.post('/rf2squashnofile', controller.rf2squashnofile)

router.post(
    '/squash/diffuseCompaingBandeauTests',
    controller.diffuseCompaingBandeauTests
)

module.exports = router
