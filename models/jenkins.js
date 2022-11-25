const dotenv = require('dotenv')
dotenv.config()
const axios = require('axios')

const URL_OUTPUT = process.env.JENKINS_OUTPUT_URL

class Jenkins {
    constructor() {
        this.proxy = {
            proxy: {
                host: process.env.PROXY_HOST,
                port: process.env.PROXY_PORT,
                auth: {
                    username: process.env.PROXY_USERNAME,
                    password: process.env.PROXY_PASSWORD,
                },
            },
            auth: {
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD,
            },
        }
    }

    getOutputResultRobotFrameWork() {
        return new Promise((resolve, reject) => {
            axios
                .get(URL_OUTPUT, this.proxy)
                .then((res) => resolve(res))
                .catch((err) => reject(err))
        })
    }
}

module.exports = Jenkins
