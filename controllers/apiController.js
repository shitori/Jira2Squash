var maker = require('../models/maker')

const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    fromAPI: (req, res) => {
        maker
            .fromAPI(req)
            .then((dataQuery) => {
                res.json({
                    message: dataQuery.message,
                    from: dataQuery.from,
                    fileName: dataQuery.fileName,
                    moreInfo: dataQuery.moreInfo,
                })
            })
            .catch((err) => {
                res.json({
                    message:
                        "Une erreur s'est produit pendant la mise à jour de Squash par Jira",
                    moreInfo: err,
                    type: 'error',
                })
            })
    },

    fromFile: (req, res) => {
        maker
            .fromFile(req)
            .then((localPathFile) => res.json({ localPathFile: localPathFile }))
            .catch((err) => res.json({ message: 'fail make file :' + err }))
    },

    backup: (req, res) => {
        maker.backup(req).then((result) => res.json({ data: result }))
    },

    rf2squashnofile: (req, res) => {
        console.info(req.body)
        maker
            .setSquashCampagneFromJsonResult(req)
            .then((result) => {
                let moreInfo = ''
                result.forEach((element) => {
                    moreInfo += element.message + '\n'
                })
                res.json({
                    message: 'Squash mise à jour',
                    moreInfo: moreInfo,
                    result: result,
                    type: 'success',
                })
            })
            .catch((err) => {
                console.log(err)
                res.json({
                    message:
                        "Une erreur s'est produit pendant la mise à jour de Squash par RobotFramework",

                    moreInfo: JSON.stringify(err, null, 4),
                    type: 'error',
                })
            })
    },

    getOldResult: (req, res) => {
        let result = maker.getOldResult()
        let moreInfo = ''
        result.forEach((element) => {
            moreInfo += element.message + '\n'
        })
        res.json({
            message: 'Ancienne mise à jour Squash',
            moreInfo: moreInfo,
            result: result,
            type: 'success',
        })
    },

    getAllJiraSprint: (req, res) => {
        maker
            .getAllJiraSprint(req)
            .then((result) => res.json(result))
            .catch((err) => res.json(err))
    },
}
