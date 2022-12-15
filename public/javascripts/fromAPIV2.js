var webSocket = new WebSocket('ws://localhost:3002/', 'test-protocol')
webSocket.onmessage = (event) => {
    updateProgressBarFromWS(event, 'fromAPI', 'ws_return', 'progress_bar')
}

function showLoading() {
    showLoadingDefault('formFormApi', 'loading', 'result')
}

function hideLoading() {
    hideLoadingDefault(
        'formFormApi',
        'loading',
        'result',
        'ws_return',
        'progress_bar'
    )
}

function showResult() {
    showResultDefault('formFormApi', 'loading', 'result')
}

function updateSprintFolderName(value) {
    document.getElementById('inputSprint').value = value
}

function callApi() {
    let payload = {
        inputSprintJira: document.getElementById('inputSprintJira').value,
        inputSprint: document.getElementById('inputSprint').value,
        inputSessionTokenJira: document.getElementById('inputSessionTokenJira')
            .value,
        inputSessionTokenSquash: undefined,
        inputSessionTokenSquashBis: undefined,
        validator: 'api',
    }

    let data = new FormData()
    Object.entries(payload).forEach((el) => {
        data.append(el[0], el[1])
    })

    fetch('/api/fromApi', {
        method: 'POST',
        body: data,
    })
        .then(async (res) => {
            return res.json()
        })
        .then((res) => {
            printResult(res)
        })
        .catch((err) => {
            console.log("une erreur s'est produite")
            console.error(err)
            let res = {
                message: "Une erreur s'est produite sur l'api",
                moreInfo: err,
            }
            printResult(res)
        })
}

function printResult(res) {
    console.log('data api: ')
    console.log(res)
    showResult()
    let pre = document.getElementById('result_info')
    pre.textContent = res.moreInfo
    let h2 = document.getElementById('result_title')
    h2.textContent = res.message
}
