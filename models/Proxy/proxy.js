var dotenv = require('dotenv')
dotenv.config()

class Proxy {
    constructor(id) {
        this.infoCO = {
            proxy: {
                host: process.env.PROXY_HOST,
                port: process.env.PROXY_PORT,
                auth: {
                    username: process.env.PROXY_USERNAME,
                    password: process.env.PROXY_PASSWORD,
                },
            },
            headers: {
                Cookie: 'JSESSIONID=' + id,
            },
        }
    }

    getProxy() {
        return this.infoCO
    }
}

module.exports = Proxy
