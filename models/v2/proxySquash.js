var dotenv = require('dotenv')
dotenv.config()

class Proxy {
    constructor(idJsession, idSquashTM) {
        this.infoCO = {
            headers: {
                Cookie: 'JSESSIONID=' + idJsession + '; squashtm=' + idSquashTM,
            },
        }
    }

    getProxy() {
        return this.infoCO
    }
}

module.exports = Proxy
