const xml2js = require('xml2js')
const fsp = require('fs').promises

const cibleMappingFilePath = './backup/mappingSetUp.json'
const cibleStatusTestsFilePath = './bdd/statusTests.json'

function setUpToSquashFromXmlFile(sourceFilePath) {
    return setUpToSquashFromXmlFileWithOption(
        sourceFilePath,
        cibleMappingFilePath,
        cibleStatusTestsFilePath
    )
}

function setUpToSquashFromXmlFileWithOption(
    sourceFilePath,
    cibleMappingFilePath,
    cibleStatusTestsFilePath
) {
    return new Promise((resolve, reject) => {
        let returnInfo = ''
        let finalResult = []
        let mappings = {}
        let shortResult = []
        let nbSucess = 0
        fsp.readFile(sourceFilePath)
            .then((xml) => {
                xml2js.parseString(xml, (err, result) => {
                    if (err) {
                        reject(err)
                    }

                    result = result.robot.suite[0].suite
                    result.forEach((el) => {
                        el.suite.forEach((els) => {
                            shortResult.push({
                                fileName: els.$.name,
                                tests: els.test,
                            })
                        })
                    })

                    shortResult.forEach((el) => {
                        let test = {}
                        mappings[el.fileName] = []

                        let isFail = false
                        el.tests.forEach((els) => {
                            if (Array.isArray(els.kw)) {
                                els.kw.forEach((elss) => {
                                    let status = elss.status[0].$.status
                                    if (status == 'FAIL') {
                                        console.error(el.fileName + ' : KO')
                                        isFail = true
                                        test['name'] = el.fileName
                                        test['status'] = 'KO'
                                    }
                                })
                            } else {
                                console.info('Other :')
                                console.info(els)
                            } // ! cas de la loop
                        })
                        if (!isFail) {
                            test['name'] = el.fileName
                            test['status'] = 'OK'
                            nbSucess++
                        }
                        finalResult.push(test)
                    })
                    const json = JSON.stringify(finalResult, null, 4)
                    return fsp.writeFile(cibleStatusTestsFilePath, json)
                })
            })
            .then(() => {
                returnInfo +=
                    nbSucess +
                    '/' +
                    shortResult.length +
                    ' success\n'
                const json2 = JSON.stringify(mappings, null, 4)
                return fsp.writeFile(cibleMappingFilePath, json2)
            })
            .then(() => {
                returnInfo += 'mapping set up\n'
                resolve(returnInfo)
            }).catch((err) => {
                reject({ message: "setUpToSquashFromXmlFileWithOption", err })
            })
    })
}

module.exports = {
    setUpToSquashFromXmlFile,
    setUpToSquashFromXmlFileWithOption,
}
