var fs = require('fs')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function saveJsonTmpFile(fileName, jsonString) {
    return new Promise((resolve, reject) => {
        let tmpName = 'tmp/' + fileName + '.json'
        fs.writeFile(tmpName, jsonString, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(tmpName)
            }
        })
    })
}

function saveTmpFile(file) {
    return new Promise((resolve, reject) => {
        let tmpName = 'tmp/rfResult.xml'
        fs.writeFile(tmpName, file.data, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(tmpName)
            }
        })
    })
}

function saveSourceFile(files) {
    return new Promise((resolve, reject) => {
        if (!files) {
            reject('No file')
        }
        var file = files.formFile
        var tmpName = 'upload/tmp' + getRandomInt(100) + '.xlsx'
        fs.writeFile(tmpName, file.data, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(tmpName)
            }
        })
    })
}

function saveSourceFileBis(files) {
    var tmpName = 'tmp' + getRandomInt(100) + '.xlsx'
    if (!files) {
        return 'No file'
    }
    var file = files.formFile
    fs.writeFile(tmpName, file.data, (err) => {
        if (err) {
            return err
        } else {
            return tmpName
        }
    })
}

function checkInput(body) {
    body.inputWB = !(body.inputWB === undefined)
    body.inputSprint = setEmptyField(body.inputSprint, 'undefined')
    body.inputSquash =
        'upload/' + setEmptyField(body.inputSquash, 'dataForSquash') + '.xls'
    body.inputHeader = setEmptyField(body.inputHeader, 4)
    body.inputFooter = setEmptyField(body.inputFooter, 1)
    body.inputJiraRequest =
        body.inputJiraSprintRequest !== undefined &&
        body.inputJiraSprintRequest !== ''
            ? 'project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = ' +
              body.inputJiraSprintRequest +
              ' ORDER BY priority DESC, updated DESC'
            : body.inputJiraRequest

    return body
}

function setEmptyField(field, defaultValue) {
    return field == '' ? defaultValue : field
}

function removeTmpFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw err
        } else {
            return filePath + ' supprimé'
        }
    })
}

function convertJiraType(jiraType) {
    switch (jiraType) {
        case 'Anomalie':
            return 'BUG'
        case 'Récit':
            return 'STORY'
        case 'Amélioration':
            return 'ENHANCEMENT'
        default:
            return ''
    }
}

function wordPower(list) {
    // incremente +1 par mot
    let wp = []
    list.forEach((str) => {
        str.split(' ').forEach((word) => {
            word = removeUselessChar(word)
            let wordIsPresent = false
            wp.forEach((el) => {
                if (el.word == word) {
                    wordIsPresent = true
                    el.occurence++
                }
            })
            if (!wordIsPresent) {
                wp.push({ word: removeUselessChar(word), occurence: 1 })
            }
        })
    })
    return wp
}

function removeUselessChar(word) {
    return word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
}

function getOnlyNameFromObject(list) {
    let names = []
    list.forEach((el) => {
        names.push(el.name)
    })
    return names
}

module.exports = {
    checkInput,
    saveSourceFile,
    saveSourceFileBis,
    removeTmpFile,
    convertJiraType,
    getRandomInt,
    wordPower,
    getOnlyNameFromObject,
    removeUselessChar,
    saveTmpFile,
    saveJsonTmpFile,
}
