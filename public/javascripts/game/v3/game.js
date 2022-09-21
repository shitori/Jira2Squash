class CelluleType {
    constructor(name, order, color) {
        this.name = name
        this.order = order
        this.color = color
    }
}

class Cellule {
    constructor(x, y, order) {
        this.x = x
        this.y = y
        this.age = 0
        this.celluleType = order;
    }
}

const celluleTypes = [
    new CelluleType('VIDE', 0, 'white'),
    new CelluleType('EAU', 1, 'blue'),
    new CelluleType('MONTAGNE', 2, 'grey'),
    new CelluleType('FORET', 3, 'green'),
    new CelluleType('CAMLAMITE', 4, 'red'),
    new CelluleType('SABLE', 5, 'yellow'),
    new CelluleType('GLACE', 6, 'cyan'),
    new CelluleType('CIVILISATION', 7, 'black')
]

const cubeSize = 10;
const maxHauteur = 900
const maxLargeur = maxHauteur * 2

var cellules = []
var canvas
var ctx

function clearBoard() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, maxLargeur, maxHauteur);
}

function drawCells() {
    for (let i = 0; i < maxLargeur / cubeSize; i++) {
        for (let j = 0; j < maxHauteur / cubeSize; j++) {
            drawCellWithOrder(cellules[i][j].x, cellules[i][j].y, cellules[i][j].celluleType)
        }
    }
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cubeSize, cubeSize);
}

function drawCellWithName(x, y, name) {
    let color = celluleTypes.find(cell => cell.name == name).color
    drawCell(x, y, color)
}

function drawCellWithOrder(x, y, order) {
    let color = celluleTypes.find(cell => cell.order == order).color
    drawCell(x, y, color)
}

function initCells() {
    for (let i = 0; i < maxLargeur / cubeSize; i++) {
        cellules[i] = []
        for (let j = 0; j < maxHauteur / cubeSize; j++) {
            cellules[i][j] = new Cellule(i * cubeSize, j * cubeSize, getRandomInt(8))
        }
    }
}

function startGame() {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    clearBoard()
    initCells()
    drawCells()
}

function step() {
    var cellulesCopy = JSON.parse(JSON.stringify(cellules)) // deep copy
    console.info("in step");
    for (let i = 0; i < maxLargeur / cubeSize; i++) {
        for (let j = 0; j < maxHauteur / cubeSize; j++) {
            let currentCelluleColor = cellulesCopy[i][j].color
            let iNext = (i + 1 == maxHauteur ? maxHauteur - 1 : i + 1)
            let iPrec = (i - 1 == -1 ? 0 : i - 1)
            let jNext = (j + 1 == maxLargeur ? maxLargeur - 1 : j + 1)
            let jPrec = (j - 1 == -1 ? 0 : j - 1)
            let cellulesFriendsColor = [
                cellulesCopy[iNext][jPrec].color,
                cellulesCopy[iNext][j].color,
                cellulesCopy[iNext][jNext].color,
                cellulesCopy[iPrec][jPrec].color,
                cellulesCopy[iPrec][j].color,
                cellulesCopy[iPrec][jNext].color,
                cellulesCopy[i][jNext].color,
                cellulesCopy[i][jPrec].color
            ]
            
            let maxColorByIndex = []
            for (let index = 0; index < 8; index++) {
                maxColorByIndex[index] = cellulesFriendsColor.filter(el => el == index).length                
            }
            cellules[i][j].age++
            switch (currentCelluleColor) {
                case 0:

                    break;
                case 1:

                    break;
                case 2:

                    break;
                case 3:

                    break;
                case 4:

                    break;
                case 5:

                    break;
                case 6:

                    break;
                case 7:

                    break;
                default:
                    console.error("Cellule mutante");
                    break;
            }
        }
    }

}

