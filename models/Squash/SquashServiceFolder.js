const SquashServiceGetter = require('./SquashServiceGetter')
const SquashServiceSetter = require('./SquashServiceSetter')

const dotenv = require('dotenv')
dotenv.config()

const wallboardAcronymeSprint = 'WB - '
const wallboardFolderParentName = 'New Wallboard'

const bandeauAcronymeSprint = 'G2R2 - '
const bandeauFolderParentName = '[NextGen]Nouveaux Bandeaux'

class SquashServiceFolder {
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

    createFolderIfNecessary(isWB, sprint) {
        let folderName =
            (isWB ? wallboardAcronymeSprint : bandeauAcronymeSprint) +
            'Sprint ' +
            sprint
        return new Promise((resolve, reject) => {
            this.getter
                .findIDByName('requirement-folders', folderName)
                .then((id) => {
                    console.info(
                        id == undefined
                            ? 'dossier ' + folderName + ' à créer'
                            : 'dossier ' + folderName + ' à ne pas créer'
                    )
                    if (id === undefined) {
                        let folderParentName = isWB
                            ? wallboardFolderParentName
                            : bandeauFolderParentName
                        return this.getter.findIDByName(
                            'requirement-folders',
                            folderParentName
                        )
                    } else {
                        resolve(id)
                    }
                })
                .then((idParent) => {
                    console.info('folderParentID : ' + idParent)
                    let dataFolder = {
                        _type: 'requirement-folder',
                        name: folderName,
                        parent: {
                            _type: 'requirement-folder',
                            id: idParent,
                        },
                    }
                    return this.setter.create('requirement-folders', dataFolder)
                })
                .then((res) => {
                    let idNewFolder = res.id
                    resolve(idNewFolder)
                })
                .catch((err) => reject(err))
        })
    }
}

module.exports = SquashServiceFolder
