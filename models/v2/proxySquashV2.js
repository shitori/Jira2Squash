var dotenv = require('dotenv')
dotenv.config()

const USERNAME = process.env.SQUASH_USERNAME
const PASSWORD = process.env.PROXY_PASSWORD

class Proxy {
    constructor() {
        this.infoCO = {
            headers: {
                Authorization:
                    'Basic ' +
                    Buffer.from(USERNAME + ':' + PASSWORD).toString('base64'),
            },
        }
    }

    getProxy() {
        return this.infoCO
    }
}

module.exports = Proxy
