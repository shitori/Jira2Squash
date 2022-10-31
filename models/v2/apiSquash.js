const axios = require('axios');
const helper = require('../helper')
var WebSocket = require('faye-websocket');

const dotenv = require('dotenv');
dotenv.config();

const baseURL = process.env.SQUASH_BASE_URL
const guiJiraURL = process.env.JIRA_GUI_URL

const wallboardFolderFileName = "WallBoard"
const wallboardAcronymeSprint = "WB - "
const wallboardFolderParentName = "New Wallboard"

const bandeauFolderFileName = "Bandeau"
const bandeauAcronymeSprint = "G2R2 - "
const bandeauFolderParentName = "[NextGen]Nouveaux Bandeaux"

class apiSquash {

    constructor(proxy) {
        this.proxy = proxy
        this.forlderMax = 0
        this.folderCurrent = 0
        this.requirementMax = 0
        this.requirementCurrent = 0
        this.allTest = []
        this.allExig = []

    }

    _setProgressBarRequirement(max) {
        this.requirementMax = max;
        this.requirementCurrent = 0;
    }

    _setProgressBarFolder(max) {
        this.forlderMax = max;
        this.folderCurrent = 0;
    }

    _setClientWebsocket(client) {
        client.on('open', function (message) {
            console.log('Connection established for create!');
        });

        client.on('message', function (message) {
            console.log("Data from WebSocketServer '" + message.data + "'");
        });

        client.on('close', function (message) {
            console.log('Connection closed!', message.code, message.reason);
            client = null;
        });
    }

    _sendWSRequirementInfo(client) {
        this.requirementCurrent++;
        let requirementInfo = {
            message: "Requirements : " + this.requirementCurrent + "/" + this.requirementMax,
            percent: 50 + this.requirementCurrent * 50 / this.requirementMax
        };
        client.send(JSON.stringify(requirementInfo));
    }

    _sendWSFolderInfo(client) {
        this.folderCurrent++;
        let folderInfo = {
            message: "Folders : " + this.folderCurrent + "/" + this.forlderMax,
            percent: 30 + this.folderCurrent * 20 / this.forlderMax
        };
        client.send(JSON.stringify(folderInfo));
    }

    create(objectName, data) {
        return new Promise((resolve, reject) => {
            let client = new WebSocket.Client('ws://localhost:3002/');
            this._setClientWebsocket(client)

            axios.post(baseURL + objectName, data, this.proxy)
                .then(res => {
                    if (objectName == 'requirement-folders') {
                        this._sendWSFolderInfo(client);
                    } else if (objectName == 'requirements') {
                        this._sendWSRequirementInfo(client);
                    } else {
                        client.send("Finish for " + objectName)
                    }
                    resolve(res.data)
                }).catch(error => {
                    reject(error)
                });

        })
    }

    modify(objectName, data) {
        return new Promise((resolve, reject) => {
            axios.post(baseURL + objectName + "/" + data.id, data, this.proxy)
                .then(res => {
                    resolve(res.data)
                }).catch(error => {
                    reject(error)
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
                    "code": "CAT_JIRA_" + helper.convertJiraType(record.typeJira)
                },
                "status": "UNDER_REVIEW",
                "description": '<p><a href="' + guiJiraURL + record.idJira + '" target="_blank">Lien vers le ticket JIRA</a></p>',


            },
            "parent": {
                "_type": "requirement-folder",
                "id": idFolderParent
            }
        }

        return new Promise((resolve, reject) => {
            this.create("requirements", data)
                .then(success => {
                    resolve("ID nouvelle exigence : " + success.id + " - " + record.nameJira)
                }).catch(err => {
                    reject(err)
                })
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

                    resolve({ "message": "L'exigence " + nameFolder + " existe déjà - " + record.nameJira, "result": 0 })
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
                            result[index] = this.createRequirementIfNecessary(idWB, resWallboard, record, wallboardFolderFileName)
                        } else {
                            result[index] = this.createRequirementIfNecessary(idB, resBandeau, record, bandeauFolderFileName)
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
        let folderName = (isWB ? wallboardAcronymeSprint : bandeauAcronymeSprint) + "Sprint " + sprint
        return new Promise((resolve, reject) => {
            this.findIDByName("requirement-folders", folderName)
                .then(id => {
                    console.info(id == undefined ? "dossier " + folderName + " à créer" : "dossier " + folderName + " à ne pas créer")
                    if (id === undefined) {
                        let folderParentName = (isWB ? wallboardFolderParentName : bandeauFolderParentName)
                        return this.findIDByName("requirement-folders", folderParentName)
                    } else {
                        resolve(id)
                    }
                }).then(idParent => {
                    console.info("folderParentID : " + idParent)
                    let dataFolder = {
                        "_type": "requirement-folder",
                        "name": folderName,
                        "parent": {
                            "_type": "requirement-folder",
                            "id": idParent
                        }
                    }
                    return this.create("requirement-folders", dataFolder)
                }).then(res => {
                    let idNewFolder = res.id
                    resolve(idNewFolder)
                }).catch(err => reject(err))
        })

    }

    getContents(objectType, idObject) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + "/" + idObject + "/content?page=0&size=200000"
            axios.get(currentURL, this.proxy)
                .then(res => {
                    resolve(res.data)
                }).catch(err => {
                    reject(err)
                })
        })
    }

    getObject(objectType, idObject) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + "/" + idObject
            axios.get(currentURL, this.proxy)
                .then(res => {
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
            this._setProgressBarRequirement(result.length)
            this._setProgressBarFolder(promesse.length)
            Promise.all(promesse)
                .then(responses => {
                    this.createRequirements(responses[1], responses[0], result)
                        .then(res => resolve(res))
                        .catch(err => reject(err))
                }).catch(err => reject(err))
        })
    }

    getTestsSuiteOfIteractionP1() {
        return new Promise((resolve, reject) => {
            this.getObject("iterations", 19329) // id de l'itéraction dans squash
                .then(res => {
                    let resLite = []
                    res.test_suites.forEach(el => {
                        console.log(el);
                        resLite.push({ "name": el.name, "url": el._links.self.href })
                    })
                    resolve(resLite)
                }).catch(err => reject(err))
        })
    }

    primaryTest(folders) {
        return new Promise((resolve, reject) => {
            var promises = []
            folders.forEach(folder => {
                var currentURL = folder.url
                promises.push(axios.get(currentURL, this.proxy))
            })

            Promise.all(promises)
                .then(responses => {
                    let stringResult = ""
                    responses.forEach(response => {
                        response.data.test_plan.forEach(el => {
                            let rowContent = "https://test-management.orangeapplicationsforbusiness.com/squash/test-case-workspace/test-case/" + el.referenced_test_case.id + "/content" + ";" + response.data.name + ";" + response.data.name + " - " + el.referenced_test_case.name + ";"
                            console.log(rowContent);
                            stringResult += rowContent + "\n"
                        })
                    })
                    resolve(stringResult)
                }).catch(err => reject(err))
        })

    }

    copyCampaingOfSprint(sprint) {
        return new Promise((resolve, reject) => {
            this.findByName("campaign-folders", "Sprint " + sprint)
                .then(res => { return this.getContents("campaign-folders", res.id) })
                .then(res => {
                    let searchObject = res._embedded.content.find(object => object.name === "Amélioration")
                    return this.getObject("campaigns", searchObject.id)
                }).then(res => {
                    let iterations = res.iterations
                    let promises = []
                    iterations.forEach(iteration => {
                        promises.push(this.getObject("iterations", iteration.id))
                    })
                    return Promise.all(promises)
                }).then(responses => {
                    let promises = []
                    let searchObject = responses.find(object => object.name === "FCC Desktop")
                    let responsesWithoutSearchObject = responses.filter(object => object.name !== "FCC Desktop")
                    searchObject.test_suites.forEach(object => {
                        // get obkjet => object."test_plan" => test case => test case similaire => new test case => new test case in bla 
                        console.log(object);
                        responsesWithoutSearchObject.forEach(response => {
                            let data = {
                                "_type": "test-suite",
                                "name": object.name,
                                "description": "<p>this is a sample test suite</p>",
                                "parent": {
                                    "_type": "iteration",
                                    "id": response.id
                                },
                                "custom_fields": [],
                                "test_plan": [],
                            }
                            promises.push(this.create("test-suites", data))
                        })
                    })
                    return Promise.all(promises)
                }).then(responses => {
                    responses.forEach(response => {
                        //console.log(response);
                    })

                    resolve(responses)
                })
                .catch(err => reject(err))

        })
    }

    _recursiveTestCaseFolder(id) {
        return new Promise((resolve, reject) => {
            let testsFind = 0;
            this.getContents("test-case-folders", id)
                .then(data => {
                    let promises = []
                    if (data._embedded !== undefined) {
                        data._embedded.content.forEach(async obj => {
                            if (obj._type == "test-case-folder") {
                                promises.push(this._recursiveTestCaseFolder(obj.id))

                            } else {
                                testsFind++;
                                this.allTest.push({ id: obj.id, name: obj.name })

                            }
                        })

                    }
                    Promise.all(promises).then(promises => {
                        promises.forEach(promise => {
                            testsFind = testsFind + promise;
                        })
                        //console.log("testsFind = " + testsFind);
                        resolve(testsFind)
                    })

                }).catch(err => {
                    console.error(err);
                    resolve(testsFind)
                })
        })

    }

    getAllTests() {
        return new Promise((resolve, reject) => {
            let promises = [this._recursiveTestCaseFolder(266783), this._recursiveTestCaseFolder(266782), this._recursiveTestCaseFolder(266784), this._recursiveTestCaseFolder(266785)]
            Promise.all(promises).then(results => {
                let concatResult = 0
                results.forEach(result => {
                    //console.log(result);
                    concatResult += result
                })
                console.log("Cas de tests trouvés : " + concatResult);
                resolve(this.allTest)
            }).catch(err => reject(err))
        })
    }

    _isAno(id) {

        this.getObject("requirements", id)
            .then(data => {
                //console.log(data.current_version.category.code);
                return data.current_version.category.code == "CAT_JIRA_BUG"
            }).catch(err => {
                return err
            })
    }

    _purgeAno(exigs) {
        let exigsFiltred = []
        exigs.forEach(exig => {
            if (!this._isAno(exig.id)) {
                exigsFiltred.push(exig)
            }
        })
        return exigsFiltred
    }

    _recursiveRequirementFolder(id) {
        return new Promise((resolve, reject) => {
            let exigencesFind = 0;
            this.getContents("requirement-folders", id)
                .then(data => {
                    let promises = []
                    if (data._embedded !== undefined) {
                        data._embedded.content.forEach(async obj => {
                            if (obj._type == "requirement-folder") {
                                promises.push(this._recursiveRequirementFolder(obj.id))
                            } else {
                                exigencesFind++;
                                this.allExig.push({ id: obj.id, name: obj.name })
                            }
                        })
                    }

                    Promise.all(promises).then(promises => {
                        promises.forEach(promise => {
                            exigencesFind = exigencesFind + promise;
                        })
                        resolve(exigencesFind)
                    })

                }).catch(err => {
                    console.error(err);
                    resolve(exigencesFind)
                })
        })
    }

    getAllExigences() {
        return new Promise((resolve, reject) => {
            this._recursiveRequirementFolder(750827)
                .then(data => {
                    resolve(this.allExig)
                }).catch(err => reject(err))

        })
    }

    _testCreateTestSuite() {
        let data = {
            "_type": "test-suite",
            "name": "TEST CREATE",
            "description": "<p>this is a sample test suite</p>",
            "parent": {
                "_type": "iteration",
                "id": 19357
            },
            "custom_fields": [],
            "test_plan": [],
        }
        return new Promise((resolve, reject) => {
            this.create("test-suites", data)
                .then(res => resolve(res))
                .catch(err => reject(err))
        })
    }
}

module.exports = apiSquash