function showLoadingRf2Sq() {
    showLoadingDefault('rf2squash', 'loading_rf2sq', 'result_rf2sq')
}

function hideLoadingRf2Sq() {
    hideLoadingDefault(
        'rf2squash',
        'loading_rf2sq',
        'result_rf2sq',
        'ws_return_rf2sq',
        'progress_bar_rf2sq'
    )
}

function showResultRf2Sq() {
    showResultDefault('rf2squash', 'loading_rf2sq', 'result_rf2sq')
}

var webSocketRf2Sq = new WebSocket('ws://localhost:3002/', 'test-protocol')
webSocketRf2Sq.onmessage = (event) => {
    updateProgressBarFromWS(
        event,
        'fromRF',
        'ws_return_rf2sq',
        'progress_bar_rf2sq'
    )
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function callApiRf2SqOldDefault(url, option, errMessage) {
    fetch(url, option)
        .then((res) => {
            return res.json()
        })
        .then((res) => {
            showResultRf2Sq()

            let result = res.result
            let contantCard = document.getElementById('result_rf2sq_detail')
            contantCard.innerHTML = ''
            let success = 0
            let fail = 0
            result.forEach((element) => {
                if (element.status !== 'SUCCESS') {
                    fail++
                    createCard(contantCard, element)
                }
            })
            result.forEach((element) => {
                if (element.status === 'SUCCESS') {
                    success++
                    createCard(contantCard, element)
                }
            })

            var h2 = document.getElementById('result_rf2sq_title')
            h2.textContent =
                res.message + ', ' + success + ' success et ' + fail + ' fails'
        })
        .catch((err) => {
            console.error(err)
            showResultRf2Sq()
            let contantCard = document.getElementById('result_rf2sq_detail')
            contantCard.innerHTML = '<pre>' + err + '</pre>'
            let h2 = document.getElementById('result_rf2sq_title')
            h2.textContent = errMessage
        })
}

function callApiRf2SqOld() {
    callApiRf2SqOldDefault(
        '/api/oldResult',
        {
            method: 'GET',
        },
        "Erreur lors de la récupération de l'ancien transfert de Robot Framework vers Squash"
    )
}

function callApiRf2Sq() {
    let data = new FormData()
    data.append('inputSessionTokenSquash', undefined)
    data.append(
        'inputSprint',
        document.querySelectorAll("[id='inputSprint']")[0].value
    )
    callApiRf2SqOldDefault(
        '/api/rf2squashnofile',
        {
            method: 'POST',
            body: data,
        },
        'Erreur lors du transfert de Robot Framework vers Squash'
    )
}

function createCard(contantCard, element) {
    let div = document.createElement('div')
    div.className =
        element.status == 'SUCCESS'
            ? 'card m-2 mx-auto bg-success bg-gradient'
            : 'card m-2 mx-auto bg-danger bg-gradient'
    div.style.width = '35rem'
    div.innerHTML =
        `
          <div class="card-body">
            <h5 class="card-title "> ` +
        (element.status == 'SUCCESS' ? `✅ ` : `❌ `) +
        element.testName +
        ` ` +
        ` </h5>
            <p class="card-text text-center">ID test : ` +
        element.realId +
        ` / ID execution : ` +
        element.id +
        `</p>
          </div>
        `
    contantCard.appendChild(div)
}
