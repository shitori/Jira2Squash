const xl = require('excel4node')
const wb = new xl.Workbook()
const ws = wb.addWorksheet('REQUIREMENT')
const excelToJson = require('convert-excel-to-json')
var WebSocket = require('faye-websocket')

var helper = require('../models/helper')

//v2
const Jira = require('../models/v2/apiJira')
const Proxy = require('../models/v2/proxy')
const Squash = require('../models/v2/apiSquash')
const Jenkins = require('./../models/jenkins')

var xml2js = require('./../models/rf2squash/maker')

const dotenv = require('dotenv')
dotenv.config()

const headingColumnNames = [
    'ACTION',
    'REQ_PATH',
    'REQ_VERSION_NUM',
    'REQ_VERSION_REFERENCE',
    'REQ_VERSION_NAME',
    'REQ_VERSION_CRITICALITY',
    'REQ_VERSION_CATEGORY',
    'REQ_VERSION_STATUS',
    'REQ_VERSION_DESCRIPTION',
    'REQ_VERSION_CREATED_ON',
    'REQ_VERSION_CREATED_BY',
    'REQ_VERSION_MILESTONE',
    'REQ_VERSION_CUF_<code du cuf>',
]

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
                    (record.typeJira == 'Récit' ? 'STORY' : 'BUG')
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
    return 'Fichier créée'
}

function writeOnSquash(
    sprintName,
    squashFileName,
    headerSize,
    footerSize,
    sourceFilePath
) {
    const dataParser = {
        sourceFile: sourceFilePath,
        header: {
            // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
            rows: headerSize, // 2, 3, 4, etc.
        },
        columnToKey: {
            A: 'idJira',
            B: 'nameJira',
            C: 'typeJira',
        },
        sheets: ['general_report'],
    }

    var result = excelToJson(dataParser)

    result = result.general_report
    return writeOnExcel(sprintName, squashFileName, footerSize, result)
}

function writeOnSquashAPI(sprintName, squashFileName, dataAPI) {
    return writeOnExcel(sprintName, squashFileName, 0, dataAPI)
}

function fromFile(req) {
    return new Promise((resolve, reject) => {
        req.body = helper.checkInput(req.body)
        helper
            .saveSourceFile(req.files)
            .then((sourcePath) => {
                writeOnSquash(
                    req.body.inputSprint,
                    req.body.inputSquash,
                    req.body.inputHeader,
                    req.body.inputFooter,
                    sourcePath
                )
                helper.removeTmpFile(sourcePath)
                setTimeout(() => {
                    resolve(req.body.inputSquash)
                }, 1000)
            })
            .catch((err) => reject('error : ' + err))
    })
}

function fromAPI(req) {
    return new Promise((resolve) => {
        var sourceName = req.body.inputSquash
        var jira = new Jira(
            new Proxy(req.body.inputSessionTokenJira).getProxy()
        )
        var squash = new Squash(
            new Proxy(req.body.inputSessionTokenSquash).getProxy()
        )
        if (
            req.body.inputSprintJira !== undefined &&
            req.body.inputSprintJira !== ''
        ) {
            jira.getSprintID(req.body.inputSprintJira)
                .then((res) => {
                    req.body.inputJiraSprintRequest = res
                    excuteProcessFromAPI(req, jira, squash, sourceName, resolve)
                })
                .catch((err) => {
                    throw err
                })
        } else {
            excuteProcessFromAPI(req, jira, squash, sourceName, resolve)
        }
    })
}

function excuteProcessFromAPI(req, jira, squash, sourceName, resolve) {
    req.body = helper.checkInput(req.body)

    let client = new WebSocket.Client('ws://localhost:3002/')

    client.on('open', () => {
        let starter = {
            message: 'Start of the transfer from Jira to Squash.',
            percent: 1,
        }
        client.send(JSON.stringify(starter)) // !First Send
        jira.getIssues(req.body.inputJiraRequest)
            .then((dataAPI) => {
                let endJira = {
                    message: "Get all Jira ticket's.",
                    percent: 30,
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
                var query = {}
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
                resolve({
                    from: req.body.validator,
                    fileName: undefined,
                    message: 'KO : le transfert a échoué.',
                    moreInfo: err,
                })
            })
    })

    client.on('message', function (message) {
        console.info("Data from WebSocketServer '" + message.data + "'")
    })

    client.on('close', function (message) {
        console.info('Connection closed!', message.code, message.reason)

        client = null
    })
}

function test() {
    var proxyJira = new Proxy('5F0E02606324FE087C862CF040B914B3')
    var proxySquash = new Proxy('F696939B49AD3630BE446FD46A871705')
    var jira = new Jira(proxyJira.getProxy())
    var squash = new Squash(proxySquash.getProxy())
    jira.getIssues(
        'project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC'
    )
        .then((res) => {
            return squash.importInSquashWithAPI(res, 999)
        })
        .then((squashReturn) => console.info(squashReturn))
        .catch((err) => console.error(err))
}

function backup(req) {
    // TODO jira OK --> SQUASH call API TODO
    return new Promise((resolve) => {
        var proxyJira = new Proxy(req.body.tokenSessionJira)
        var jira = new Jira(proxyJira.getProxy())
        //var proxySquash = new Proxy(req.body.tokenSessionSquash)
        //var squash = new Squash(proxySquash.getProxy())
        var idSprint = require('./../bdd/idSprints.json')
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
                console.info('Tickets Jira trouvés :' + concatResult.length)
                resolve(concatResult)
            })
            .catch((err) => resolve(err))
    })
}

function testSocket() {
    var client = new WebSocket.Client('ws://localhost:3002/')
    client.on('open', function () {
        console.info('Connection established!')
        client.send('In testSocket')
    })

    client.on('message', function (message) {
        console.info("Data from WebSocketServer '" + message.data + "'")
    })

    client.on('close', function (message) {
        console.info('Connection closed!', message.code, message.reason)

        client = null
    })
}

function setSquashCampagneFromJsonResult(req) {
    return new Promise((resolve, reject) => {
        let resultRobotFrameWork = require('./../bdd/statusTests.json')
        let mapping = require('./../bdd/mapping.json')
        var squash = new Squash(
            new Proxy(req.body.inputSessionTokenSquash).getProxy()
        )
        let jenkins = new Jenkins()
        jenkins
            .getOutputResultRobotFrameWork()
            .then((file) => {
                return helper.saveTmpFile(file)
            })
            .then((tmpName) => {
                return xml2js.setUpToSquashFromXmlFile(tmpName)
            })
            .then(() => {
                return squash.setSquashCampagneFromJsonResult(
                    req,
                    resultRobotFrameWork,
                    mapping
                )
            })
            .then((res) => {
                resolve(res)
            })
            .catch((err) => reject(err))
    })
}

module.exports = {
    writeOnSquash,
    writeOnSquashAPI,
    fromFile,
    fromAPI,
    test,
    testSocket,
    backup,
    setSquashCampagneFromJsonResult,
}
