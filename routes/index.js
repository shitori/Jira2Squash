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

router.get('/game', (req, res) => {
    console.log(req.query);
    let max = req.query.max
    let array = []
    for (let i = 0; i < max; i++) {
        array[i] = []
        for (let j = 0; j < max * 2; j++) {

            array[i][j] = getRandomInt(101) > req.query.life
        }
    }
    // => U
    array[max / 2][max] = true
    //array[0][1] = true
    array[max / 2][max + 2] = true
    array[max / 2 + 1][max] = true
    //array[1][1] = true
    array[max / 2 + 1][max + 2] = true
    array[max / 2 + 2][max] = true
    array[max / 2 + 2][max + 1] = true
    array[max / 2 + 2][max + 2] = true
    res.render("gameOfLife", { array, max })
})

module.exports = router;
