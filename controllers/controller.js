const url = require('url')
var maker = require('./../models/maker')
var helper = require('./../models/helper')

//v2
const Jira = require("./../models/v2/apiJira")
const Proxy = require("./../models/v2/proxy")
const Squash = require("./../models/v2/apiSquash")

const dotenv = require('dotenv');
dotenv.config();

const jiraHome = process.env.JIRA_HOME_URL
const squashHome = process.env.SQUASH_HOME_URL

module.exports = {
    home: (req, res) => {
        res.render('index', { title: 'Jira2Squash', jiraHome, squashHome })
    },

    test: (req, res) => {
        var proxyJira = new Proxy("F1A0B124ED6981EE8C5C02CDEEBCD9F8")
        var proxySquash = new Proxy("98F1437FF881DE01A32D7981F355A44E")
        var jira = new Jira(proxyJira.getProxy())
        var squash = new Squash(proxySquash.getProxy())
        jira.getIssues("project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC")
            .then(res => {
                return squash.importInSquashWithAPI(res, 999)
            })
            .then(squashReturn => console.info(squashReturn))
            .catch(err => console.error(err))

        res.redirect('/')
    },

    fromFile: (req, res) => {
        req.body = helper.checkInput(req.body)
        helper.saveSourceFile(req.files)
            .then(sourcePath => {
                maker.writeOnSquash(req.body.inputSprint, req.body.inputSquash, req.body.inputHeader, req.body.inputFooter, sourcePath)
                helper.removeTmpFile(sourcePath)
                setTimeout(() => {
                    res.download(req.body.inputSquash)
                }, 1000);
            })
            .catch(err => console.error("error : " + err))
    },

    fromAPI: (req, res) => {
        var sourceName = req.body.inputSquash
        req.body = helper.checkInput(req.body)
        var jira = new Jira(new Proxy(req.body.inputSessionTokenJira).getProxy())
        var squash = new Squash(new Proxy(req.body.inputSessionTokenSquash).getProxy())
        jira.getIssues(req.body.inputJiraRequest)
            .then(dataAPI => {
                switch (req.body.validator) {
                    case 'file':
                        return maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                    case 'api':
                        return squash.importInSquashWithAPI(dataAPI, req.body.inputSprint)
                    default:
                        return {
                            fileResult: maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI),
                            apiResult: squash.importInSquashWithAPI(dataAPI, req.body.inputSprint)
                        }
                }
            }).then(finalResult => {
                var query = {}
                switch (req.body.validator) {
                    case 'file':
                        query = {
                            "from": req.body.validator,
                            "fileName": sourceName,
                            "message": "OK : " + finalResult,
                            "moreInfo": undefined
                        }
                        break;
                    case 'api':
                        query = {
                            "from": req.body.validator,
                            "fileName": undefined,
                            "message": "OK : " + finalResult.message,
                            "moreInfo": finalResult.moreInfo
                        }
                        break;
                    default:
                        query = {
                            "from": "other",
                            "fileName": sourceName,
                            "message": "OK : " + finalResult.apiResult.message + " / " + finalResult.fileResult,
                            "moreInfo": finalResult.apiResult.moreInfo,
                        }
                        break;
                }
                res.redirect(url.format({
                    pathname: "/success",
                    query
                }))
            }).catch(err => {
                res.redirect(url.format({
                    pathname: "/success",
                    query: {
                        "from": req.body.validator,
                        "fileName": undefined,
                        "message": "KO : le transfert a échoué.",
                        "moreInfo": err
                    }
                }))
            })
    },

    success: (req, res) => {
        res.render('success',
            {
                "message": req.query.message,
                "from": req.query.from,
                "fileName": req.query.fileName,
                "moreInfo": req.query.moreInfo,
                jiraHome,
                squashHome
            })
    },

    getFile: (req, res) => {
        console.log(req.body);
        res.download("upload/" + req.body.fileName + ".xls")
    }

}