var express = require('express')
var router = express.Router()

const controller = require('../controllers/apiController')

router.post('/test', (req, res) => {
    res.json({ message: 'test', body: req.body })
})

router.post('/fromFile', controller.fromFile)

router.post('/fromApi', controller.fromAPI)

router.get('/testsInIteration', controller.testsIteraction)

router.put('/copyCampaing', controller.copyCompaing)

router.post('/backup', controller.backup)

router.get('/squash/test/', controller.getAllTestsFromSquash)

router.get('/squash/link/', controller.prepareLinkBetweenTestsExigs)

module.exports = router
