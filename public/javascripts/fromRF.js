function showLoadingRf2Sq() {
    var form = document.getElementById('rf2squash')
    form.style.display = 'none'
    var loading = document.getElementById('loading_rf2sq')
    loading.style.display = 'block'
}

function hideLoadingRf2Sq() {
    var form = document.getElementById('rf2squash')
    form.style.display = 'block'
    var loading = document.getElementById('loading_rf2sq')
    loading.style.display = 'none'
    var result = document.getElementById('result_rf2sq')
    result.style.display = 'none'

    let h3 = document.getElementById('ws_return_rf2sq')
    let progressBar = document.getElementById('progress_bar_rf2sq')

    h3.textContent = 'DEFAULT_MESSAGE_NI'
    progressBar.setAttribute('style', 'width: 0%')
}

function showResultRf2Sq() {
    var form = document.getElementById('rf2squash')
    form.style.display = 'none'
    var loading = document.getElementById('loading_rf2sq')
    loading.style.display = 'none'
    var result = document.getElementById('result_rf2sq')
    result.style.display = 'block'
}

var webSocketRf2Sq = new WebSocket('ws://localhost:3002/', 'test-protocol')
webSocketRf2Sq.onmessage = (event) => {
    console.log(event)
    if (event.data instanceof Blob) {
        event.data.text().then((txt) => {
            console.log(txt)
            let data = JSON.parse(txt)
            let message = data.message
            let percent = data.percent
            let cible = data.cible
            if (cible == 'fromRF') {
                let h3 = document.getElementById('ws_return_rf2sq')
                let progressBar = document.getElementById('progress_bar_rf2sq')

                h3.textContent = message
                progressBar.setAttribute('style', 'width: ' + percent + '%')
            }
        })
    } else {
        console.log('Result: ' + event.data)
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function callApiRf2SqOld() {
    fetch('/api/oldResult', {
        method: 'GET',
    })
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
            h2.textContent =
                "Erreur lors de la récupération de l'ancien transfert de Robot Framework vers Squash"
        })
}

function callApiRf2Sq() {
    let data = new FormData()
    data.append('inputSessionTokenSquash', undefined)
    data.append(
        'inputSprint',
        document.querySelectorAll("[id='inputSprint']")[0].value
    )
    fetch('/api/rf2squashnofile', {
        method: 'POST',
        body: data,
    })
        .then((res) => {
            return res.json()
        })
        .then(async (res) => {
            console.log('data api: ')
            console.log(res)
            if (res.type == 'error') {
                console.log("une erreur s'est produite")
                showResultRf2Sq()
                let contantCard = document.getElementById('result_rf2sq_detail')
                contantCard.innerHTML = res.moreInfo
                let h2 = document.getElementById('result_rf2sq_title')
                h2.textContent = res.message
            } else {
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
                    res.message +
                    ', ' +
                    success +
                    ' success et ' +
                    fail +
                    ' fails'
            }
        })
        .catch((err) => {
            console.error(err)
            showResultRf2Sq()
            let contantCard = document.getElementById('result_rf2sq_detail')
            contantCard.innerHTML = '<pre>' + err + '</pre>'
            let h2 = document.getElementById('result_rf2sq_title')
            h2.textContent =
                'Erreur lors du transfert de Robot Framework vers Squash'
        })
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
