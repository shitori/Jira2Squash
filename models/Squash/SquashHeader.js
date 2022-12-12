const USERNAME = process.env.SQUASH_USERNAME
const PASSWORD = process.env.PROXY_PASSWORD

const headerSquash = {
    headers: {
        Authorization:
            'Basic ' +
            Buffer.from(USERNAME + ':' + PASSWORD).toString('base64'),
    },
}

module.exports = headerSquash
