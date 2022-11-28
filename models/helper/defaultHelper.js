function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function checkInput(body) {
    body.inputWB = !(body.inputWB === undefined)
    body.inputSprint = _setEmptyField(body.inputSprint, 'undefined')
    body.inputSquash =
        'upload/' + _setEmptyField(body.inputSquash, 'dataForSquash') + '.xls'
    body.inputHeader = _setEmptyField(body.inputHeader, 4)
    body.inputFooter = _setEmptyField(body.inputFooter, 1)
    body.inputJiraRequest =
        body.inputJiraSprintRequest !== undefined &&
        body.inputJiraSprintRequest !== ''
            ? 'project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = ' +
              body.inputJiraSprintRequest +
              ' ORDER BY priority DESC, updated DESC'
            : body.inputJiraRequest

    return body
}

function _setEmptyField(field, defaultValue) {
    return field == '' ? defaultValue : field
}

function convertJiraType(jiraType) {
    switch (jiraType) {
        case 'Anomalie':
            return 'BUG'
        case 'Récit':
            return 'STORY'
        case 'Amélioration':
            return 'ENHANCEMENT'
        default:
            return ''
    }
}

function wordPower(list) {
    // incremente +1 par mot
    let wp = []
    list.forEach((str) => {
        str.split(' ').forEach((word) => {
            word = _removeUselessChar(word)
            let wordIsPresent = false
            wp.forEach((el) => {
                if (el.word == word) {
                    wordIsPresent = true
                    el.occurence++
                }
            })
            if (!wordIsPresent) {
                wp.push({ word: _removeUselessChar(word), occurence: 1 })
            }
        })
    })
    return wp
}

function _removeUselessChar(word) {
    return word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
}

function getOnlyNameFromObject(list) {
    let names = []
    list.forEach((el) => {
        names.push(el.name)
    })
    return names
}

module.exports = {
    checkInput,
    convertJiraType,
    getRandomInt,
    wordPower,
    getOnlyNameFromObject,
}
