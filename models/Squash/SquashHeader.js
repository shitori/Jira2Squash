const USERNAME = process.env.SQUASH_USERNAME
const PASSWORD = process.env.PROXY_PASSWORD

const SquashHeader = {
    headers: {
        Authorization:
            'Basic ' +
            Buffer.from(USERNAME + ':' + PASSWORD).toString('base64'),
    },
}

module.exports = SquashHeader
