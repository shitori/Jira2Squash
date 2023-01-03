var maker = require('../models/Service/MakerService')
require('./ws')

var req = {
    body: {
        inputSprint: '',
    },
}
maker
    .setSquashCampagneFromJsonResult(req)
    .then((result) => {
        let moreInfo = ''
        result.forEach((element) => {
            moreInfo += element.message + '\n'
        })
        console.info({
            message: 'Squash mise à jour',
            moreInfo: moreInfo,
            result: result,
            type: 'success',
        })
    })
    .catch((err) => {
        console.error(err)
        console.error({
            message:
                "Une erreur s'est produit pendant la mise à jour de Squash par RobotFramework",

            moreInfo: JSON.stringify(err, null, 4),
            type: 'error',
        })
    })
