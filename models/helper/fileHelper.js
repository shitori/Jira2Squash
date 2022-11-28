var fs = require('fs')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function readJsonFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName))
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
    saveJsonTmpFile,
    readJsonFile,
}
