

function getCurrentStatutV2() {
    let array = []
    for (let i = 0; i < max; i++) {
        array[i] = []
        for (let j = 0; j < max * 2; j++) {
            let formule1d = max * 2 * i + j


            var cellElementClassList = document.getElementById(formule1d).classList
            if (cellElementClassList.contains('bg-primary')) {
                array[i][j] = 1
            } else if (cellElementClassList.contains('bg-secondary')) {
                array[i][j] = 2
            } else if (cellElementClassList.contains('bg-success')) {
                array[i][j] = 3
            } else if (cellElementClassList.contains('bg-danger')) {
                array[i][j] = 4
            } else if (cellElementClassList.contains('bg-warning')) {
                array[i][j] = 5
            } else if (cellElementClassList.contains('bg-info')) {
                array[i][j] = 6
            } else if (cellElementClassList.contains('bg-dark')) {
                array[i][j] = 7
            } else if (cellElementClassList.contains('bg-light')) {
                array[i][j] = 0
            } else { }

        }
    }
    return array
}

function setColor(cell, nb) {
    purgeCell(cell)
    cell.dataset.life = 0
    switch (nb) {
        case 0: //Morte 
            cell.classList.add('bg-light')
            break;
        case 1: //Eau 
            cell.classList.add('bg-primary')
            break;
        case 2: //Montage 
            cell.classList.add('bg-secondary')

            break;
        case 3: //Forêt
            cell.classList.add('bg-success')
            break;
        case 4: //Danger
            cell.classList.add('bg-danger')
            break;
        case 5: //Sable
            cell.classList.add('bg-warning')
            break;
        case 6: //Glace
            cell.classList.add('bg-info')
            break;
        case 7: //Civ 1
            cell.classList.add('bg-dark')
            break;

        default:
            console.error("Impossible :" + cell + " / nb : " + nb);
            break;
    }
}

function purgeCell(cell) {
    cell.classList.remove('bg-primary')
    cell.classList.remove('bg-secondary')
    cell.classList.remove('bg-success')
    cell.classList.remove('bg-danger')
    cell.classList.remove('bg-warning')
    cell.classList.remove('bg-info')
    cell.classList.remove('bg-dark')
    cell.classList.remove('bg-light')
}

function getRandomInt(max) {


    return Math.floor(Math.random() * max);
}

function applyMouvementV2(array) {

    for (let i = 0; i < max; i++) {
        for (let j = 0; j < max * 2; j++) {


            let iNext = (i + 1 == max ? max - 1 : i + 1)
            let iPrec = (i - 1 == -1 ? 0 : i - 1)
            let jNext = (j + 1 == max * 2 ? max * 2 - 1 : j + 1)
            let jPrec = (j - 1 == -1 ? 0 : j - 1)

            let currentCell = array[i][j]
            let cellFriends = [
                array[iNext][jPrec],
                array[iNext][j],
                array[iNext][jNext],
                array[iPrec][jPrec],
                array[iPrec][j],
                array[iPrec][jNext],
                array[i][jNext],
                array[i][jPrec]
            ]

            let formule1d = max * 2 * i + j

            let formule1dFriend = [
                max * 2 * iNext + jPrec,
                max * 2 * iNext + j,
                max * 2 * iNext + jNext,
                max * 2 * iPrec + jPrec,
                max * 2 * iPrec + j,
                max * 2 * iPrec + jNext,
                max * 2 * i + jPrec,
                max * 2 * i + jNext
            ]

            var friendAlive = cellFriends.filter(cf => cf > 0).length
            var friendArray = []
            for (let index = 0; index < 8; index++) {
                friendArray[index] = cellFriends.filter(cf => cf == index).length
            }

            var cellElement = document.getElementById(formule1d)
            cellElement.dataset.life = 1 + parseInt(cellElement.dataset.life)
            switch (currentCell) {
                case 0: //Morte ==> si voisin danger alors danger alors si alive > 3 alors  sinon le plus grand nombre type de voisin sinon reste morte
                    if (friendAlive > 3) {
                        if (friendArray[4] > 2) {
                            if (getRandomInt(101) < (friendArray[4] * 10)) {
                                setColor(cellElement, 4)
                            }
                        } else {
                            friendArray.shift()
                            setColor(cellElement, friendArray.indexOf(Math.max(...friendArray)))
                        }
                    } else {
                        // still death
                    }
                    break;
                case 1: //Eau 
                    //si age>100 alors % bloc d'eau + calamité centre 
                    if (cellElement.dataset.life > oldCell) {
                        if (getRandomInt(101) < oldCell) {
                            setColor(cellElement, 4)
                            formule1dFriend.forEach(f1d => {
                                if (getRandomInt(3) < 2) {
                                    var cellFriendEl = document.getElementById(f1d)
                                    setColor(cellFriendEl, 1)
                                }
                            })
                        }
                    } else {
                        //si voisinEau > 6 alors si > 8 alors % de calamité sinon glace
                        if (friendArray[1] > 6) {
                            if (friendArray[1] > 8 && getRandomInt(3) < 2) {
                                setColor(cellElement, 4)
                            } else {
                                setColor(cellElement, 6)
                            }

                        }
                    }

                    break;
                case 2: //Montage 
                    // si age>100 alors % bloc montage 2/3 + 1/3 danger + vide centre 
                    // si eau alors random foret
                    // si montagne alors rien 
                    // si forêt alors rien
                    // si danger > 2 alors  % bloc montage 2/3 + 1/3 danger + vide centre
                    // si sable > montagne alors age + 2
                    // si glace > 4 alors age +3
                    // si civ alors age nb civ


                    break;
                case 3: //Forêt
                    //foret>glace alors voisinGlace=1/2Foret+1/2vide 
                    //si 1>eau>3 alors mort = foret

                    break;
                case 4: //Danger

                    break;
                case 5: //Sable

                    break;
                case 6: //Glace

                    break;
                case 7: //Civ 1

                    break;

                default:
                    console.error("Impossible :" + currentCell);
                    break;
            }
        }
    }
}