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

            switch (currentCell) {
                case 0: //Morte ==> prend vie si voisin danger alors danger alors si alive > 3 alors  sinon le plus grand nombre type de voisin sinon reste morte

                    break;
                case 1: //Eau ==> si age>100 alors % bloc d'eau + calamité centre 
                        //si voisinEau > 6 alors si > 8 alors % de calamité sinon glace

                    break;
                case 2: //Montage si age>100 alors % bloc montage 2/3 + 1/3 danger + vide centre 
                        //si eau alors foret
                        // si danger > 2 alors  % bloc montage 2/3 + 1/3 danger + vide centre
                        // si sable > montagne alors age + 5
                        // si glace > 4 alors age +10
                        

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




            /*if (currentCell) {
                if (friendAlive == 3 || friendAlive == 2) { //still alive
                    cellElement.classList.remove('bg-danger')
                    cellElement.classList.add('bg-dark')

                    cellElement.dataset.life = 1 + parseInt(cellElement.dataset.life)
                } else { //death
                    cellElement.classList.remove('bg-danger')
                    cellElement.classList.remove('bg-dark') // main rule

                    cellElement.dataset.life = 0
                }

                if (cellElement.dataset.life > 100) { // new rule : migration
                    cellElement.classList.remove('bg-danger')
                    cellElement.classList.remove('bg-dark')

                    cellElement.dataset.life = 0

                    formule1dFriend.forEach(formule => {
                        var cellFriendEl = document.getElementById(formule)
                        cellFriendEl.classList.add('bg-danger')

                        cellFriendEl.dataset.life = 1
                    })

                }


            } else {
                if (friendAlive == 3) { // alive
                    cellElement.classList.add('bg-danger') // main rule

                    cellElement.dataset.life = 1
                }
            }*/
        }
    }
}