var maker = require('./../models/maker')
var helper = require('./../models/helper')

//v1
var jira = require('./../models/apiJira')
var squash = require('./../models/apiSquash')

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
                console.log(res);
                squash.importInSquashWithAPI(res, 999)
            })
            .then(squashReturn => console.log(squashReturn))
            .catch(err => console.log(err))

        res.redirect('/')
    },

    fromFile: (req, res) => {

        req.body = helper.checkInput(req.body)
        console.log(req.body);
        console.log(req.files);

        helper.saveSourceFile(req.files)
            .then(sourcePath => {
                maker.writeOnSquash(req.body.inputSprint, req.body.inputSquash, req.body.inputHeader, req.body.inputFooter, sourcePath)
                helper.removeTmpFile(sourcePath)
                setTimeout(() => {
                    res.download(req.body.inputSquash)
                }, 1000);

            })
            .catch(err => console.log("error : " + err))
    },

    fromAPI: (req, res) => {
        req.body = helper.checkInput(req.body)
        console.log(req.body);
        if (req.body.inputJiraSprintRequest !== undefined) {
            req.body.inputJiraRequest = "project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = " + req.body.inputJiraSprintRequest + " ORDER BY priority DESC, updated DESC"
        }
        jira.getIssues(req.body.inputJiraRequest, req.body.inputSessionTokenJira)
            .then(dataAPI => {
                if (req.body.validator == 'file') {
                    maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                    setTimeout(() => {
                        res.download(req.body.inputSquash)
                    }, 1000);
                } else if (req.body.validator == 'api') {
                    squash.importInSquashWithAPI(dataAPI, req.body.inputSessionTokenSquash, req.body.inputSprint)
                    res.redirect('/')
                } else {
                    squash.importInSquashWithAPI(dataAPI, req.body.inputSessionTokenSquash, req.body.inputSprint)
                    maker.writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                    setTimeout(() => {
                        res.download(req.body.inputSquash)
                    }, 1000);
                }
            })
    }
}