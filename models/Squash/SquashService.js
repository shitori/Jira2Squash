const fileHelper = require('../helper/fileHelper')
var WebSocket = require('faye-websocket')

const SquashServiceGetter = require('./SquashServiceGetter')
const SquashServiceSetter = require('./SquashServiceSetter')
const SquashServiceFolder = require('./SquashServiceFolder')
const SquashServiceRequirement = require('./SquashServiceRequirement')

const dotenv = require('dotenv')
dotenv.config()

const DELAY_VALUE = 1000

class SquashService {
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
        this.delay
        this.getter = new SquashServiceGetter(proxy)
        this.setter = new SquashServiceSetter(proxy, this.client)
        this.folderService = new SquashServiceFolder(proxy, this.client)
        this.requirementService = new SquashServiceRequirement(
            proxy,
            this.client
        )
    }

    _setProgressBarRequirement(max) {
        this.setter._setProgressBarRequirement(max)
        this.folderService._setProgressBarRequirement(max)
        this.requirementService._setProgressBarRequirement(max)
        this.requirementMax = max
        this.requirementCurrent = 0
    }

    _setProgressBarFolder(max) {
        this.setter._setProgressBarFolder(max)
        this.folderService._setProgressBarFolder(max)
        this.requirementService._setProgressBarFolder(max)
        this.forlderMax = max
        this.folderCurrent = 0
    }

    _setProgressBarStatus(max) {
        this.setter._setProgressBarStatus(max)
        this.folderService._setProgressBarStatus(max)
        this.requirementService._setProgressBarStatus(max)
        this.changeStatusMax = max
        this.changeStatusCurrent = 0
    }

    _setClientWebsocket(client) {
        client.on('open', function () {
            console.info('Connection established for create!')
        })

        client.on('message', function (message) {
            console.info(
                "Data from WebSocketServer squashService'" + message.data + "'"
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

    importInSquashWithAPI(result, sprint) {
        return new Promise((resolve, reject) => {
            var promesse = [
                this.folderService.createFolderIfNecessary(true, sprint),
                this.folderService.createFolderIfNecessary(false, sprint),
            ]
            this._setProgressBarRequirement(result.length)
            this._setProgressBarFolder(promesse.length)
            Promise.all(promesse)
                .then((responses) => {
                    return this.requirementService.createRequirements(
                        responses[1],
                        responses[0],
                        result
                    )
                })
                .then((res) => resolve(res))
                .catch((err) => {
                    console.error(err)
                    reject({ message: 'error in importInSquashWithAPI', err })
                })
        })
    }

    setSquashCampagneFromJsonResult(req, resultRobotFrameWork, mapping) {
        return new Promise((resolve, reject) => {
            this.getter
                .getContents('campaign-folders', 9466) //? https://test-management.orangeapplicationsforbusiness.com/squash/campaign-workspace/campaign-folder/9466/content
                .then((res) => {
                    let findFolder =
                        req.body.inputSprint == ''
                            ? 'Sprint Robot FrameWork'
                            : 'Sprint ' + req.inputSprint
                    let folder = res._embedded.content.find(
                        (cf) => cf.name === findFolder
                    )

                    console.info('Sprint folder finded : ')
                    console.info(folder)
                    console.info(findFolder)
                    return this.getter.getContents(
                        'campaign-folders',
                        folder.id
                    )
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
                    return this.getter.getObject('campaigns', folder.id)
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
                        this.getter.getObject('iterations', hardP0.id),
                        this.getter.getObject('iterations', hardP1.id),
                        this.getter.getObject('iterations', soft.id),
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
                        promises.push(
                            this.getter.getObject('test-suites', tests.id)
                        )
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
                                            this.setter.changeStatus(
                                                el,
                                                'SUCCESS'
                                            )
                                        )
                                    )
                                    this.delay += DELAY_VALUE
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
                                            this.setter.changeStatus(
                                                el,
                                                'FAILURE'
                                            )
                                        )
                                    )
                                    this.delay += DELAY_VALUE
                                } else if (
                                    req.body.inputSprint === '' &&
                                    key === 'UNTESTABLE'
                                ) {
                                    console.info(
                                        el.refTestName +
                                            ' pas testable pour le moment'
                                    )
                                    changeStatusList.push(
                                        new Promise((resolve) =>
                                            setTimeout(resolve, this.delay)
                                        ).then(() =>
                                            this.setter.changeStatus(
                                                el,
                                                'UNTESTABLE'
                                            )
                                        )
                                    )
                                    this.delay += DELAY_VALUE
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
                    reject({
                        message:
                            'error in setSquashCampagneFromJsonResult Squash service',
                        err,
                    })
                })
        })
    }

    getAllTests() {
        return new Promise((resolve, reject) => {
            this.getter
                .findIDByName('projects', 'fcc-next-gen')
                .then((idProject) => {
                    return this.getter.getTestslibrary(idProject)
                })
                .then((res) => {
                    let promises = []
                    res.forEach((el) => {
                        promises.push(
                            this.getter._recursiveTestCaseFolder(el.id, el.name)
                        )
                    })
                    return Promise.all(promises)
                })
                .then((res) => {
                    let concatResult = 0
                    res.forEach((result) => {
                        concatResult += result
                    })
                    console.info('Cas de tests trouvés : ' + concatResult)
                    resolve(this.getter.tests)
                })
                .catch((err) => {
                    console.error(err)
                    reject({ message: 'error in getAllTests', err })
                })
        })
    }

    diffuseCompaingBandeauTests(sprintName, seedFolderName) {
        return new Promise((resolve, reject) => {
            this._getSeedTestsForComopaign(sprintName, seedFolderName)
                .then((res) => {
                    let seedTestPlan = res.seedTestPlan
                    let iterations = res.iterations
                    let tests = fileHelper.readJsonFile(
                        './backup/allTestsRegroup.json'
                    )
                    let promises = []
                    this.delay = 0
                    seedTestPlan.forEach((testIteration) => {
                        let testID = testIteration.referenced_test_case.id
                        tests.forEach((test) => {
                            if (test.ids.includes(testID)) {
                                console.info(testID + ' pret pour le clonage')
                                iterations.forEach((iteration) => {
                                    test.parents.forEach((parent) => {
                                        if (
                                            parent.parent.includes(
                                                iteration.name
                                            )
                                        ) {
                                            console.info(
                                                'iteration ' +
                                                    iteration.id +
                                                    '/' +
                                                    iteration.name +
                                                    ' receive copy from parent of ' +
                                                    parent.id +
                                                    '/' +
                                                    parent.parent
                                            )
                                            let postURL =
                                                'iterations/' +
                                                iteration.id +
                                                '/test-plan'
                                            let dataForPost = {
                                                _type: 'iteration-test-plan-item',
                                                test_case: {
                                                    _type: 'test-case',
                                                    id: parent.id,
                                                },
                                            }
                                            if (
                                                testIteration.referenced_dataset ==
                                                undefined
                                            ) {
                                                promises.push(
                                                    new Promise((resolve) =>
                                                        setTimeout(
                                                            resolve,
                                                            this.delay
                                                        )
                                                    ).then(() =>
                                                        this.setter.create(
                                                            postURL,
                                                            dataForPost
                                                        )
                                                    )
                                                )
                                            } else {
                                                promises.push(
                                                    new Promise((resolve) =>
                                                        setTimeout(
                                                            resolve,
                                                            this.delay
                                                        )
                                                    ).then(() =>
                                                        this._getDataSetAndInsertTest(
                                                            postURL,
                                                            dataForPost,
                                                            testIteration
                                                                .referenced_dataset
                                                                .name
                                                        )
                                                    )
                                                )
                                            }
                                            this.delay += DELAY_VALUE
                                        }
                                    })
                                })
                            }
                        })
                    })
                    if (!promises.length) {
                        console.info('pas de copie à faire')
                        resolve(res)
                    } else {
                        return Promise.all(promises)
                    }
                })
                .then((responses) => {
                    console.info('Copie terminé')
                    resolve(responses)
                })
                .catch((err) => {
                    console.error(err)
                    reject({
                        message: 'error in diffuseCompaingBandeauTests',
                        err,
                    })
                })
        })
    }

    _getDataSetAndInsertTest(postURL, dataForPost, datasetNameSeed) {
        return new Promise((resolve, reject) => {
            this.getter
                .getDataSetIDByName(dataForPost.test_case.id, datasetNameSeed)
                .then((dataSetId) => {
                    dataForPost.dataset = {
                        _type: 'dataset',
                        id: dataSetId,
                    }
                    return this.setter.create(postURL, dataForPost)
                })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject({
                        message: 'error in _getDataSetAndInsertTest',
                        err,
                    })
                })
        })
    }

    _getCompaignContent(compaigns, reject, nameCompaing, nextStepObject) {
        let compaign = compaigns.find(
            (compaign) => compaign.name == nameCompaing
        )
        if (compaign == undefined) {
            reject({
                message:
                    nextStepObject +
                    ' ' +
                    nameCompaing +
                    ' pas trouvé dans Squash',
            })
        } else {
            return this.getter.getContents(nextStepObject, compaign.id)
        }
    }

    _getSeedTestsForComopaign(sprintName, seedFolderName) {
        let otherThanSeediterations = []
        return new Promise((resolve, reject) => {
            this.getter
                .findIDByName('projects', 'fcc-next-gen')
                .then((idProject) => {
                    return this.getter.getCompaignsLibrary(idProject)
                })
                .then((compaigns) => {
                    return this._getCompaignContent(
                        compaigns,
                        reject,
                        'Bandeaux NextGen',
                        'campaign-folders'
                    )
                })
                .then((compaignContent) => {
                    return this._getCompaignContent(
                        compaignContent._embedded.content,
                        reject,
                        'G2R2',
                        'campaign-folders'
                    )
                })
                .then((compaignContent) => {
                    return this._getCompaignContent(
                        compaignContent._embedded.content,
                        reject,
                        sprintName,
                        'campaign-folders'
                    )
                })
                .then((compaignContent) => {
                    return this._getCompaignContent(
                        compaignContent._embedded.content,
                        reject,
                        'Amélioration',
                        'campaigns'
                    )
                })
                .then((compaignContent) => {
                    otherThanSeediterations = compaignContent.iterations.filter(
                        (iteration) => iteration.name !== seedFolderName
                    )
                    let iteration = compaignContent.iterations.find(
                        (iteration) => iteration.name == seedFolderName
                    )
                    if (iteration == undefined) {
                        reject({
                            message:
                                'itération FCC Desktop pas trouvé dans Squash',
                        })
                    } else {
                        return this.getter.getTestPlan(iteration.id)
                    }
                })
                .then((iterationTestPlan) => {
                    resolve({
                        seedTestPlan: iterationTestPlan,
                        iterations: otherThanSeediterations,
                    })
                })
                .catch((err) => {
                    console.error(err)
                    reject({
                        message: 'error in _getSeedTestsForComopaign',
                        err,
                    })
                })
        })
    }
}

module.exports = SquashService
