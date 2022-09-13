var express = require('express');
var router = express.Router();

const controller = require("../controllers/defaultController")

/* GET home page. */
router.get('/', controller.home);

router.get("/test", controller.test)

router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

router.post('/file', controller.getFile)

function getRandomInt(max) {


    return Math.floor(Math.random() * max);
}


module.exports = router;
