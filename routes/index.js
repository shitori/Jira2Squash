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
    let max = 100
    let array = []
    for (let i = 0; i < max; i++) {
        array[i] = []
        for (let j = 0; j < max * 2; j++) {
            
            array[i][j] = getRandomInt(5)>0
        }
    }
    // => U
    array[50][100] = true
    //array[0][1] = true
    array[50][102] = true
    array[51][100] = true
    //array[1][1] = true
    array[51][102] = true
    array[52][100] = true
    array[52][101] = true
    array[52][102] = true
    res.render("gameOfLife", { array, max })
})

module.exports = router;
