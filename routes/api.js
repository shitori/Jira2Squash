var express = require('express')
var router = express.Router()

const controller = require('../controllers/apiController')
const controller_test = require('../controllers/testController')
const controller_prototype = require('../controllers/protoController')

router.post('/test', (req, res) => {
    res.json({ message: 'test', body: req.body })
})

router.post('/fromFile', controller.fromFile)

router.post('/fromApi', controller.fromAPI)

router.post('/backup', controller.backup)

router.post('/rf2squashnofile', controller.rf2squashnofile)

router.get('/oldResult', controller.getOldResult)

router.get('/jira/sprint', controller.getAllJiraSprint)

router.get('/jira/ano', controller.getAllJiraAnoUnresolved)

//! PROTOTYPE A FINIR

router.put('/copyCampaing', controller_prototype.copyCompaing)

router.get('/squash/link/', controller_prototype.prepareLinkBetweenTestsExigs)

router.get('/squash/test/', controller_prototype.getAllTestsFromSquash)

//! TEST

router.get('/testsInIteration', controller_test.testsIteraction)

module.exports = router
