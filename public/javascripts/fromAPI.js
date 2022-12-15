var webSocket = new WebSocket('ws://localhost:3002/', 'test-protocol')
webSocket.onmessage = (event) => {
    console.log(event)
    if (event.data instanceof Blob) {
        event.data.text().then((txt) => {
            console.log(txt)
            let data = JSON.parse(txt)
            let message = data.message
            let percent = data.percent
            let cible = data.cible
            if (cible == 'fromAPI') {
                let h3 = document.getElementById('ws_return')
                let progressBar = document.getElementById('progress_bar')

                h3.textContent = message
                progressBar.setAttribute('style', 'width: ' + percent + '%')
            }
        })
    } else {
        console.log('Result: ' + event.data)
    }
}

function showLoading() {
    let form = document.getElementById('formFormApi')
    form.style.display = 'none'
    let loading = document.getElementById('loading')
    loading.style.display = 'block'
    let result = document.getElementById('result')
    result.style.display = 'none'
}

function hideLoading() {
    let form = document.getElementById('formFormApi')
    form.style.display = 'block'
    let loading = document.getElementById('loading')
    loading.style.display = 'none'
    let result = document.getElementById('result')
    result.style.display = 'none'

    let h3 = document.getElementById('ws_return')
    let progressBar = document.getElementById('progress_bar')

    h3.textContent = 'DEFAULT_MESSAGE_NI'
    progressBar.setAttribute('style', 'width: 0%')
}

function showResult() {
    let form = document.getElementById('formFormApi')
    form.style.display = 'none'
    let loading = document.getElementById('loading')
    loading.style.display = 'none'
    let result = document.getElementById('result')
    result.style.display = 'block'
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
