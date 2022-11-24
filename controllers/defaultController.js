var maker = require('../models/maker')
var helper = require('../models/helper')
var xml2js = require('./../models/rf2squash/maker')

const dotenv = require('dotenv')
dotenv.config()

const jiraHome = process.env.JIRA_HOME_URL
const squashHome = process.env.SQUASH_HOME_URL

module.exports = {
    home: (req, res) => {
        res.render('index', { title: 'Jira2Squash', jiraHome, squashHome })
    },

    test: (req, res) => {
        maker.test()

        res.redirect('/')
    },

    testSocket: (req, res) => {
        maker.testSocket()
        res.redirect('/')
    },

    fromFile: (req, res) => {
        maker
            .fromFile(req)
            .then((localPathFile) => res.download(localPathFile))
            .catch((err) => res.json({ message: 'fail make file :' + err }))
    },

    fromAPI: (req, res) => {
        maker.fromAPI(req).then((dataQuery) => {
            res.render('success', {
                message: dataQuery.message,
                from: dataQuery.from,
                fileName: dataQuery.fileName,
                moreInfo: dataQuery.moreInfo,
            })
        })
    },

    getFile: (req, res) => {
        res.download('upload/' + req.body.fileName + '.xls')
    },

    rf2squash: (req, res) => {
        helper
            .saveTmpFile(req.files.formFile)
            .then((tmpName) => {
                return xml2js.setUpToSquashFromXmlFile(tmpName)
            })
            .then(() => {
                maker
                    .setSquashCampagneFromJsonResult(req)
                    .then((result) => res.json(result))
            })
            .catch((err) => {
                res.json({ error: err })
            })
    },

    rf2squashnofile: (req, res) => {
        maker
            .setSquashCampagneFromJsonResultV3(req)
            .then((result) => {
                let moreInfo = ''
                result.forEach((element) => {
                    moreInfo += element + '\n'
                })
                res.render('success', {
                    message: 'Squash mise à jour',
                    from: undefined,
                    fileName: undefined,
                    moreInfo: moreInfo,
                })
            })
            .catch((err) => {
                res.json({ error: err })
            })
    },
}
