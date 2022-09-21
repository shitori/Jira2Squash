var maker = require('../models/maker')
const squashFoldersCampgne = require('../models/exigenceFolders.json')

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    fromAPI: (req, res) => {
        maker.fromAPI(req)
            .then(dataQuery => { res.json(dataQuery) })
            .catch(err => { res.json(err) })
    },

    fromFile: (req, res) => {
        maker.fromFile(req)
            .then(localPathFile => res.json({ "localPathFile": localPathFile }))
            .catch(err => res.json({ "message": "fail make file :" + err }))
    },

    foldersTest: (req, res) => {
        
        maker.primaryTest(req, squashFoldersCampgne)
            .then(response => res.json({ "data": response }))
            .catch(error => res.json({ "data": error }))


    }
}