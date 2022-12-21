const squashUrl =
    'https://testmanagement.factory.orange-business.com/squash/test-case-workspace/test-case/detail/'
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
            let untest = 0
            result.forEach((element) => {
                if (element.status === 'FAILURE') {
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

            result.forEach((element) => {
                if (element.status === 'UNTESTABLE') {
                    untest++
                    createCard(contantCard, element)
                }
            })

            let h2 = document.getElementById('result_rf2sq_title')
            h2.innerHTML =
                res.message +
                '<br> <b class="text-danger">' +
                fail +
                '</b> en échecs , <b class="text-success">' +
                success +
                '</b> en succès et <b>' +
                untest +
                '</b> pas testables pour le moment.'
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
    //UNTESTABLE FAILURE SUCCESS
    let classCard = ''
    let logoTitle = ''
    switch (element.status) {
        case 'SUCCESS':
            classCard = 'card m-2 mx-auto bg-success bg-gradient'
            logoTitle = `✅ `
            break
        case 'FAILURE':
            classCard = 'card m-2 mx-auto bg-danger bg-gradient'
            logoTitle = '❌ '
            break
        case 'UNTESTABLE':
            classCard = 'card m-2 mx-auto bg-dark bg-gradient text-light'
            logoTitle = '❗ '
            break
        default:
            console.error('fail in createCard : ' + element)
    }
    let div = document.createElement('div')
    div.className = classCard
    div.style.width = '35rem'
    div.innerHTML =
        `
          <div class="card-body">
            <h5 class="card-title "> ` +
        logoTitle +
        element.testName +
        ` ` +
        ` </h5>
            <p class="card-text text-center"> Exécution n°` +
        element.id +
        `<br><a href="` +
        squashUrl +
        element.realId +
        `" class="btn btn-light" target="_blank">Voir le test</a> </p></div>`
    contantCard.appendChild(div)
}
