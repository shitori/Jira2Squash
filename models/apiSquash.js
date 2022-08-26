const axios = require('axios');
const proxy = require('./proxy')
const dotenv = require('dotenv');
const { json } = require('body-parser');
dotenv.config();
const baseURL = process.env.SQUASH_BASE_URL


function modify(objectName, data, jSessionID) {
    proxy.setJSessionID(jSessionID)
    return new Promise((resolve, reject) => {
        axios.patch(baseURL + objectName, data, proxy.infoCO)
            .then(res => {
                console.log(`statusCode: ${res.status}`);
                console.log(res.data);
                resolve("OK")
            }).catch(error => {
                console.error("erreur !!!");
                console.error(error);
                reject("KO")
            });
    })
}

function create(objectName, data, jSessionID) {
    proxy.setJSessionID(jSessionID)
    return new Promise((resolve, reject) => {
        axios.post(baseURL + objectName, data, proxy.infoCO)
            .then(res => {
                resolve(res.data)
            }).catch(error => {
                reject(error.data)
            });
    })
}

function getContents(objectType, idObject, jSessionID) {
    proxy.setJSessionID(jSessionID)
    return new Promise((resolve, reject) => {
        let currentURL = baseURL + objectType + "/" + idObject + "/content?page=0&size=200000"
        axios.get(currentURL, proxy.infoCO)
            .then(res => {
                if (res.data._embedded) {
                    console.log(res.data._embedded.content)
                }
                resolve(res.data)
            }).catch(err => {

                reject(err)
            })
    })
}

function findByName(objectType, name, jSessionID) {
    proxy.setJSessionID(jSessionID)
    return new Promise((resolve, reject) => {
        let currentURL = baseURL + objectType + "?page=0&size=200000"
        axios.get(currentURL, proxy.infoCO)
            .then(res => {
                console.log(res.status == 200 ? "Objet " + name + " trouvé" : "Objet " + name + " non trouvé");
                let objects = res.data._embedded[objectType]
                let searchObject = objects.find(object => object.name === name)
                console.log(searchObject);
                resolve(searchObject)
            }).catch(error => {
                console.error("erreur !!!");
                reject(error.data)
            });
    })
}

function findIDByName(objectType, name, jSessionID) {
    return findSomethingByName(objectType, name, "id", jSessionID)
}

function findSomethingByName(objectType, name, field, jSessionID) {
    return new Promise((resolve, reject) => {
        findByName(objectType, name, jSessionID)
            .then(res => {
                if (res === undefined) {
                    resolve(undefined)
                } else {
                    resolve(res[field])
                }
            }).catch(err => reject(err))
    })
}

function createRequirement(idFolderParent, record, jSessionID) {
    let data = {
        "_type": "requirement",
        "current_version": {
            "_type": "requirement-version",
            "name": record.nameJira.replaceAll('/', '\\'),
            "reference": record.idJira,
            "criticality": "MINOR",
            "category": {
                "code": "REQ_JIRA_BUILD_" + (record.typeJira == "Récit" ? "STORY" : "BUG")
            },
            "status": "UNDER_REVIEW",
            "description": '<p><a href="https://jira-build.orangeapplicationsforbusiness.com/browse/' + record.idJira + '" target="_blank">Lien vers le ticket JIRA</a></p>',

        },
        "parent": {
            "_type": "requirement-folder",
            "id": idFolderParent
        }
    }
    create("requirements", data, jSessionID)
        .then(success => console.log("ID nouvelle exigence : " + success.id))
        .catch(err => console.error(err))
}

function createRequirementIfNecessary(idFolder, dataFolder, record, nameFolder, jSessionID) {
    var folderEmpty = dataFolder._embedded == undefined;
    var exigenceAlreadyExist = undefined;
    if (folderEmpty) {
        console.log("Répertoire " + nameFolder + " vide");
        createRequirement(idFolder, record, jSessionID)
    } else {
        var exigenceAlreadyExist = dataFolder._embedded.content.find(el => el.name == record.nameJira.replaceAll('/', '\\'))
        /*console.log("exigenceAlreadyExist :");
        console.log(exigenceAlreadyExist);*/
        if (exigenceAlreadyExist == undefined) {
            createRequirement(idFolder, record, jSessionID)
        } else {
            console.log("l'exigence " + nameFolder + " existe déjà");
        }
    }
}

function createRequirements(idB, idWB, result, jSessionID) {
    console.log(result.length + " exigence(s) à créer");
    getContents("requirement-folders", idB, jSessionID)
        .then(resBandeau => {
            getContents("requirement-folders", idWB, jSessionID)
                .then(resWallboard => {
                    result.forEach(record => {
                        if (record.nameJira.toLowerCase().includes("wallboard")) {
                            createRequirementIfNecessary(idWB, resWallboard, record, "WallBoard", jSessionID)
                        } else {
                            createRequirementIfNecessary(idB, resBandeau, record, "Bandeau", jSessionID)
                        }
                    })
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))

}

function createFolderIfNecessary(jSessionID, isWB, sprint) {
    let folderName = (isWB ? "WB - " : "G2R2 - ") + "Sprint " + sprint
    return new Promise((resolve, reject) => {
        findIDByName("requirement-folders", folderName, jSessionID)
            .then(id => {
                console.log(id == undefined ? "dossier " + folderName + " à créer" : "dossier " + folderName + " à ne pas créer")
                if (id === undefined) {
                    let folderParentName = (isWB ? "New Wallboard" : "[NextGen]Nouveaux Bandeaux")
                    findIDByName("requirement-folders", folderParentName, jSessionID)
                        .then(idParent => {
                            console.log("folderParentID : " + idParent)
                            let dataFolder = {
                                "_type": "requirement-folder",
                                "name": (isWB ? "WB - " : "G2R2 - ") + "Sprint " + sprint,
                                "parent": {
                                    "_type": "requirement-folder",
                                    "id": idParent
                                }
                            }
                            create("requirement-folders", dataFolder, jSessionID)
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

function importInSquashWithAPI(result, jSessionID, sprint) {
    console.log(result);
    //var isWB =  result.nameJira.toLowerCase().includes("wallboard")
    createFolderIfNecessary(jSessionID, true, sprint)
        .then(resWB => {
            createFolderIfNecessary(jSessionID, false, sprint)
                .then(resBandeau => {
                    createRequirements(resBandeau, resWB, result, jSessionID)
                })
                .catch(err => console.log("le dossier bandeau n'existe pas : " + err))
        })
        .catch(err => console.log("le dossier wallboard n'existe pas : " + err))
}


module.exports = {
    importInSquashWithAPI
}