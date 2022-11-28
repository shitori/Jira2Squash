var helper = require('../models/helper')
var Squash = require('../models/v2/apiSquash')
var Proxy = require('../models/v2/proxy')
const fs = require('fs').promises
var maker = require('../models/maker')
var xml2js = require('./../models/rf2squash/maker')

const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    getAllTestsFromSquash: (req, res) => {
        let squash = new Squash(
            new Proxy(req.query.tokenSessionSquash).getProxy()
        )
        squash
            .getAllTests()
            .then((result) => res.json({ data: result }))
            .catch((err) => res.json({ err: err }))
    },

    prepareLinkBetweenTestsExigs: (req, res) => {
        //TODO a finir
        let squash = new Squash(
            new Proxy(req.query.tokenSessionSquash).getProxy()
        )
        let allTests
        let allExigs
        if (req.query.useBackUp == 'true') {
            let allTests = require('./../backup/allTests.json')
            let allExigs = require('./../backup/allExigs.json')
            let wpTests = helper.wordPower(
                helper.getOnlyNameFromObject(allTests)
            )
            let wpExigs = helper.wordPower(
                helper.getOnlyNameFromObject(allExigs)
            )
            res.json({ /*allTests, allExigs,*/ wpTests, wpExigs })
        } else {
            let promises = [squash.getAllTests(), squash.getAllExigences()]
            Promise.all(promises)
                .then(async (responses) => {
                    allTests = responses[0]
                    allExigs = responses[1]
                    await fs.writeFile(
                        './backup/allTests.json',
                        JSON.stringify(allTests, null, 2)
                    )
                    await fs.writeFile(
                        './backup/allExigs.json',
                        JSON.stringify(allExigs, null, 2)
                    )
                    res.json({ allTests: allTests, allExigs: allExigs })
                })
                .catch((err) => res.json({ err: err }))
        }
    },

    copyCompaing: (req, res) => {
        let squash = new Squash(
            new Proxy(req.body.tokenSessionSquash).getProxy()
        )
        squash
            .copyCampaingOfSprint(req.body.sprintName)
            .then((result) => res.json({ data: result }))
            .catch((err) => res.json({ err: err }))
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
}
