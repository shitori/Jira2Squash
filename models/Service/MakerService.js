var WebSocket = require('faye-websocket')

const excelToJson = require('convert-excel-to-json')
const headingColumnNames =
    require('../../bdd/headingColimnNamesExcel.json').header
const dotenv = require('dotenv')
dotenv.config()

// Variable to read JIRA ticket export
const xl = require('excel4node')
const wb = new xl.Workbook()
const ws = wb.addWorksheet('REQUIREMENT')

//Helper
var dHelper = require('../Helper/defaultHelper')
var fileHelper = require('../Helper/fileHelper')

//Service
const Jira = require('./JiraService')
const Jenkins = require('./JenkinsService')
const Squash = require('./SquashService')
var xml2js = require('./XmlService')

//Proxy & Header
const Proxy = require('../Proxy/proxy')
const SquashHeader = require('../Squash/SquashHeader')

function writeOnExcel(sprintName, squashFileName, footerSize, result) {
    //Write Column Title in Excel file
    let headingColumnIndex = 1
    headingColumnNames.forEach((heading) => {
        ws.cell(1, headingColumnIndex++).string(heading)
    })

    //Write Data in Excel file
    let rowIndex = 2
    result.forEach((record, index, array) => {
        if (index < array.length - footerSize) {
            //IGNORE FOOTER
            let columnIndex = 1
            ws.cell(rowIndex, columnIndex++).string('C') // Action
            ws.cell(rowIndex, columnIndex++).string(
                '/fcc-next-gen/' +
                    (record.nameJira.toLowerCase().includes('wallboard')
                        ? 'New Wallboard/WB - '
                        : '[NextGen]Nouveaux Bandeaux/G2R2 - ') +
                    'Sprint ' +
                    sprintName +
                    '/' +
                    record.nameJira.replaceAll('/', '\\')
            ) // REQ PATH
            ws.cell(rowIndex, columnIndex++).number(1) // REQ VERSION NUM
            ws.cell(rowIndex, columnIndex++).string(record.idJira) // REQ VERSION REFERENCE
            columnIndex++ // REQ VERSION NAME
            ws.cell(rowIndex, columnIndex++).string('MINOR') // REQ VERSION CRITICALITY
            ws.cell(rowIndex, columnIndex++).string(
                'REQ_JIRA_BUILD_' +
                    (record.typeJira == 'R??cit' ? 'STORY' : 'BUG')
            ) // REQ VERSION CATEGORY
            ws.cell(rowIndex, columnIndex++).string('UNDER_REVIEW') // REQ VERSION STATUS
            ws.cell(rowIndex, columnIndex++).string(
                '<p><a href="https://jira-build.orangeapplicationsforbusiness.com/browse/' +
                    record.idJira +
                    '" target="_blank">Lien vers le ticket JIRA</a></p>'
            ) // REQ VERSION DESCRIPTION

            rowIndex++
        }
    })

    wb.write(squashFileName)
    return 'Fichier cr????e'
}

function writeOnSquash(
    sprintName,
    squashFileName,
    headerSize,
    footerSize,
    sourceFilePath
) {
    const dataParser = fileHelper.readJsonFile('./bdd/dataParserExcel.json')

    dataParser.header.rows = headerSize
    dataParser.sourceFile = sourceFilePath

    let result = excelToJson(dataParser)

    result = result.general_report
    return writeOnExcel(sprintName, squashFileName, footerSize, result)
}

function writeOnSquashAPI(sprintName, squashFileName, dataAPI) {
    return writeOnExcel(sprintName, squashFileName, 0, dataAPI)
}

function fromFile(req) {
    return new Promise((resolve, reject) => {
        req.body = dHelper.checkInput(req.body)
        fileHelper
            .saveSourceFile(req.files)
            .then((sourcePath) => {
                writeOnSquash(
                    req.body.inputSprint,
                    req.body.inputSquash,
                    req.body.inputHeader,
                    req.body.inputFooter,
                    sourcePath
                )
                fileHelper.removeTmpFile(sourcePath)
                setTimeout(() => {
                    resolve(req.body.inputSquash)
                }, 1000)
            })
            .catch((err) => reject({ message: 'error in fromFile', err }))
    })
}

function fromAPI(req) {
    return new Promise((resolve) => {
        let sourceName = req.body.inputSquash
        let jira = new Jira(
            new Proxy(req.body.inputSessionTokenJira).getProxy()
        )
        let squash = new Squash(SquashHeader)
        if (
            req.body.inputSprintJira !== undefined &&
            req.body.inputSprintJira !== ''
        ) {
            jira.getSprintID(req.body.inputSprintJira)
                .then((res) => {
                    req.body.inputJiraSprintRequest = res
                    _excuteProcessFromAPI(
                        req,
                        jira,
                        squash,
                        sourceName,
                        resolve
                    )
                })
                .catch((err) => {
                    console.error('error in getSprintID use in getSprintID')
                    throw err
                })
        } else {
            _excuteProcessFromAPI(req, jira, squash, sourceName, resolve)
        }
    })
}

function _excuteProcessFromAPI(req, jira, squash, sourceName, resolve) {
    req.body = dHelper.checkInput(req.body)

    let client = new WebSocket.Client('ws://localhost:3002/')

    client.on('open', () => {
        let starter = {
            message: 'Start of the transfer from Jira to Squash.',
            percent: 1,
            cible: 'fromAPI',
        }
        client.send(JSON.stringify(starter)) // !First Send
        jira.getIssues(req.body.inputJiraRequest)
            .then((dataAPI) => {
                let endJira = {
                    message: "Get all Jira ticket's.",
                    percent: 30,
                    cible: 'fromAPI',
                }
                client.send(JSON.stringify(endJira)) // !Second Send
                switch (req.body.validator) {
                    case 'file':
                        return writeOnSquashAPI(
                            req.body.inputSprint,
                            req.body.inputSquash,
                            dataAPI
                        )
                    case 'api':
                        return squash.importInSquashWithAPI(
                            dataAPI,
                            req.body.inputSprint
                        )
                    default:
                        return {
                            fileResult: writeOnSquashAPI(
                                req.body.inputSprint,
                                req.body.inputSquash,
                                dataAPI
                            ),
                            apiResult: squash.importInSquashWithAPI(
                                dataAPI,
                                req.body.inputSprint
                            ),
                        }
                }
            })
            .then((finalResult) => {
                let query = {}
                switch (req.body.validator) {
                    case 'file':
                        query = {
                            from: req.body.validator,
                            fileName: sourceName,
                            message: 'OK : ' + finalResult,
                            moreInfo: undefined,
                        }
                        break
                    case 'api':
                        query = {
                            from: req.body.validator,
                            fileName: undefined,
                            message: 'OK : ' + finalResult.message,
                            moreInfo: finalResult.moreInfo,
                        }
                        break
                    default:
                        query = {
                            from: 'other',
                            fileName: sourceName,
                            message:
                                'OK : ' +
                                finalResult.apiResult.message +
                                ' / ' +
                                finalResult.fileResult,
                            moreInfo: finalResult.apiResult.moreInfo,
                        }
                        break
                }
                client.close()
                resolve(query)
            })
            .catch((err) => {
                client.close()
                console.error(err)
                resolve({
                    from: req.body.validator,
                    fileName: undefined,
                    message: 'KO : le transfert a ??chou??.',
                    moreInfo: err,
                })
            })
    })

    client.on('message', function (message) {
        console.info("Data from WebSocketServer maker'" + message.data + "'")
    })

    client.on('close', function (message) {
        console.info('Connection closed!', message.code, message.reason)

        client = null
    })
}

function getRobotFrameWorkReport() {
    return new Promise((resolve, reject) => {
        let jenkins = new Jenkins()
        jenkins
            .getHTMLResultRobotFrameWork()
            .then((file) => {
                resolve(fileHelper.saveHtmlFile(file))
            })
            .catch((err) =>
                reject({ message: 'error in getRobotFrameWorkReport', err })
            )
    })
}

function setSquashCampagneFromJsonResultWithXmlFile(req) {
    return new Promise((resolve, reject) => {
        let squash = new Squash(SquashHeader)

        let client = new WebSocket.Client('ws://localhost:3002/')

        client.on('open', () => {
            let starter = {
                message: 'Start transfer from RobotFramework to Squash.',
                percent: 1,
                cible: 'fromRF',
            }
            client.send(JSON.stringify(starter)) // !First Send

            fileHelper
                .saveTmpFile(req.files.formFile)
                .then((tmpName) => {
                    let endServerTmp = {
                        message: "RobotFrameWork's result saved",
                        percent: 20,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endServerTmp))
                    return xml2js.setUpToSquashFromXmlFile(tmpName)
                })
                .then(() => {
                    let endXml2js = {
                        message:
                            "RobotFrameWork's result saved into JSON content",
                        percent: 30,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endXml2js))
                    let resultRobotFrameWork = fileHelper.readJsonFile(
                        './bdd/statusTests.json'
                    )
                    let mapping = fileHelper.readJsonFile('./bdd/mapping.json')
                    return squash.setSquashCampagneFromJsonResult(
                        req,
                        resultRobotFrameWork,
                        mapping
                    )
                })
                .then((res) => {
                    let endSquash = {
                        message: "RobotFrameWork's result saved into Squash",
                        percent: 100,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endSquash))
                    client.close()
                    resolve(res)
                })
                .catch((err) => {
                    client.close()
                    reject({
                        message: 'error in setSquashCampagneFromJsonResult',
                        err,
                    })
                })
        })

        client.on('message', function (message) {
            console.info(
                "Data from WebSocketServer maker'" + message.data + "'"
            )
        })

        client.on('close', function (message) {
            console.info('Connection closed!', message.code, message.reason)

            client = null
        })
    })
}

function setSquashCampagneFromJsonResult(req) {
    return new Promise((resolve, reject) => {
        let squash = new Squash(SquashHeader)

        let client = new WebSocket.Client('ws://localhost:3002/')
        let jenkins = new Jenkins()

        client.on('open', () => {
            let starter = {
                message: 'Start transfer from RobotFramework to Squash.',
                percent: 1,
                cible: 'fromRF',
            }
            client.send(JSON.stringify(starter)) // !First Send
            jenkins
                .getOutputResultRobotFrameWork()
                .then((file) => {
                    let endJenkins = {
                        message: "RobotFrameWork's result geted",
                        percent: 10,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endJenkins))
                    return fileHelper.saveTmpFile(file)
                })
                .then((tmpName) => {
                    let endServerTmp = {
                        message: "RobotFrameWork's result saved",
                        percent: 20,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endServerTmp))
                    return xml2js.setUpToSquashFromXmlFile(tmpName)
                })
                .then(() => {
                    let endXml2js = {
                        message:
                            "RobotFrameWork's result saved into JSON content",
                        percent: 30,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endXml2js))
                    let resultRobotFrameWork = fileHelper.readJsonFile(
                        './bdd/statusTests.json'
                    )
                    let mapping = fileHelper.readJsonFile('./bdd/mapping.json')
                    return squash.setSquashCampagneFromJsonResult(
                        req,
                        resultRobotFrameWork,
                        mapping
                    )
                })
                .then((res) => {
                    let endSquash = {
                        message: "RobotFrameWork's result saved into Squash",
                        percent: 100,
                        cible: 'fromRF',
                    }
                    client.send(JSON.stringify(endSquash))
                    client.close()
                    resolve(res)
                })
                .catch((err) => {
                    client.close()
                    reject({
                        message: 'error in setSquashCampagneFromJsonResult',
                        err,
                    })
                })
        })

        client.on('message', function (message) {
            console.info(
                "Data from WebSocketServer maker'" + message.data + "'"
            )
        })

        client.on('close', function (message) {
            console.info('Connection closed!', message.code, message.reason)

            client = null
        })
    })
}

function getOldResult() {
    let resultRobotFrameWork = fileHelper.readJsonFile('./bdd/statusTests.json')
    let shortRes = fileHelper.readJsonFile('./tmp/shortResultJson.json')
    let mapping = fileHelper.readJsonFile('./bdd/mapping.json')
    let data = []
    shortRes.forEach((el) => {
        Object.entries(mapping).forEach((kv) => {
            let key = kv[0]
            let value = kv[1]
            if (value.includes(el.refTestId)) {
                let findedResultRobotFrameWork = resultRobotFrameWork.find(
                    (rrb) => rrb.name === key
                )
                if (
                    findedResultRobotFrameWork !== undefined &&
                    findedResultRobotFrameWork.status == 'OK'
                ) {
                    console.info(el.refTestName + ' trouv?? en succ??s')
                    data.push({
                        message:
                            'Test ' +
                            el.id +
                            ' anciennement mise ?? jour avec le status : SUCCESS',
                        id: el.id,
                        status: 'SUCCESS',
                        testName: el.refTestName,
                        realId: el.refTestId,
                    })
                } else if (
                    findedResultRobotFrameWork !== undefined &&
                    findedResultRobotFrameWork.status == 'KO'
                ) {
                    console.info(el.refTestName + ' trouv?? en ??chec')
                    data.push({
                        message:
                            'Test ' +
                            el.id +
                            ' anciennement mise ?? jour avec le status : FAILURE',
                        id: el.id,
                        status: 'FAILURE',
                        testName: el.refTestName,
                        realId: el.refTestId,
                    })
                } else if (key === 'UNTESTABLE') {
                    console.info(
                        el.refTestName + ' pas testable pour le moment'
                    )
                    data.push({
                        message:
                            'Test ' +
                            el.id +
                            ' anciennement mise ?? jour avec le status : UNTESTABLE',
                        id: el.id,
                        status: 'UNTESTABLE',
                        testName: el.refTestName,
                        realId: el.refTestId,
                    })
                }
            }
        })
    })
    return data
}

function backup(req) {
    // TODO jira OK --> SQUASH call API TODO
    return new Promise((resolve) => {
        let jira = new Jira(new Proxy(req.body.tokenSessionJira).getProxy())
        /*let squash = new Squash(
            new Proxy(req.body.tokenSessionSquash).getProxy()
        )*/
        let idSprint = require('../../bdd/idSprints.json')
        let promises = []
        Object.entries(idSprint).forEach((el) => {
            //let key = el[0]
            let value = el[1]
            if (value != '') {
                promises.push(
                    jira.getIssues(
                        'project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = ' +
                            value +
                            ' ORDER BY priority DESC, updated DESC'
                    )
                )
            }
        })
        Promise.all(promises)
            .then((results) => {
                let concatResult = []
                results.forEach((result) => {
                    concatResult = concatResult.concat(result)
                })
                console.info('Tickets Jira trouv??s :' + concatResult.length)
                resolve(concatResult)
            })
            .catch((err) => resolve(err))
    })
}

function getAllJiraSprint(req) {
    let jira = new Jira(new Proxy(req.body.tokenSessionJira).getProxy())
    return jira.getAllSprintSprint()
}

function getAllAnoUnresolvedJira(req) {
    let jira = new Jira(new Proxy(req.body.tokenSessionJira).getProxy())
    return jira.getAllAnoUnresolved()
}

function getAllSquashTests() {
    //let tests = fileHelper.readJsonFile('./backup/allTests.json')
    let squash = new Squash(SquashHeader)
    let mapping = fileHelper.readJsonFile('./bdd/mapping.json')
    let finalTests = []
    return new Promise((resolve, reject) => {
        squash
            .getAllTests()
            .then((tests) => {
                tests.forEach((test) => {
                    let testExist = finalTests.find(
                        (el) => el.name == test.name
                    )
                    if (testExist == undefined) {
                        finalTests.push({
                            name: test.name,
                            parents: [
                                {
                                    parent: test.parent,
                                    id: test.id,
                                },
                            ],
                            ids: [test.id],
                        })
                    } else {
                        testExist['parents'].push({
                            parent: test.parent,
                            id: test.id,
                        })
                        testExist['ids'].push(test.id)
                    }
                })
                for (const [keyMapping, valueMapping] of Object.entries(
                    mapping
                )) {
                    finalTests.forEach((test) => {
                        const found = test['ids'].some((id) =>
                            valueMapping.includes(id)
                        )
                        if (found) {
                            mapping[keyMapping] = valueMapping.concat(
                                test['ids']
                            )
                        }
                    })
                    mapping[keyMapping] = mapping[keyMapping].filter(
                        (item, index) =>
                            mapping[keyMapping].indexOf(item) === index
                    )
                }
                let promises = [
                    fileHelper.saveJsonBackUp(
                        'mappingSetUpPlus',
                        JSON.stringify(mapping, null, 4)
                    ),
                    fileHelper.saveJsonBackUp(
                        'allTestsRegroup',
                        JSON.stringify(finalTests, null, 4)
                    ),
                ]
                return Promise.all(promises)
            })
            .then((results) => {
                console.info(results)
                resolve({
                    message: 'Fichiers cr??es.',
                    newMapping: mapping,
                    regroupTest: finalTests,
                    results,
                })
            })
            .catch((err) => {
                reject({
                    message: 'Fail cr??ation fichiers',
                    newMapping: mapping,
                    regroupTest: finalTests,
                    err,
                })
            })
    })
}

function diffuseCompaingBandeauTestsSquash(req) {
    return new Promise((resolve, reject) => {
        let sprintName =
            req.body.inputSprint !== undefined && req.body.inputSprint !== ''
                ? 'Sprint ' + req.body.inputSprint
                : 'Sprint Test API'
        let seedFolderName =
            req.body.inputSeedFolder !== undefined &&
            req.body.inputSeedFolder !== ''
                ? req.body.inputSeedFolder
                : 'FCC Desktop'
        let squash = new Squash(SquashHeader)
        squash
            .getAllTests()
            .then(() => {
                console.info('tests mise ?? jour pour diffusion')
                return squash.diffuseCompaingBandeauTests(
                    sprintName,
                    seedFolderName
                )
            })
            .catch((err) => {
                reject({
                    message: 'error in diffuseCompaingBandeauTestsSquash',
                    err,
                })
            })
    })
}

module.exports = {
    writeOnSquash,
    writeOnSquashAPI,
    fromFile,
    fromAPI,
    backup,
    diffuseCompaingBandeauTestsSquash,
    setSquashCampagneFromJsonResult,
    setSquashCampagneFromJsonResultWithXmlFile,
    getRobotFrameWorkReport,
    getAllJiraSprint,
    getOldResult,
    getAllAnoUnresolvedJira,
    getAllSquashTests,
}
