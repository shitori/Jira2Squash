const axios = require('axios')

const dotenv = require('dotenv')
dotenv.config()

const baseURL = process.env.SQUASH_BASE_URL

class SquashServiceGetter {
    constructor(proxy) {
        this.proxy = proxy
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
}

module.exports = SquashServiceGetter
