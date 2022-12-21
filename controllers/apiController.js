var maker = require('../models/Service/MakerService')

const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    fromAPI: (req, res) => {
        maker
            .fromAPI(req)
            .then((dataQuery) => {
                res.status(200).json({
                    message: dataQuery.message,
                    from: dataQuery.from,
                    fileName: dataQuery.fileName,
                    moreInfo: dataQuery.moreInfo,
                })
            })
            .catch((err) => {
                res.status(404).json({
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
            .then((localPathFile) =>
                res.status(200).json({ localPathFile: localPathFile })
            )
            .catch((err) =>
                res.status(404).json({ message: 'fail make file :' + err })
            )
    },

    backup: (req, res) => {
        maker
            .backup(req)
            .then((result) => res.status(200).json({ data: result }))
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
                res.status(200).json({
                    message: 'Squash mise à jour',
                    moreInfo: moreInfo,
                    result: result,
                    type: 'success',
                })
            })
            .catch((err) => {
                console.error(err)
                res.status(404).json({
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
        res.status(200).json({
            message: 'Ancienne mise à jour Squash',
            moreInfo: moreInfo,
            result: result,
            type: 'success',
        })
    },

    getAllJiraSprint: (req, res) => {
        maker
            .getAllJiraSprint(req)
            .then((result) => res.status(200).json(result))
            .catch((err) => res.status(404).json(err))
    },

    getAllJiraAnoUnresolved: (req, res) => {
        maker
            .getAllAnoUnresolvedJira(req)
            .then((result) => {
                let csv = ''
                result.forEach((el) => {
                    csv += el.idJira + ';' + el.nameJira + ';\n'
                })
                console.info(csv)
                res.status(200).json(result)
            })
            .catch((err) => res.status(404).json(err))
    },

    getAllSquashTests: (req, res) => {
        maker
            .getAllSquashTests()
            .then((result) => {
                res.status(200).json(result)
            })
            .catch((err) => res.status(404).json(err))
    },

    diffuseCompaingBandeauTests: (req, res) => {
        maker
            .diffuseCompaingBandeauTestsSquash()
            .then((result) => {
                res.status(200).json(result)
            })
            .catch((err) => res.status(404).json(err))
    },
}
