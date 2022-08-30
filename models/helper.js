var fs = require('fs')

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function saveSourceFile(files) {
    return new Promise((resolve, reject) => {
        if (!files) {
            console.log("File was not found");
            reject("No file");
        }
        var file = files.formFile;
        console.log(file);
        var tmpName = 'upload/tmp' + getRandomInt(100) + '.xlsx'
        fs.writeFile(tmpName, file.data, (err) => {
            if (err) {
                console.log("KO" + err);
                reject(err);
            } else {
                console.log("OK, fichier créer");
                resolve(tmpName);
            }
        })
    })
}

function saveSourceFileBis(files) {
    var tmpName = 'tmp' + getRandomInt(100) + '.xlsx'
    if (!files) {
        console.log("File was not found");
        return "No file";
    }
    var file = files.formFile;
    fs.writeFile(tmpName, file.data, (err) => {
        if (err) {
            console.log("KO" + err);
            return err;
        } else {
            console.log("OK, fichier créer");
            return tmpName;
        }
    })
}

function checkInput(body) {
    body.inputWB = !(body.inputWB === undefined)
    body.inputSprint = setEmptyField(body.inputSprint, 'undefined')
    body.inputSquash = 'upload/' + setEmptyField(body.inputSquash, 'dataForSquash') + '.xls'
    body.inputHeader = setEmptyField(body.inputHeader, 4)
    body.inputFooter = setEmptyField(body.inputFooter, 1)
    body.inputJiraRequest = ((body.inputJiraSprintRequest !== undefined && body.inputJiraSprintRequest !== '') ? "project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = " + body.inputJiraSprintRequest + " ORDER BY priority DESC, updated DESC" : body.inputJiraRequest)

    return body
}

function setEmptyField(field, defaultValue) {
    return (field == '' ? defaultValue : field)
}

function removeTmpFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err)
        } else {
            console.log(filePath + " supprimé")
        }
        return
    })
}

function convertJiraType(jiraType) {
    switch (jiraType) {
        case "Anomalie":
            return "BUG";
        case "Récit":
            return "STORY";
        case "Amélioration":
            return "ENHANCEMENT";
        default:
            return "";
    }
}

module.exports = { checkInput, saveSourceFile, saveSourceFileBis, removeTmpFile, convertJiraType }