const axios = require('axios')

const dotenv = require('dotenv')
dotenv.config()

const baseUrl = process.env.JIRA_BASE_URL
const urlSuggestion =
    process.env.JIRA_SUGGESTION_URL +
    'sprint/picker?excludeCompleted=false&query=sprint+'

const urlAgile = process.env.JIRA_AGILE_URL + 'board/4572/sprint'

class JiraService {
    constructor(proxy) {
        this.proxy = proxy
    }

    getSprintID(sprintName) {
        return new Promise((resolve, reject) => {
            axios
                .get(urlSuggestion + sprintName, this.proxy)
                .then((res) => {
                    console.log('Sprint find')
                    resolve(res.data.suggestions[0].id)
                })
                .catch((err) => {
                    reject({ message: 'getOutputResultRobotFrameWork', err })
                })
        })
    }

    getIssues(jql) {
        return new Promise((resolve, reject) => {
            axios
                .get(
                    baseUrl +
                        'search?jql=' +
                        encodeURI(jql) +
                        '&maxResults=10000',
                    this.proxy
                )
                .then((res) => {
                    //console.info(`statusCode: ${res.status}`);
                    let compactIssues = []
                    res.data.issues.forEach((issue) => {
                        let compactIssue = {}
                        compactIssue['idJira'] = issue.key
                        compactIssue['priority'] = issue.fields.priority.name
                        compactIssue['nameJira'] = issue.fields.summary
                        compactIssue['description'] = issue.fields.description
                        compactIssue['typeJira'] = issue.fields.issuetype.name
                        compactIssues.push(compactIssue)
                    })
                    resolve(compactIssues)
                })
                .catch((err) => {
                    reject({ message: 'error in getIssues', err })
                })
        })
    }

    getAllSprintSprint() {
        return new Promise((resolve, reject) => {
            this._getAllSprintSprint(0, [])
                .then((res) => {
                    let finalResult = {}
                    res.forEach((el) => {
                        finalResult[el.name.substring(9, 6).trim()] = el.id
                    })
                    resolve(finalResult)
                })
                .catch((err) =>
                    reject({ message: 'error in getAllSprintSprint', err })
                )
        })
    }

    _getAllSprintSprint(index, lastResult) {
        return new Promise((resolve, reject) => {
            axios
                .get(
                    urlAgile + '?startAt=' + index + '&maxResults=50',
                    this.proxy
                )
                .then((res) => {
                    let data = res.data
                    lastResult = data.values.concat(lastResult)
                    if (data.isLast) {
                        resolve(lastResult)
                    } else {
                        resolve(
                            this._getAllSprintSprint(index + 50, lastResult)
                        )
                    }
                })
                .catch((err) => {
                    reject({ message: 'error in _getAllSprintSprint', err })
                })
        })
    }

    getAllAnoUnresolved() {
        return this.getIssues(
            'project = FCCNB AND issuetype = Bug AND resolution = Unresolved ORDER BY priority DESC, updated DESC'
        )
    }
}

module.exports = JiraService
