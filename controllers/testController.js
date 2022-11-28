var maker_test = require('../models/maker_test')

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
}
