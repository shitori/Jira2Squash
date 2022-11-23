const request = require('supertest')
const app = require('./../app')
/*const fakeData = require('./fakeData.json')
const prompt = require('prompt-sync')()*/
const dotenv = require('dotenv')
dotenv.config()

const tokenJira = process.env.JIRA_TEST_TOKEN
const tokenSquash = process.env.SQUASH_TEST_TOKEN

var server

describe('Sample Test', () => {
    it('should test that true === true', () => {
        expect(true).toBe(true)
    })
})

describe('State router', () => {
    beforeAll((done) => {
        server = app.listen(done)
    })

    afterAll((done) => {
        server.close(done)
    })

    test('test API api/fromAPI', async () => {
        const res = await request(server)
            .post('/api/fromApi')
            .set('Accept', 'application/json')
            .send({
                inputSprint: 'jest test',
                inputSessionTokenJira: tokenJira,
                inputSessionTokenSquash: tokenSquash,
                inputJiraSprintRequest: '35330',
                validator: 'api',
            })
        expect(res.statusCode).toBe(200)
        expect(res.header['content-type']).toMatch(
            'application/json; charset=utf-8'
        )
        expect(res.body).toHaveProperty('from')
        expect(res.body).not.toHaveProperty('fileName')
        expect(res.body).toHaveProperty('message')
        expect(res.body).toHaveProperty('moreInfo')
    })
})
