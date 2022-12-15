const dHelper = require('../helper/defaultHelper')

const SquashServiceGetter = require('./SquashServiceGetter')
const SquashServiceSetter = require('./SquashServiceSetter')

const dotenv = require('dotenv')
dotenv.config()

const guiJiraURL = process.env.JIRA_GUI_URL

const wallboardFolderFileName = 'WallBoard'

const bandeauFolderFileName = 'Bandeau'

const DELAY_VALUE = 2000

class SquashService {
    constructor(proxy, client) {
        this.getter = new SquashServiceGetter(proxy)
        this.setter = new SquashServiceSetter(proxy, client)
    }

    _setProgressBarRequirement(max) {
        this.setter._setProgressBarRequirement(max)
    }

    _setProgressBarFolder(max) {
        this.setter._setProgressBarFolder(max)
    }

    _setProgressBarStatus(max) {
        this.setter._setProgressBarStatus(max)
    }

    createRequirement(idFolderParent, record) {
        let data = {
            _type: 'requirement',
            current_version: {
                _type: 'requirement-version',
                name: record.nameJira.replaceAll('/', '\\'),
                reference: record.idJira,
                criticality: 'MINOR',
                category: {
                    code:
                        'CAT_JIRA_' + dHelper.convertJiraType(record.typeJira),
                },
                status: 'UNDER_REVIEW',
                description:
                    '<p><a href="' +
                    guiJiraURL +
                    record.idJira +
                    '" target="_blank">Lien vers le ticket JIRA</a></p>',
            },
            parent: {
                _type: 'requirement-folder',
                id: idFolderParent,
            },
        }

        return new Promise((resolve, reject) => {
            this.setter
                .create('requirements', data)
                .then((success) => {
                    resolve(
                        'ID nouvelle exigence : ' +
                            success.id +
                            ' - ' +
                            record.nameJira
                    )
                })
                .catch((err) => {
                    reject({ message: 'error in createRequirement', err })
                })
        })
    }

    createRequirementIfNecessary(idFolder, dataFolder, record, nameFolder) {
        return new Promise((resolve, reject) => {
            var folderEmpty = dataFolder._embedded == undefined
            if (folderEmpty) {
                console.info('Répertoire ' + nameFolder + ' vide')
                this.createRequirement(idFolder, record)
                    .then((res) => resolve({ message: res, result: 1 }))
                    .catch((err) =>
                        reject({
                            message: 'error in createRequirementIfNecessary',
                            err,
                        })
                    )
            } else {
                var exigenceAlreadyExist = dataFolder._embedded.content.find(
                    (el) => el.name == record.nameJira.replaceAll('/', '\\')
                )
                if (exigenceAlreadyExist == undefined) {
                    this.createRequirement(idFolder, record)
                        .then((res) => resolve({ message: res, result: 1 }))
                        .catch((err) =>
                            reject({
                                message:
                                    'error in createRequirementIfNecessary',
                                err,
                            })
                        )
                } else {
                    resolve({
                        message:
                            "L'exigence " +
                            nameFolder +
                            ' existe déjà - ' +
                            record.nameJira,
                        result: 0,
                    })
                }
            }
        })
    }

    createRequirements(idB, idWB, result) {
        return new Promise((resolve, reject) => {
            var promises = [
                this.getter.getContents('requirement-folders', idB),
                this.getter.getContents('requirement-folders', idWB),
            ]
            this.delay = 0
            Promise.all(promises)
                .then((responses) => {
                    var resWallboard = responses[1]
                    var resBandeau = responses[0]
                    result.forEach((record, index) => {
                        if (
                            record.nameJira.toLowerCase().includes('wallboard')
                        ) {
                            result[index] = new Promise((resolve) =>
                                setTimeout(resolve, this.delay)
                            ).then(() =>
                                this.createRequirementIfNecessary(
                                    idWB,
                                    resWallboard,
                                    record,
                                    wallboardFolderFileName
                                )
                            )
                            this.delay += DELAY_VALUE
                        } else {
                            result[index] = new Promise((resolve) =>
                                setTimeout(resolve, this.delay)
                            ).then(() =>
                                this.createRequirementIfNecessary(
                                    idB,
                                    resBandeau,
                                    record,
                                    bandeauFolderFileName
                                )
                            )
                            this.delay += DELAY_VALUE
                        }
                    })
                    return Promise.all(result)
                })
                .then((resultResponses) => {
                    var totalCreate = 0
                    var status = ''
                    resultResponses.forEach((el) => {
                        totalCreate += el.result
                        status += el.message + '\n'
                    })
                    resolve({
                        message:
                            totalCreate +
                            ' exigence(s) créée sur ' +
                            result.length,
                        moreInfo: status,
                    })
                })
                .catch((err) =>
                    reject({ message: 'error in createRequirements', err })
                )
        })
    }
}

module.exports = SquashService
