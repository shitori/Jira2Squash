const xml2js = require('./../models/rf2squash/maker')

const sourceFilePath = "./../backup/test.xml"
const cibleMappingFilePath = "./../backup/mappingSetUp.json"
const cibleStatusTestsFilePath = "./../bdd/statusTests.json"

xml2js.setUpToSquashFromXmlFileWithOption(sourceFilePath, cibleMappingFilePath, cibleStatusTestsFilePath)
