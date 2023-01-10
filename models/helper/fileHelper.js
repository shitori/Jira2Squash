const fs = require('fs')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function readFile(fileName) {
    return fs.readFileSync(fileName)
}

function readJsonFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName))
}

function saveJsonBackUp(fileName, jsonString) {
    return new Promise((resolve, reject) => {
        let backupName = 'backup/' + fileName + '.json'
        fs.writeFile(backupName, jsonString, (err) => {
            if (err) {
                reject(err)
            } else {
                console.info('backup file ' + backupName + ' saved')
                resolve(backupName)
            }
        })
    })
}

function saveJsonTmpFile(fileName, jsonString) {
    return new Promise((resolve, reject) => {
        let tmpName = 'tmp/' + fileName + '.json'
        fs.writeFile(tmpName, jsonString, (err) => {
            if (err) {
                reject(err)
            } else {
                console.info('tmp file ' + tmpName + ' saved')
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

function saveHtmlFile(file) {
    return new Promise((resolve, reject) => {
        let tmpName = 'tmp/rfResult.html'
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
        let file = files.formFile
        let tmpName = 'upload/tmp' + getRandomInt(100) + '.xlsx'
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
    let tmpName = 'tmp' + getRandomInt(100) + '.xlsx'
    if (!files) {
        return 'No file'
    }
    let file = files.formFile
    fs.writeFile(tmpName, file.data, (err) => {
        if (err) {
            return err
        } else {
            return tmpName
        }
    })
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

module.exports = {
    saveSourceFile,
    saveSourceFileBis,
    removeTmpFile,
    saveTmpFile,
    saveHtmlFile,
    saveJsonTmpFile,
    readJsonFile,
    readFile,
    saveJsonBackUp,
}
