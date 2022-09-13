const url = require('url')
var maker = require('../models/maker')
var helper = require('../models/helper')

const dotenv = require('dotenv');
dotenv.config();

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

    fromFile: (req, res) => {
        maker.fromFile(req)
            .then(localPathFile => res.download(localPathFile))
            .catch(err => res.json({ "message": "fail make file :" + err }))
    },

    fromAPI: (req, res) => {
        maker.fromAPI(req)
            .then(dataQuery => {
                res.render('success',
                    {
                        "message": dataQuery.message,
                        "from": dataQuery.from,
                        "fileName": dataQuery.fileName,
                        "moreInfo": dataQuery.moreInfo,

                    })
            })

    },

    getFile: (req, res) => {
        res.download("upload/" + req.body.fileName + ".xls")
    },

    game: (req, res) => {
        let max = req.query.max
        let array = []
        for (let i = 0; i < max; i++) {
            array[i] = []
            for (let j = 0; j < max * 2; j++) {
                array[i][j] = (helper.getRandomInt(101) < req.query.life ? (helper.getRandomInt(7) + 1) : 0)
            }
        }

        res.render("gameOfLife", { array, max })
    }

}