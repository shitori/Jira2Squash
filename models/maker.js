const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('REQUIREMENT');
const excelToJson = require('convert-excel-to-json');
var WebSocket = require('faye-websocket');

var xml2js = require('./rf2squash/maker')

var helper = require('../models/helper')

//v2
const Jira = require("../models/v2/apiJira")
const Proxy = require("../models/v2/proxy")
const Squash = require("../models/v2/apiSquash")

const dotenv = require('dotenv');

dotenv.config();

const headingColumnNames = [
    "ACTION",
    "REQ_PATH",
    "REQ_VERSION_NUM",
    "REQ_VERSION_REFERENCE",
    "REQ_VERSION_NAME",
    "REQ_VERSION_CRITICALITY",
    "REQ_VERSION_CATEGORY",
    "REQ_VERSION_STATUS",
    "REQ_VERSION_DESCRIPTION",
    "REQ_VERSION_CREATED_ON",
    "REQ_VERSION_CREATED_BY",
    "REQ_VERSION_MILESTONE",
    "REQ_VERSION_CUF_<code du cuf>"
]

function writeOnExcel(sprintName, squashFileName, footerSize, result) {
    //Write Column Title in Excel file
    let headingColumnIndex = 1;
    headingColumnNames.forEach(heading => {
        ws.cell(1, headingColumnIndex++)
            .string(heading)
    });

    //Write Data in Excel file
    let rowIndex = 2;
    result.forEach((record, index, array) => {
        if (index < array.length - footerSize) { //IGNORE FOOTER
            let columnIndex = 1;
            ws.cell(rowIndex, columnIndex++).string("C"); // Action
            ws.cell(rowIndex, columnIndex++).string("/fcc-next-gen/" + (record.nameJira.toLowerCase().includes("wallboard") ? "New Wallboard/WB - " : "[NextGen]Nouveaux Bandeaux/G2R2 - ") + "Sprint " + sprintName + "/" + record.nameJira.replaceAll('/', '\\')); // REQ PATH
            ws.cell(rowIndex, columnIndex++).number(1); // REQ VERSION NUM
            ws.cell(rowIndex, columnIndex++).string(record.idJira);// REQ VERSION REFERENCE
            columnIndex++ // REQ VERSION NAME
            ws.cell(rowIndex, columnIndex++).string("MINOR"); // REQ VERSION CRITICALITY
            ws.cell(rowIndex, columnIndex++).string("REQ_JIRA_BUILD_" + (record.typeJira == "Récit" ? "STORY" : "BUG")); // REQ VERSION CATEGORY
            ws.cell(rowIndex, columnIndex++).string("UNDER_REVIEW"); // REQ VERSION STATUS
            ws.cell(rowIndex, columnIndex++).string('<p><a href="https://jira-build.orangeapplicationsforbusiness.com/browse/' + record.idJira + '" target="_blank">Lien vers le ticket JIRA</a></p>'); // REQ VERSION DESCRIPTION

            rowIndex++;
        }

    });

    wb.write(squashFileName);
    return "Fichier créée"
}



function writeOnSquash(sprintName, squashFileName, headerSize, footerSize, sourceFilePath) {
    const dataParser = {
        sourceFile: sourceFilePath,
        header: {
            // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
            rows: headerSize // 2, 3, 4, etc.
        },
        columnToKey: {
            A: "idJira",
            B: "nameJira",
            C: "typeJira",
        },
        sheets: ['general_report'],
    }

    var result = excelToJson(dataParser);

    result = result.general_report
    return writeOnExcel(sprintName, squashFileName, footerSize, result)

}

function writeOnSquashAPI(sprintName, squashFileName, dataAPI) {

    return writeOnExcel(sprintName, squashFileName, 0, dataAPI)

}

function fromFile(req) {
    return new Promise((resolve, reject) => {
        req.body = helper.checkInput(req.body)
        helper.saveSourceFile(req.files)
            .then(sourcePath => {
                writeOnSquash(req.body.inputSprint, req.body.inputSquash, req.body.inputHeader, req.body.inputFooter, sourcePath)
                helper.removeTmpFile(sourcePath)
                setTimeout(() => {
                    resolve(req.body.inputSquash)
                }, 1000);
            })
            .catch(err => reject("error : " + err))
    })
}

function fromAPI(req) {
    return new Promise(resolve => {
        var sourceName = req.body.inputSquash
        req.body = helper.checkInput(req.body)
        var jira = new Jira(new Proxy(req.body.inputSessionTokenJira).getProxy())
        var squash = new Squash(new Proxy(req.body.inputSessionTokenSquash).getProxy())
        let client = new WebSocket.Client('ws://localhost:3002/');

        client.on('open', function (message) {
            let starter = {
                message: "Start of the transfer from Jira to Squash.",
                percent: 1
            }
            client.send(JSON.stringify(starter)) // !First Send
            jira.getIssues(req.body.inputJiraRequest)
                .then(dataAPI => {
                    let endJira = {
                        message: "Get all Jira ticket's.",
                        percent: 30
                    }
                    client.send(JSON.stringify(endJira)) // !Second Send
                    switch (req.body.validator) {
                        case 'file':
                            return writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI)
                        case 'api':
                            return squash.importInSquashWithAPI(dataAPI, req.body.inputSprint)
                        default:
                            return {
                                fileResult: writeOnSquashAPI(req.body.inputSprint, req.body.inputSquash, dataAPI),
                                apiResult: squash.importInSquashWithAPI(dataAPI, req.body.inputSprint)
                            }
                    }
                }).then(finalResult => {
                    var query = {}
                    switch (req.body.validator) {
                        case 'file':
                            query = {
                                "from": req.body.validator,
                                "fileName": sourceName,
                                "message": "OK : " + finalResult,
                                "moreInfo": undefined
                            }
                            break;
                        case 'api':
                            query = {
                                "from": req.body.validator,
                                "fileName": undefined,
                                "message": "OK : " + finalResult.message,
                                "moreInfo": finalResult.moreInfo
                            }
                            break;
                        default:
                            query = {
                                "from": "other",
                                "fileName": sourceName,
                                "message": "OK : " + finalResult.apiResult.message + " / " + finalResult.fileResult,
                                "moreInfo": finalResult.apiResult.moreInfo,
                            }
                            break;
                    }
                    client.close()
                    resolve(query)
                }).catch(err => {
                    console.error("err:" + err);
                    client.close()
                    resolve({
                        "from": req.body.validator,
                        "fileName": undefined,
                        "message": "KO : le transfert a échoué.",
                        "moreInfo": err
                    })
                })
        });

        client.on('message', function (message) {
            console.log("Data from WebSocketServer '" + message.data + "'");
        });

        client.on('close', function (message) {
            console.log('Connection closed!', message.code, message.reason);

            client = null;
        });


    })
}

function test() {
    var proxyJira = new Proxy("5F0E02606324FE087C862CF040B914B3")
    var proxySquash = new Proxy("F696939B49AD3630BE446FD46A871705")
    var jira = new Jira(proxyJira.getProxy())
    var squash = new Squash(proxySquash.getProxy())
    jira.getIssues("project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC")
        .then(res => {
            return squash.importInSquashWithAPI(res, 999)
        })
        .then(squashReturn => console.info(squashReturn))
        .catch(err => console.error(err))
}

function backup(req) {
    // TODO jira OK --> SQUASH call API TODO
    return new Promise(resolve => {
        var proxyJira = new Proxy(req.body.tokenSessionJira)
        var proxySquash = new Proxy(req.body.tokenSessionSquash)
        var jira = new Jira(proxyJira.getProxy())
        var squash = new Squash(proxySquash.getProxy())
        var idSprint = require("./../bdd/idSprints.json")
        let promises = []
        Object.entries(idSprint).forEach(el => {
            //console.log(el);
            let key = el[0]
            let value = el[1]
            if (value != "") {
                promises.push(jira.getIssues("project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = " + value + " ORDER BY priority DESC, updated DESC"))
            }
        })
        Promise.all(promises)
            .then(results => {
                let concatResult = []
                results.forEach(result => {
                    concatResult = concatResult.concat(result)
                })
                console.log("Tickets Jira trouvés :" + concatResult.length);
                resolve(concatResult)
            }).catch(err => resolve(err))

    })

}

function testSocket() {
    var client = new WebSocket.Client('ws://localhost:3002/');
    client.on('open', function (message) {
        console.log('Connection established!');
        client.send("In testSocket")
    });


    client.on('message', function (message) {
        console.log("Data from WebSocketServer '" + message.data + "'");
    });

    client.on('close', function (message) {
        console.log('Connection closed!', message.code, message.reason);

        client = null;
    });
}

function setSquashCampagneFromJsonResult(req) {
    //console.log(req);
    return new Promise((resolve, reject) => {
        var squash = new Squash(new Proxy(req.body.inputSessionTokenSquash).getProxy())
        squash.getContents("campaign-folders", 9466) //? https://test-management.orangeapplicationsforbusiness.com/squash/campaign-workspace/campaign-folder/9466/content
            .then(res => {
                let findFolder = req.body.inputSprint == '' ? 'Sprint Robot FrameWork' : "Sprint " + req.inputSprint
                let folder = res._embedded.content.find(cf => cf.name === findFolder)
                console.log("Sprint folder finded");
                return squash.getContents("campaign-folders", folder.id)
            }).then(res => {
                let folder = res._embedded.content.find(cf => cf.name === "PLTF V7")
                return squash.getObject("campaigns", folder.id)
            }).then(res => {
                let hardP0 = res.iterations.find(iteration => iteration.name === "FCC Web Hardphone - P0")
                let hardP1 = res.iterations.find(iteration => iteration.name === "FCC Web Hardphone - P1")
                let soft = res.iterations.find(iteration => iteration.name === "FCC Web Softphone")
                let promises = [squash.getObject("iterations", hardP0.id), squash.getObject("iterations", hardP1.id), squash.getObject("iterations", soft.id)]
                console.log("3 Tests folders finded")
                return Promise.all(promises)
            }).then(responses => {
                let res = []
                responses.forEach(response => {
                    //console.log(response.test_suites);
                    res = res.concat(response.test_suites)
                })
                let promises = []
                res.forEach(tests => {
                    promises.push(squash.getObject("test-suites", tests.id))
                })
                console.log("Tests suites concated")
                return Promise.all(promises)
            }).then(responses => {
                let res = []
                responses.forEach(response => {
                    res = res.concat(response.test_plan)
                })
                let shortRes = []
                res.forEach(el => {
                    shortRes.push({
                        "id": el.id, "status": el.execution_status,
                        "type": el._type,
                        "refTestName": el.referenced_test_case.name,
                        "refTestId": el.referenced_test_case.id
                    })
                })

                helper.saveJsonTmpFile("shortResultJson", JSON.stringify(shortRes, null, 4))
                helper.saveJsonTmpFile("resultJson", JSON.stringify(res, null, 4))


                let resultRobotFrameWork = require('./../bdd/statusTests.json')
                let mapping = require('./../bdd/mapping.json')

                let changeStatusList = []

                shortRes.forEach(el => {
                    Object.entries(mapping).forEach(kv => {
                        let key = kv[0]
                        let value = kv[1]
                        if (value.includes(el.refTestId)) {
                            let findedResultRobotFrameWork = resultRobotFrameWork.find(rrb => rrb.name === key)
                            //console.log(findedResultRobotFrameWork)
                            if (findedResultRobotFrameWork !== undefined && findedResultRobotFrameWork.status == "OK") {
                                console.log(el.refTestName + " ajouté");
                                changeStatusList.push(squash.changeStatus(el.id, "SUCCESS"))
                            }
                        }
                    })

                })
                console.log(changeStatusList.length + " tests will be changed ! ");
                return Promise.all(changeStatusList)
            }).then(responses => {
                //responses.forEach(response => console.log({}))
                console.log("Mise à jour terminé");
                resolve(responses)
            }).catch(err => reject(err))
    })


}



module.exports = { writeOnSquash, writeOnSquashAPI, fromFile, fromAPI, test, testSocket, backup, setSquashCampagneFromJsonResult }