var express = require('express');
var router = express.Router();

const controller = require("../controllers/apiController")

router.post('/test', (req, res) => {
    res.json({ message: "test", body: req.body })
})

router.post("/fromFile", controller.fromFile)

router.post("/fromApi", controller.fromAPI)

module.exports = router