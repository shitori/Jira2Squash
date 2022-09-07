const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('REQUIREMENT');
const excelToJson = require('convert-excel-to-json');

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
        jira.getIssues(req.body.inputJiraRequest)
            .then(dataAPI => {
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
                resolve(query)
            }).catch(err => {
                resolve({
                    "from": req.body.validator,
                    "fileName": undefined,
                    "message": "KO : le transfert a échoué.",
                    "moreInfo": err
                })
            })
    })
}

function test() {
    var proxyJira = new Proxy("F1A0B124ED6981EE8C5C02CDEEBCD9F8")
    var proxySquash = new Proxy("98F1437FF881DE01A32D7981F355A44E")
    var jira = new Jira(proxyJira.getProxy())
    var squash = new Squash(proxySquash.getProxy())
    jira.getIssues("project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC")
        .then(res => {
            return squash.importInSquashWithAPI(res, 999)
        })
        .then(squashReturn => console.info(squashReturn))
        .catch(err => console.error(err))
}



module.exports = { writeOnSquash, writeOnSquashAPI, fromFile, fromAPI, test }