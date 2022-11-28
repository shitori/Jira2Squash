var maker_test = require('../models/maker_test')
var Squash = require('../models/v2/apiSquash')
var Proxy = require('../models/v2/proxy')

const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    test: (req, res) => {
        maker_test.test()
        res.redirect('/')
    },

    testSocket: (req, res) => {
        maker_test.testSocket()
        res.redirect('/')
    },

    testsIteraction: (req, res) => {
        let squash = new Squash(
            new Proxy(req.query.tokenSessionSquash).getProxy()
        )
        squash
            .getTestsSuiteOfIteractionP1()
            .then((result) => {
                return squash.primaryTest(result)
            })
            .then((result) => {
                res.json({ data: result })
            })
            .catch((err) => res.json({ err: err }))
    },
}
