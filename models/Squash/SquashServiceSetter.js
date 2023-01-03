const axios = require('axios')

const dotenv = require('dotenv')
dotenv.config()

const baseURL = process.env.SQUASH_BASE_URL

class SquashServiceSetter {
    constructor(proxy, client) {
        this.proxy = proxy
        this.forlderMax = 0
        this.folderCurrent = 0
        this.requirementMax = 0
        this.requirementCurrent = 0
        this.changeStatusMax = 0
        this.changeStatusCurrent = 0
        this.testPlanMax = 0
        this.testPlanCurrent = 0
        this.allTest = []
        this.allExig = []
        this.client = client
        this._setClientWebsocket(this.client)
        this.delay = 0
    }

    _setProgressBarTestPlan(max) {
        this.testPlanMax = max
        this.testPlanCurrent = 0
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
                "Data from WebSocketServer squashserviceSetter'" +
                    message.data +
                    "'"
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
        console.info(info)
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

    _sendWSTestPlanInfo(client) {
        this.testPlanCurrent++
        let testPlanInfo = {
            message:
                'Test-plan : ' + this.testPlanCurrent + '/' + this.testPlanMax,
            percent: 50 + (this.testPlanCurrent * 50) / this.testPlanMax,
            cible: 'Diffuse',
        }
        this._sendWSinfoSoft(client, testPlanInfo)
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
            axios
                .post(baseURL + objectName, data, this.proxy)
                .then((res) => {
                    if (objectName == 'requirement-folders') {
                        this._sendWSFolderInfo(this.client)
                    } else if (objectName == 'requirements') {
                        this._sendWSRequirementInfo(this.client)
                    } else if (objectName.includes('test-plan')) {
                        this._sendWSTestPlanInfo(this.client)
                    } else {
                        this.client.send('Finish for ' + objectName)
                    }
                    resolve(res.data)
                })
                .catch((err) => {
                    if (objectName == 'requirement-folders') {
                        this._sendWSFolderInfo(this.client)
                    } else if (objectName == 'requirements') {
                        this._sendWSRequirementInfo(this.client)
                    } else if (objectName.includes('test-plan')) {
                        this._sendWSTestPlanInfo(this.client)
                    } else {
                        this.client.send('Finish for ' + objectName)
                    }
                    reject({ messsage: 'error in create', err })
                })
        })
    }

    changeStatus(test, status) {
        //TODO change parent itération -> maybe useless
        let idTest = test.id
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL + 'iteration-test-plan-items/' + idTest + '/executions'
            axios
                .post(currentURL, {}, this.proxy)
                .then((res) => {
                    let idExecution = res.data.id
                    let dataPatch = {
                        _type: 'execution',
                        execution_status: status,
                    }
                    currentURL =
                        baseURL +
                        'executions/' +
                        idExecution +
                        '?fields=execution_status'
                    return axios.patch(currentURL, dataPatch, this.proxy)
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
                .catch((err) => {
                    this._sendWSExcutionStatusInfo(this.client)
                    reject({ message: 'error in ', err })
                })
        })
    }
}

module.exports = SquashServiceSetter
