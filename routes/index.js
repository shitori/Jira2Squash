var express = require('express');
var router = express.Router();

const controller = require("./../controllers/controller")

/* GET home page. */
router.get('/', controller.home);

router.get("/test", controller.test)

router.post('/fromFile', controller.fromFile)

router.post('/fromAPI', controller.fromAPI)

module.exports = router;
