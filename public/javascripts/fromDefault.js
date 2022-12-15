function test() {
    console.log('in test')
}

function showLoadingDefault(formFormApiName, loadingName, resultName) {
    let form = document.getElementById(formFormApiName)
    form.style.display = 'none'
    let loading = document.getElementById(loadingName)
    loading.style.display = 'block'
    let result = document.getElementById(resultName)
    result.style.display = 'none'
}

function hideLoadingDefault(
    formFormApiName,
    loadingName,
    resultName,
    ws_returnName,
    progress_barName
) {
    let form = document.getElementById(formFormApiName)
    form.style.display = 'block'
    let loading = document.getElementById(loadingName)
    loading.style.display = 'none'
    let result = document.getElementById(resultName)
    result.style.display = 'none'

    let h3 = document.getElementById(ws_returnName)
    let progressBar = document.getElementById(progress_barName)

    h3.textContent = 'DEFAULT_MESSAGE_NI'
    progressBar.setAttribute('style', 'width: 0%')
}

function showResultDefault(formFormApiName, loadingName, resultName) {
    let form = document.getElementById(formFormApiName)
    form.style.display = 'none'
    let loading = document.getElementById(loadingName)
    loading.style.display = 'none'
    let result = document.getElementById(resultName)
    result.style.display = 'block'
}

function updateProgressBarFromWS(
    event,
    cibleName,
    ws_returnName,
    progress_barName
) {
    console.log(event)
    if (event.data instanceof Blob) {
        event.data.text().then((txt) => {
            console.log(txt)
            let data = JSON.parse(txt)
            let message = data.message
            let percent = data.percent
            let cible = data.cible
            if (cible == cibleName) {
                let h3 = document.getElementById(ws_returnName)
                let progressBar = document.getElementById(progress_barName)

                h3.textContent = message
                progressBar.setAttribute('style', 'width: ' + percent + '%')
            }
        })
    } else {
        console.log('Result: ' + event.data)
    }
}
