var express = require('express');
var router = express.Router();

var maker = require('./../models/maker')
var helper = require('./../models/helper')
var jira = require('./../models/apiJira')
var squash = require('./../models/apiSquash')


/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Jira2Squash' });
});

router.post('/fromFile', (req, res) => {

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
})

router.post('/fromAPI', (req, res) => {

  req.body = helper.checkInput(req.body)
  console.log(req.body);
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


})

module.exports = router;
