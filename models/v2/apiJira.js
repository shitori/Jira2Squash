const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const baseUrl = process.env.JIRA_BASE_URL


class apiJira {

    constructor(proxy) {
        this.proxy = proxy
    }

    getIssues(jql) {
       
        return new Promise((resolve, reject) => {
            axios.get(baseUrl + "search?jql=" + encodeURI(jql) + "&maxResults=10000", this.proxy)
                .then(res => {
                    console.log(`statusCode: ${res.status}`);
                    let compactIssues = []
                    res.data.issues.forEach(issue => {
                        let compactIssue = {}
                        compactIssue["idJira"] = issue.key
                        compactIssue["priority"] = issue.fields.priority.name
                        compactIssue["nameJira"] = issue.fields.summary
                        compactIssue["description"] = issue.fields.description
                        compactIssue["typeJira"] = issue.fields.issuetype.name
                        compactIssues.push(compactIssue)
                    });
                    resolve(compactIssues)
                }).catch(error => {
                    console.log("fail api jira, check JSEssion");
                    reject(error)
                });
        })
    }
}

module.exports =  apiJira 
