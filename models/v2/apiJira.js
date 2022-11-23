const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()
const baseUrl = process.env.JIRA_BASE_URL

const urlSuggestion = "https://jira-build.orangeapplicationsforbusiness.com/rest/greenhopper/1.0/sprint/picker?excludeCompleted=false&query=sprint+"

class apiJira {
    constructor(proxy) {
        this.proxy = proxy
    }

    getSprintID(sprintName) {
        return new Promise((resolve, reject) => {
            axios.get(urlSuggestion + sprintName, this.proxy)
                .then(res => {
                    resolve(res.data.suggestions[0].id)
                }).catch(err => {
                    reject(err)
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
                .catch((error) => {
                    //console.error("fail api jira, check JSession");
                    reject(error)
                })
        })
    }
}

module.exports = apiJira
