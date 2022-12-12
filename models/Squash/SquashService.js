const fileHelper = require('../helper/fileHelper')
var WebSocket = require('faye-websocket')

const SquashServiceGetter = require('./SquashServiceGetter')
const SquashServiceSetter = require('./SquashServiceSetter')
const SquashServiceFolder = require('./SquashServiceFolder')
const SquashServiceRequirement = require('./SquashServiceRequirement')

const dotenv = require('dotenv')
dotenv.config()

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
            console.info("Data from WebSocketServer '" + message.data + "'")
        })

        client.on('close', function (message) {
            console.info('Connection closed!', message.code, message.reason)
            client = null
        })
    }

    _closeClientWebsocket(client) {
        client.close()
    }

    _sendWSinfoHard(client, message, percent) {
        let info = {
            message: message,
            percent: percent,
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
                    this.requirementService
                        .createRequirements(responses[1], responses[0], result)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err))
                })
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })
        })
    }

    setSquashCampagneFromJsonResult(req, resultRobotFrameWork, mapping) {
        //console.log(req);
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
                    console.info('Sprint folder finded')
                    return this.getter.getContents(
                        'campaign-folders',
                        folder.id
                    )
                })
                .then((res) => {
                    this._sendWSinfoHard(
                        this.client,
                        'Squash campaing parent folder finded',
                        35
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
                        40
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
                        45
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
                        50
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
                                    console.info(el.refTestName + ' ajouté')
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
                                    this.delay += 1000
                                } else if (
                                    findedResultRobotFrameWork !== undefined &&
                                    findedResultRobotFrameWork.status == 'KO'
                                ) {
                                    console.info(el.refTestName + ' ajouté')
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
                    console.error('error in setSquashCampagneFromJsonResult')
                    console.error(err)
                    reject(err)
                })
        })
    }
}

module.exports = SquashService
