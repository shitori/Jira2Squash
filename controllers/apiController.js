var maker = require('../models/maker')

const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    fromAPI: (req, res) => {
        maker
            .fromAPI(req)
            .then((dataQuery) => {
                res.json(dataQuery)
            })
            .catch((err) => {
                res.json(err)
            })
    },

    fromFile: (req, res) => {
        maker
            .fromFile(req)
            .then((localPathFile) => res.json({ localPathFile: localPathFile }))
            .catch((err) => res.json({ message: 'fail make file :' + err }))
    },

    backup: (req, res) => {
        maker.backup(req).then((result) => res.json({ data: result }))
    },
}
