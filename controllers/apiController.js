var maker = require('../models/maker')
var Squash = require('../models/v2/apiSquash')
var Proxy = require('../models/v2/proxy')
const fs = require('fs').promises;

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    fromAPI: (req, res) => {
        maker.fromAPI(req)
            .then(dataQuery => { res.json(dataQuery) })
            .catch(err => { res.json(err) })
    },

    fromFile: (req, res) => {
        maker.fromFile(req)
            .then(localPathFile => res.json({ "localPathFile": localPathFile }))
            .catch(err => res.json({ "message": "fail make file :" + err }))
    },

    testsIteraction: (req, res) => {
        console.log(req.query);
        let squash = new Squash(new Proxy(req.query.tokenSessionSquash).getProxy())
        squash.getTestsSuiteOfIteractionP1()
            .then(result => {
                return squash.primaryTest(result)
            })
            .then(result => {
                console.log("ok !!");
                res.json({ "data": result })
            })
            .catch(err => res.json({ "err": err }))

    },

    copyCompaing: (req, res) => {
        let squash = new Squash(new Proxy(req.body.tokenSessionSquash).getProxy())
        squash.copyCampaingOfSprint(req.body.sprintName).then(result => res.json({ "data": result })).catch(err => res.json({ "err": err }))
        //squash._testCreateTestSuite().then(result => res.json({ "data": result })).catch(err => res.json({ "err": err }))
    },

    backup: (req, res) => {
        maker.backup().then(result => res.json({ "data": result }))
    },

    getAllTestsFromSquash: (req, res) => {
        let squash = new Squash(new Proxy(req.query.tokenSessionSquash).getProxy())
        squash.getAllTests().then(result => res.json({ "data": result })).catch(err => res.json({ "err": err }))
        //squash.getAllExigences().then(result => res.json({ "data": result })).catch(err => res.json({ "err": err }))
    },

    prepareLinkBetweenTestsExigs: (req, res) => {
        let squash = new Squash(new Proxy(req.query.tokenSessionSquash).getProxy())
        let allTests
        let allExigs
        if (req.query.useBackUp == "true") {
            let allTests = require('./../backup/allTests.json');
            let allExigs = require('./../backup/allExigs.json');
            res.json({ "allTests": allTests, "allExigs": allExigs })
        } else {
            let promises = [squash.getAllTests(), squash.getAllExigences()]
            Promise.all(promises)
                .then(async responses => {
                    allTests = responses[0];
                    allExigs = responses[1];
                    await fs.writeFile('./backup/allTests.json', JSON.stringify(allTests, null, 2));
                    await fs.writeFile('./backup/allExigs.json', JSON.stringify(allExigs, null, 2));
                    res.json({ "allTests": allTests, "allExigs": allExigs })
                }).catch(err => res.json({ "err": err }))
        }

    }
}