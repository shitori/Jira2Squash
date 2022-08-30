const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('REQUIREMENT');
const excelToJson = require('convert-excel-to-json');
var fs = require('fs')

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
    writeOnExcel(sprintName, squashFileName, footerSize, result)
    console.info("Fichier créer");
}

function writeOnSquashAPI(sprintName, squashFileName, dataAPI) {

    writeOnExcel(sprintName, squashFileName, 0, dataAPI)
    console.info("Fichier créer");
}

module.exports = { writeOnSquash, writeOnSquashAPI }