const url = require('url')
var maker = require('./../models/maker')
var helper = require('./../models/helper')

//v2
const Jira = require("./../models/v2/apiJira")
const Proxy = require("./../models/v2/proxy")
const Squash = require("./../models/v2/apiSquash")

module.exports = {
    home: (req, res) => {
        res.render('index', { title: 'Jira2Squash' })
    },

    test: (req, res) => {
        var proxyJira = new Proxy("F7BCA379342DAFB9C2EC27C7751051D3")
        var proxySquash = new Proxy("81929304DF98798D0F36631F77A5D612")
        var jira = new Jira(proxyJira.getProxy())
        var squash = new Squash(proxySquash.getProxy())
        jira.getIssues("project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC")
            .then(res => {
                squash.importInSquashWithAPI(res, 999)
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
                        var ret = maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                        res.redirect(url.format({
                            pathname: "/success",
                            query: {
                                "from": req.body.validator,
                                "fileName": sourceName,
                                "message": "OK : " + ret
                            }
                        }))
                        break;
                    case 'api':
                        squash.importInSquashWithAPI(dataAPI, req.body.inputSprint)
                            .then(ret => {
                                res.redirect(url.format({
                                    pathname: "/success",
                                    query: {
                                        "from": req.body.validator,
                                        "fileName": undefined,
                                        "message": "OK : " + ret
                                    }
                                }))
                            }).catch(err => {
                                res.redirect(url.format({
                                    pathname: "/success",
                                    query: {
                                        "from": req.body.validator,
                                        "fileName": undefined,
                                        "message": "KO : " + err
                                    }
                                }))
                            })

                        break;
                    default:
                        squash.importInSquashWithAPI(dataAPI, req.body.inputSprint).then(ret => {
                            ret = ret + '\n' + maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                            res.redirect(url.format({
                                pathname: "/success",
                                query: {
                                    "from": "other",
                                    "fileName": sourceName,
                                    "message": "OK : " + ret
                                }
                            }))
                        })


                        break;
                }
            }).catch(err => console.error(err))
    },

    success: (req, res) => {
        res.render('success',
            {
                "message": req.query.message,
                "from": req.query.from,
                "fileName": req.query.fileName
            })
    },

    getFile: (req, res) => {
        console.log(req.body);
        res.download("upload/" + req.body.fileName + ".xls")
    }
}