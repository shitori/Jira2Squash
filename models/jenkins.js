const dotenv = require('dotenv')
dotenv.config()
const axios = require('axios')

const URL_OUTPUT =
    'http://172.27.0.229:8080/jenkins2/view/FCC%20GUI%20-%20Tests%20Robot%20Framework/job/Flexible%20NextGen%20Tests%20automatis%C3%A9s%20RobotFramework%20-%20WINDOWS/ws/Tests_Robot/tests/output.xml'

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
