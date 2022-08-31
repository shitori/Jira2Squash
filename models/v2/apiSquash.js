const axios = require('axios');
const dotenv = require('dotenv');
const helper = require('../helper')
dotenv.config();
const baseURL = process.env.SQUASH_BASE_URL



class apiSquash {

    constructor(proxy) {
        this.proxy = proxy
    }

    create(objectName, data) {
        return new Promise((resolve, reject) => {
            axios.post(baseURL + objectName, data, this.proxy)
                .then(res => {
                    resolve(res.data)
                }).catch(error => {
                    reject(error.data)
                });
        })
    }

    createRequirement(idFolderParent, record) {
        let data = {
            "_type": "requirement",
            "current_version": {
                "_type": "requirement-version",
                "name": record.nameJira.replaceAll('/', '\\'),
                "reference": record.idJira,
                "criticality": "MINOR",
                "category": {
                    "code": "REQ_JIRA_BUILD_" + helper.convertJiraType(record.typeJira)
                },
                "status": "UNDER_REVIEW",
                "description": '<p><a href="https://jira-build.orangeapplicationsforbusiness.com/browse/' + record.idJira + '" target="_blank">Lien vers le ticket JIRA</a></p>',

            },
            "parent": {
                "_type": "requirement-folder",
                "id": idFolderParent
            }
        }
        return new Promise((resolve, reject) => {
            this.create("requirements", data)
                .then(success => resolve(record.nameJira + " - ID nouvelle exigence : " + success.id))
                .catch(err => reject(err))
        })

    }

    createRequirementIfNecessary(idFolder, dataFolder, record, nameFolder) {
        return new Promise((resolve, reject) => {
            var folderEmpty = dataFolder._embedded == undefined;
            var exigenceAlreadyExist = undefined;
            if (folderEmpty) {
                console.info("Répertoire " + nameFolder + " vide");
                this.createRequirement(idFolder, record).then(res => resolve({ "message": res, "result": 1 })).catch(err => reject(err))
            } else {
                var exigenceAlreadyExist = dataFolder._embedded.content.find(el => el.name == record.nameJira.replaceAll('/', '\\'))
                if (exigenceAlreadyExist == undefined) {
                    this.createRequirement(idFolder, record).then(res => resolve({ "message": res, "result": 1 })).catch(err => reject(err))
                } else {
                    resolve({ "message": record.nameJira + " - L'exigence " + nameFolder + " existe déjà", "result": 0 })
                }
            }
        })

    }


    createRequirements(idB, idWB, result) {
        return new Promise((resolve, reject) => {
            var promises = [this.getContents("requirement-folders", idB), this.getContents("requirement-folders", idWB)]
            Promise.all(promises)
                .then(responses => {
                    var resWallboard = responses[1]
                    var resBandeau = responses[0]
                    result.forEach((record, index, array) => {
                        if (record.nameJira.toLowerCase().includes("wallboard")) {
                            result[index] = this.createRequirementIfNecessary(idWB, resWallboard, record, "WallBoard")
                        } else {
                            result[index] = this.createRequirementIfNecessary(idB, resBandeau, record, "Bandeau")
                        }
                    })
                    Promise.all(result).then(resultResponses => {
                        var totalCreate = 0;
                        var status = ""
                        resultResponses.forEach(el => { totalCreate += el.result; status += el.message + "\n" })
                        resolve({ "message": totalCreate + " exigence(s) créée sur " + result.length, "moreInfo": status })
                    }).catch(err => reject(err))

                }).catch(err => reject(err))
        })
    }

    createFolderIfNecessary(isWB, sprint) {
        let folderName = (isWB ? "WB - " : "G2R2 - ") + "Sprint " + sprint
        return new Promise((resolve, reject) => {
            this.findIDByName("requirement-folders", folderName)
                .then(id => {
                    console.info(id == undefined ? "dossier " + folderName + " à créer" : "dossier " + folderName + " à ne pas créer")
                    if (id === undefined) {
                        let folderParentName = (isWB ? "New Wallboard" : "[NextGen]Nouveaux Bandeaux")
                        this.findIDByName("requirement-folders", folderParentName)
                            .then(idParent => {
                                console.info("folderParentID : " + idParent)
                                let dataFolder = {
                                    "_type": "requirement-folder",
                                    "name": (isWB ? "WB - " : "G2R2 - ") + "Sprint " + sprint,
                                    "parent": {
                                        "_type": "requirement-folder",
                                        "id": idParent
                                    }
                                }
                                this.create("requirement-folders", dataFolder)
                                    .then(res => {
                                        let idNewFolder = res.id
                                        resolve(idNewFolder)
                                    }).catch(err => reject(err))
                            })
                    } else {
                        resolve(id)
                    }
                }).catch(err => reject(err))
        })

    }

    getContents(objectType, idObject) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + "/" + idObject + "/content?page=0&size=200000"
            axios.get(currentURL, this.proxy)
                .then(res => {
                    if (res.data._embedded) {
                        console.info(res.data._embedded.content)
                    }
                    resolve(res.data)
                }).catch(err => {
                    reject(err)
                })
        })
    }

    findByName(objectType, name) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + "?page=0&size=200000"
            axios.get(currentURL, this.proxy)
                .then(res => {
                    console.info(res.status == 200 ? "Objet " + name + " trouvé" : "Objet " + name + " non trouvé");
                    let objects = res.data._embedded[objectType]
                    let searchObject = objects.find(object => object.name === name)
                    console.info(searchObject);
                    resolve(searchObject)
                }).catch(error => {
                    reject(error)
                });
        })
    }

    findIDByName(objectType, name) {
        return this.findSomethingByName(objectType, name, "id")
    }

    findSomethingByName(objectType, name, field) {
        return new Promise((resolve, reject) => {
            this.findByName(objectType, name)
                .then(res => {
                    if (res === undefined) {
                        resolve(undefined)
                    } else {
                        resolve(res[field])
                    }
                }).catch(err => reject(err))
        })
    }

    importInSquashWithAPI(result, sprint) {
        return new Promise((resolve, reject) => {
            var promesse = [this.createFolderIfNecessary(true, sprint), this.createFolderIfNecessary(false, sprint)]
            Promise.all(promesse).then(responses => {
                this.createRequirements(responses[1], responses[0], result).then(res => resolve(res)).catch(err => reject(err))
            })
        })
    }
}

module.exports = apiSquash