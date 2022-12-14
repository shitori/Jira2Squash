const axios = require('axios')

const dotenv = require('dotenv')
dotenv.config()

const baseURL = process.env.SQUASH_BASE_URL

class SquashServiceGetter {
    constructor(proxy) {
        this.proxy = proxy
        this.tests = []
    }

    getContents(objectType, idObject) {
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL +
                objectType +
                '/' +
                idObject +
                '/content?page=0&size=200000'
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data)
                })
                .catch((err) => {
                    reject({ message: 'error in getContents', err })
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
                    reject({ message: 'error in getObject', err })
                })
        })
    }

    getTestPlan(iterationID) {
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL +
                'iterations/' +
                iterationID +
                '/test-plan?page=0&size=200000'
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data._embedded['test-plan'])
                })
                .catch((err) => {
                    reject({ message: 'error in getTestPlan', err })
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
                            ? 'Objet ' + name + ' trouv??'
                            : 'Objet ' + name + ' non trouv??'
                    )
                    let objects = res.data._embedded[objectType]
                    let searchObject = objects.find(
                        (object) => object.name === name
                    )
                    resolve(searchObject)
                })
                .catch((err) => {
                    reject({ message: 'error in findByName', err })
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
                .catch((err) =>
                    reject({ message: 'error in findSomethingByName', err })
                )
        })
    }

    getTestslibrary(idProject) {
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL +
                'projects/' +
                idProject +
                '/test-cases-library/content'
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data._embedded['test-case-library-content'])
                })
                .catch((err) => {
                    reject({ message: 'error in getTestslibrary', err })
                })
        })
    }

    getCompaignsLibrary(idProject) {
        return new Promise((resolve, reject) => {
            let currentURL =
                baseURL + 'projects/' + idProject + '/campaigns-library/content'
            axios
                .get(currentURL, this.proxy)
                .then((res) => {
                    resolve(res.data._embedded['campaign-library-content'])
                })
                .catch((err) => {
                    reject({ message: 'error in getCompaignsLibrary', err })
                })
        })
    }

    getDataSetIDByName(idTest, name) {
        return new Promise((resolve, reject) => {
            this.getObject('test-cases', idTest)
                .then((test) => {
                    let dataset = test.datasets.find(
                        (dataset) => dataset.name == name
                    )
                    if (dataset == undefined) {
                        reject({
                            message: 'error in getCompaignsLibrary',
                            err: 'Pas de dataset',
                        })
                    } else {
                        resolve(dataset.id)
                    }
                })
                .catch((err) => {
                    reject({ message: 'error in getDataSetIDByName', err })
                })
        })
    }

    _recursiveTestCaseFolder(id, parent) {
        return new Promise((resolve) => {
            let testsFind = 0
            this.getContents('test-case-folders', id)
                .then((data) => {
                    let promises = []
                    if (data._embedded !== undefined) {
                        data._embedded.content.forEach(async (obj) => {
                            if (obj._type == 'test-case-folder') {
                                promises.push(
                                    this._recursiveTestCaseFolder(
                                        obj.id,
                                        parent
                                    )
                                )
                            } else {
                                testsFind++
                                this.tests.push({
                                    id: obj.id,
                                    name: obj.name,
                                    parent,
                                })
                            }
                        })
                    }
                    Promise.all(promises).then((promises) => {
                        promises.forEach((promise) => {
                            testsFind = testsFind + promise
                        })
                        resolve(testsFind)
                    })
                })
                .catch((err) => {
                    console.error(err)
                    resolve(testsFind)
                })
        })
    }
}

module.exports = SquashServiceGetter
