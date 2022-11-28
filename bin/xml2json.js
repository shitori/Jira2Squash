//?? never use
const xml2js = require('./../models/rf2squash/maker')

const sourceFilePath = './../backup/test.xml'
const cibleMappingFilePath = './../bdd/mapping.json'
const cibleStatusTestsFilePath = './../bdd/statusTests.json'

xml2js.setUpToSquashFromXmlFileWithOption(
    sourceFilePath,
    cibleMappingFilePath,
    cibleStatusTestsFilePath
)
