var axios = require('axios')

var config = {
    method: 'get',
    url: 'https://testmanagement.factory.orange-business.com/squash/api/rest/latest/campaign-folders/9467/content?page=0&size=200000',
    headers: {
        Cookie: 'JSESSIONID=60652F85E2FCDB260A1D25A0D066AF11; squashtm=1669888936.703.384.781453|6ba93009e73e9a820d383c9666d4945c',
    },
}

axios(config)
    .then(function (response) {
        console.info(JSON.stringify(response.data))
    })
    .catch(function (error) {
        console.info(error)
    })
