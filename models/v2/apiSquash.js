const axios = require('axios')
const dHelper = require('../helper/defaultHelper')
const fileHelper = require('../helper/fileHelper')
var WebSocket = require('faye-websocket')

const dotenv = require('dotenv')
dotenv.config()

const baseURL = process.env.SQUASH_BASE_URL
const guiJiraURL = process.env.JIRA_GUI_URL

const wallboardFolderFileName = 'WallBoard'
const wallboardAcronymeSprint = 'WB - '
const wallboardFolderParentName = 'New Wallboard'

const bandeauFolderFileName = 'Bandeau'
const bandeauAcronymeSprint = 'G2R2 - '
const bandeauFolderParentName = '[NextGen]Nouveaux Bandeaux'

class apiSquash {
    constructor(proxy) {
        this.proxy = proxy
        this.forlderMax = 0
        this.folderCurrent = 0
        this.requirementMax = 0
        this.requirementCurrent = 0
        this.changeStatusMax = 0
        this.changeStatusCurrent = 0
        this.allTest = []
        this.allExig = []
        this.client = new WebSocket.Client('ws://localhost:3002/')
        this._setClientWebsocket(this.client)
        this.delay = 0
    }

    _setProgressBarRequirement(max) {
        this.requirementMax = max
        this.requirementCurrent = 0
    }

    _setProgressBarFolder(max) {
        this.forlderMax = max
        this.folderCurrent = 0
    }

    _setProgressBarStatus(max) {
        this.changeStatusMax = max
        this.changeStatusCurrent = 0
    }

    _setClientWebsocket(client) {
        client.on('open', function () {
            console.info('Connection established for create!')
        })

        client.on('message', function (message) {
            console.info(
                "Data from WebSocketServer api Squash'" + message.data + "'"
            )
        })

        client.on('close', function (message) {
            console.info('Connection closed!', message.code, message.reason)
            client = null
        })
    }

    _closeClientWebsocket(client) {
        client.close()
    }

    _sendWSinfoHard(client, message, percent, cible) {
        let info = {
            message: message,
            percent: percent,
            cible: cible,
        }
        this._sendWSinfoSoft(client, info)
    }

    _sendWSinfoSoft(client, info) {
        client.send(JSON.stringify(info))
    }

    _sendWSRequirementInfo(client) {
        this.requirementCurrent++
        let requirementInfo = {
            message:
                'Requirements : ' +
                this.requirementCurrent +
                '/' +
                this.requirementMax,
            percent: 50 + (this.requirementCurrent * 50) / this.requirementMax,
            cible: 'fromAPI',
        }
        this._sendWSinfoSoft(client, requirementInfo)
    }

    _sendWSFolderInfo(client) {
        this.folderCurrent++
        let folderInfo = {
            message: 'Folders : ' + this.folderCurrent + '/' + this.forlderMax,
            percent: 30 + (this.folderCurrent * 20) / this.forlderMax,
            cible: 'fromAPI',
        }
        this._sendWSinfoSoft(client, folderInfo)
    }

    _sendWSExcutionStatusInfo(client) {
        this.changeStatusCurrent++
        let changeStatusInfo = {
            message:
                'Tests status changed : ' +
                this.changeStatusCurrent +
                '/' +
                this.changeStatusMax,
            percent:
                50 + (this.changeStatusCurrent * 50) / this.changeStatusMax,
            cible: 'fromRF',
        }
        this._sendWSinfoSoft(client, changeStatusInfo)
    }

    create(objectName, data) {
        return new Promise((resolve, reject) => {
            /*let client = new WebSocket.Client('ws://localhost:3002/')
            this._setClientWebsocket(client)*/

            axios
                .post(baseURL + objectName, data, this.proxy)
                .then((res) => {
                    if (objectName == 'requirement-folders') {
                        this._sendWSFolderInfo(this.client)
                    } else if (objectName == 'requirements') {
                        this._sendWSRequirementInfo(this.client)
                    } else {
                        this.client.send('Finish for ' + objectName)
                    }
                    resolve(res.data)
                })
                .catch((error) => {
                    if (objectName == 'requirement-folders') {
                        this._sendWSFolderInfo(this.client)
                    } else if (objectName == 'requirements') {
                        this._sendWSRequirementInfo(this.client)
                    } else {
                        this.client.send('Finish for ' + objectName)
                    }
                    console.error('error in create')
                    console.error(error)
                    reject(error)
                })
        })
    }

    changeStatus(test, status) {
        //TODO change parent itération -> maybe useless
        let idTest = test.id
        return new Promise((resolve, reject) => {
            axios
                .post(
                    baseURL +
                        'iteration-test-plan-items/' +
                        idTest +
                        '/executions',
                    {},
                    this.proxy
                )
                .then((res) => {
                    console.info('execution create')
                    let idExecution = res.data.id
                    let dataPatch = {
                        _type: 'execution',
                        execution_status: status,
                    }
                    return axios.patch(
                        baseURL +
                            'executions/' +
                            idExecution +
                            '?fields=execution_status',
                        dataPatch,
                        this.proxy
                    )
                })
                .then(() => {
                    this._sendWSExcutionStatusInfo(this.client)
                    resolve({
                        message:
                            'Test ' +
                            idTest +
                            ' mise à jour avec le status : ' +
                            status,
                        id: idTest,
                        status: status,
                        testName: test.refTestName,
                        realId: test.refTestId,
                    })
                })
                .catch((error) => {
                    this._sendWSExcutionStatusInfo(this.client)
                    console.error('error in changeStatus')
                    console.error(error)
                    reject(error)
                })
        })
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
            this.create('requirements', data)
                .then((success) => {
                    resolve(
                        'ID nouvelle exigence : ' +
                            success.id +
                            ' - ' +
                            record.nameJira
                    )
                })
                .catch((err) => {
                    reject(err)
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
                    .catch((err) => reject(err))
            } else {
                var exigenceAlreadyExist = dataFolder._embedded.content.find(
                    (el) => el.name == record.nameJira.replaceAll('/', '\\')
                )
                if (exigenceAlreadyExist == undefined) {
                    this.createRequirement(idFolder, record)
                        .then((res) => resolve({ message: res, result: 1 }))
                        .catch((err) => reject(err))
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
                this.getContents('requirement-folders', idB),
                this.getContents('requirement-folders', idWB),
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
                            this.delay += 1000
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
                            this.delay += 1000
                        }
                    })
                    Promise.all(result)
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
                        .catch((err) => reject(err))
                })
                .catch((err) => reject(err))
        })
    }

    createFolderIfNecessary(isWB, sprint) {
        let folderName =
            (isWB ? wallboardAcronymeSprint : bandeauAcronymeSprint) +
            'Sprint ' +
            sprint
        return new Promise((resolve, reject) => {
            this.findIDByName('requirement-folders', folderName)
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
                        return this.findIDByName(
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
                    return this.create('requirement-folders', dataFolder)
                })
                .then((res) => {
                    let idNewFolder = res.id
                    resolve(idNewFolder)
                })
                .catch((err) => reject(err))
        })
    }

    getContents(objectType, idObject) {
        console.info(this.proxy)
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL +
                objectType +
                '/' +
                idObject +
                '/content?page=0&size=200000'
            console.info(currentURL)
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    getObject(objectType, idObject) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + '/' + idObject
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    findByName(objectType, name) {
        return new Promise((resolve, reject) => {
            let currentURL = baseURL + objectType + '?page=0&size=200000'
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    console.info(
                        res.status == 200
                            ? 'Objet ' + name + ' trouvé'
                            : 'Objet ' + name + ' non trouvé'
                    )
                    let objects = res.data._embedded[objectType]
                    let searchObject = objects.find(
                        (object) => object.name === name
                    )
                    resolve(searchObject)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    findIDByName(objectType, name) {
        return this.findSomethingByName(objectType, name, 'id')
    }

    findSomethingByName(objectType, name, field) {
        return new Promise((resolve, reject) => {
            this.findByName(objectType, name)
                .then((res) => {
                    if (res === undefined) {
                        resolve(undefined)
                    } else {
                        resolve(res[field])
                    }
                })
                .catch((err) => reject(err))
        })
    }

    importInSquashWithAPI(result, sprint) {
        return new Promise((resolve, reject) => {
            var promesse = [
                this.createFolderIfNecessary(true, sprint),
                this.createFolderIfNecessary(false, sprint),
            ]
            this._setProgressBarRequirement(result.length)
            this._setProgressBarFolder(promesse.length)
            Promise.all(promesse)
                .then((responses) => {
                    this.createRequirements(responses[1], responses[0], result)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err))
                })
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })
        })
    }

    getTestsSuiteOfIteractionP1() {
        return new Promise((resolve, reject) => {
            this.getObject('iterations', 19329) // id de l'itéraction dans squash
                .then((res) => {
                    let resLite = []
                    res.test_suites.forEach((el) => {
                        resLite.push({
                            name: el.name,
                            url: el._links.self.href,
                        })
                    })
                    resolve(resLite)
                })
                .catch((err) => reject(err))
        })
    }

    primaryTest(folders) {
        return new Promise((resolve, reject) => {
            var promises = []
            folders.forEach((folder) => {
                var currentURL = folder.url
                promises.push(axios.get(currentURL, this.proxy))
            })

            Promise.all(promises)
                .then((responses) => {
                    let stringResult = ''
                    responses.forEach((response) => {
                        response.data.test_plan.forEach((el) => {
                            let rowContent =
                                'https://test-management.orangeapplicationsforbusiness.com/squash/test-case-workspace/test-case/' +
                                el.referenced_test_case.id +
                                '/content' +
                                ';' +
                                response.data.name +
                                ';' +
                                response.data.name +
                                ' - ' +
                                el.referenced_test_case.name +
                                ';'

                            stringResult += rowContent + '\n'
                        })
                    })
                    resolve(stringResult)
                })
                .catch((err) => reject(err))
        })
    }

    copyCampaingOfSprint(sprint) {
        return new Promise((resolve, reject) => {
            this.findByName('campaign-folders', 'Sprint ' + sprint)
                .then((res) => {
                    return this.getContents('campaign-folders', res.id)
                })
                .then((res) => {
                    let searchObject = res._embedded.content.find(
                        (object) => object.name === 'Amélioration'
                    )
                    return this.getObject('campaigns', searchObject.id)
                })
                .then((res) => {
                    let iterations = res.iterations
                    let promises = []
                    iterations.forEach((iteration) => {
                        promises.push(
                            this.getObject('iterations', iteration.id)
                        )
                    })
                    return Promise.all(promises)
                })
                .then((responses) => {
                    let promises = []
                    let searchObject = responses.find(
                        (object) => object.name === 'FCC Desktop'
                    )
                    let responsesWithoutSearchObject = responses.filter(
                        (object) => object.name !== 'FCC Desktop'
                    )
                    searchObject.test_suites.forEach((object) => {
                        responsesWithoutSearchObject.forEach((response) => {
                            let data = {
                                _type: 'test-suite',
                                name: object.name,
                                description:
                                    '<p>this is a sample test suite</p>',
                                parent: {
                                    _type: 'iteration',
                                    id: response.id,
                                },
                                custom_fields: [],
                                test_plan: [],
                            }
                            promises.push(this.create('test-suites', data))
                        })
                    })
                    return Promise.all(promises)
                })
                .then((responses) => {
                    resolve(responses)
                })
                .catch((err) => reject(err))
        })
    }

    _recursiveTestCaseFolder(id) {
        return new Promise((resolve, reject) => {
            let testsFind = 0
            this.getContents('test-case-folders', id)
                .then((data) => {
                    let promises = []
                    if (data._embedded !== undefined) {
                        data._embedded.content.forEach(async (obj) => {
                            if (obj._type == 'test-case-folder') {
                                promises.push(
                                    this._recursiveTestCaseFolder(obj.id)
                                )
                            } else {
                                testsFind++
                                this.allTest.push({
                                    id: obj.id,
                                    name: obj.name,
                                })
                            }
                        })
                    }
                    Promise.all(promises).then((promises) => {
                        promises.forEach((promise) => {
                            testsFind = testsFind + promise
                        })
                        //console.log("testsFind = " + testsFind);
                        resolve(testsFind)
                    })
                })
                .catch((err) => {
                    console.error(err)
                    reject(testsFind)
                })
        })
    }

    getAllTests() {
        return new Promise((resolve, reject) => {
            let promises = [
                this._recursiveTestCaseFolder(266783),
                this._recursiveTestCaseFolder(266782),
                this._recursiveTestCaseFolder(266784),
                this._recursiveTestCaseFolder(266785),
            ]
            Promise.all(promises)
                .then((results) => {
                    let concatResult = 0
                    results.forEach((result) => {
                        //console.log(result);
                        concatResult += result
                    })
                    console.info('Cas de tests trouvés : ' + concatResult)
                    resolve(this.allTest)
                })
                .catch((err) => reject(err))
        })
    }

    _isAno(id) {
        this.getObject('requirements', id)
            .then((data) => {
                //console.log(data.current_version.category.code);
                return data.current_version.category.code == 'CAT_JIRA_BUG'
            })
            .catch((err) => {
                return err
            })
    }

    _purgeAno(exigs) {
        let exigsFiltred = []
        exigs.forEach((exig) => {
            if (!this._isAno(exig.id)) {
                exigsFiltred.push(exig)
            }
        })
        return exigsFiltred
    }

    _recursiveRequirementFolder(id) {
        return new Promise((resolve, reject) => {
            let exigencesFind = 0
            this.getContents('requirement-folders', id)
                .then((data) => {
                    let promises = []
                    if (data._embedded !== undefined) {
                        data._embedded.content.forEach(async (obj) => {
                            if (obj._type == 'requirement-folder') {
                                promises.push(
                                    this._recursiveRequirementFolder(obj.id)
                                )
                            } else {
                                exigencesFind++
                                this.allExig.push({
                                    id: obj.id,
                                    name: obj.name,
                                })
                            }
                        })
                    }

                    Promise.all(promises).then((promises) => {
                        promises.forEach((promise) => {
                            exigencesFind = exigencesFind + promise
                        })
                        resolve(exigencesFind)
                    })
                })
                .catch((err) => {
                    console.error(err)
                    reject(exigencesFind)
                })
        })
    }

    getAllExigences() {
        return new Promise((resolve, reject) => {
            this._recursiveRequirementFolder(750827)
                .then(() => {
                    resolve(this.allExig)
                })
                .catch((err) => reject(err))
        })
    }

    _testCreateTestSuite() {
        let data = {
            _type: 'test-suite',
            name: 'TEST CREATE',
            description: '<p>this is a sample test suite</p>',
            parent: {
                _type: 'iteration',
                id: 19357,
            },
            custom_fields: [],
            test_plan: [],
        }
        return new Promise((resolve, reject) => {
            this.create('test-suites', data)
                .then((res) => resolve(res))
                .catch((err) => reject(err))
        })
    }

    setSquashCampagneFromJsonResult(req, resultRobotFrameWork, mapping) {
        //console.log(req);
        return new Promise((resolve, reject) => {
            this.getContents('campaign-folders', 9466) //? https://test-management.orangeapplicationsforbusiness.com/squash/campaign-workspace/campaign-folder/9466/content
                .then((res) => {
                    let findFolder =
                        req.body.inputSprint == ''
                            ? 'Sprint Robot FrameWork'
                            : 'Sprint ' + req.inputSprint
                    let folder = res._embedded.content.find(
                        (cf) => cf.name === findFolder
                    )
                    console.info('Sprint folder finded')
                    return this.getContents('campaign-folders', folder.id)
                })
                .then((res) => {
                    this._sendWSinfoHard(
                        this.client,
                        'Squash campaing parent folder finded',
                        35,
                        'fromRF'
                    )
                    let folder = res._embedded.content.find(
                        (cf) => cf.name === 'PLTF V7'
                    )
                    return this.getObject('campaigns', folder.id)
                })
                .then((res) => {
                    this._sendWSinfoHard(
                        this.client,
                        'Squash campaing folder finded',
                        40,
                        'fromRF'
                    )
                    let hardP0 = res.iterations.find(
                        (iteration) =>
                            iteration.name === 'FCC Web Hardphone - P0'
                    )
                    let hardP1 = res.iterations.find(
                        (iteration) =>
                            iteration.name === 'FCC Web Hardphone - P1'
                    )
                    let soft = res.iterations.find(
                        (iteration) => iteration.name === 'FCC Web Softphone'
                    )
                    let promises = [
                        this.getObject('iterations', hardP0.id),
                        this.getObject('iterations', hardP1.id),
                        this.getObject('iterations', soft.id),
                    ]
                    console.info('3 Tests folders finded')
                    return Promise.all(promises)
                })
                .then((responses) => {
                    this._sendWSinfoHard(
                        this.client,
                        'Squash Test folder finded',
                        45,
                        'fromRF'
                    )
                    let res = []
                    responses.forEach((response) => {
                        res = res.concat(response.test_suites)
                    })
                    let promises = []
                    res.forEach((tests) => {
                        promises.push(this.getObject('test-suites', tests.id))
                    })
                    console.info('Tests suites concated')
                    return Promise.all(promises)
                })
                .then((responses) => {
                    this._sendWSinfoHard(
                        this.client,
                        'Squash Test suites finded and concated',
                        50,
                        'fromRF'
                    )
                    let res = []
                    responses.forEach((response) => {
                        res = res.concat(response.test_plan)
                    })
                    console.info('Tests plan concated')
                    let shortRes = []
                    res.forEach((el) => {
                        shortRes.push({
                            id: el.id,
                            status: el.execution_status,
                            type: el._type,
                            refTestName: el.referenced_test_case.name,
                            refTestId: el.referenced_test_case.id,
                        })
                    })
                    console.info('Shortres maked')

                    fileHelper.saveJsonTmpFile(
                        'shortResultJson',
                        JSON.stringify(shortRes, null, 4)
                    )
                    fileHelper.saveJsonTmpFile(
                        'resultJson',
                        JSON.stringify(res, null, 4)
                    )

                    let changeStatusList = []
                    this.delay = 0
                    shortRes.forEach((el) => {
                        Object.entries(mapping).forEach((kv) => {
                            let key = kv[0]
                            let value = kv[1]
                            if (value.includes(el.refTestId)) {
                                let findedResultRobotFrameWork =
                                    resultRobotFrameWork.find(
                                        (rrb) => rrb.name === key
                                    )
                                //console.log(findedResultRobotFrameWork)
                                if (
                                    findedResultRobotFrameWork !== undefined &&
                                    findedResultRobotFrameWork.status == 'OK'
                                ) {
                                    console.info(
                                        el.refTestName +
                                            ' ajouté pour nouveau succès'
                                    )
                                    changeStatusList.push(
                                        new Promise((resolve) =>
                                            setTimeout(resolve, this.delay)
                                        ).then(() =>
                                            this.changeStatus(el, 'SUCCESS')
                                        )
                                    )
                                    this.delay += 1000
                                } else if (
                                    findedResultRobotFrameWork !== undefined &&
                                    findedResultRobotFrameWork.status == 'KO'
                                ) {
                                    console.info(
                                        el.refTestName +
                                            ' ajouté pour nouveau échec'
                                    )
                                    changeStatusList.push(
                                        new Promise((resolve) =>
                                            setTimeout(resolve, this.delay)
                                        ).then(() =>
                                            this.changeStatus(el, 'FAILURE')
                                        )
                                    )
                                    this.delay += 1000
                                }
                            }
                        })
                    })
                    this._setProgressBarStatus(changeStatusList.length)
                    console.info(
                        changeStatusList.length + ' tests will be changed ! '
                    )
                    return Promise.all(changeStatusList)
                })
                .then((responses) => {
                    console.info('Mise à jour terminé')
                    resolve(responses)
                })
                .catch((err) => {
                    console.error(
                        'error in setSquashCampagneFromJsonResult in apiSquash'
                    )
                    console.error(err)
                    reject(err)
                })
        })
    }
}

module.exports = apiSquash
