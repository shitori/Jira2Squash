function getCurrentStatut() {
    let array = []
    for (let i = 0; i < max; i++) {
        array[i] = []
        for (let j = 0; j < max * 2; j++) {
            let formule1d = max * 2 * i + j

            var cellElement = document.getElementById(formule1d)

            array[i][j] = cellElement.classList.contains('bg-dark')
                || cellElement.classList.contains('bg-danger')
        }
    }
    return array
}



function applyMouvement(array) {

    for (let i = 0; i < max; i++) {
        for (let j = 0; j < max * 2; j++) {
            let currentCell = array[i][j]

            let iNext = (i + 1 == max ? max - 1 : i + 1)
            let iPrec = (i - 1 == -1 ? 0 : i - 1)
            let jNext = (j + 1 == max * 2 ? max * 2 - 1 : j + 1)
            let jPrec = (j - 1 == -1 ? 0 : j - 1)
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

            var friendAlive = cellFriends.filter(cf => cf == true).length
            var cellElement = document.getElementById(formule1d)
            if (currentCell) {
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
            }
        }
    }
}