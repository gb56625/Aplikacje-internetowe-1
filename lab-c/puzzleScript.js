const START_CENTER = [53.426, 14.540];

const GRID_SIZE = 4;
const TILE_PX = 120;


const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAttrib = '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const osmLayer = L.tileLayer(osmUrl, {
    maxZoom: 18,
    attribution: osmAttrib
});


const map = new L.Map('map', {
    layers: [osmLayer],
    center: new L.LatLng(START_CENTER[0], START_CENTER[1]),
    zoom: 14
});


(function initNotifications() {
    if (!('Notification' in window)) {
        console.log('Przeglądarka nie obsługuje powiadomień.');
        return;
    }

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Zgoda na powiadomienia:', permission);
        });
    } else {
        console.log('Aktualny status powiadomień:', Notification.permission);
    }
})();


function showVictoryNotification() {
    const message = 'Udało ci się ułożyć puzzle!';

    if (!('Notification' in window)) {
        alert(message);
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification('Gratulacje!', {
            body: message
        });
        return;
    }

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Gratulacje!', { body: message });
            } else {
                alert(message);
            }
        });
        return;
    }

    if (Notification.permission === 'denied') {
        alert(message);
    }
}

function showPuzzleOverlay() {
    const puzzle = document.getElementById('puzzle');
    if (!puzzle) return;

    if (document.getElementById('puzzleOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'puzzleOverlay';
    overlay.className = 'puzzle-overlay';

    const text = document.createElement('span');
    text.textContent = 'Gratulacje!';

    overlay.appendChild(text);
    puzzle.appendChild(overlay);
}


function getLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError);
}

function handlePositionSuccess(pos) {
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 18);
}

function handlePositionError(err) {
    let message;

    switch (err.code) {
        case err.PERMISSION_DENIED:
            message = 'Użytkownik odmówił udostępnienia lokalizacji.';
            break;
        case err.POSITION_UNAVAILABLE:
            message = 'Informacja o lokalizacji jest niedostępna.';
            break;
        case err.TIMEOUT:
            message = 'Przekroczono limit czasu na pobranie lokalizacji.';
            break;
        default:
            message = 'Wystąpił nieznany błąd lokalizacji.';
    }

    if (usrLoc) {
        usrLoc.textContent = message;
    } else {
        console.warn(message);
    }
}


function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const randIndex = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[randIndex]] = [arr[randIndex], arr[i]];
    }
}


function captureMap() {
    leafletImage(map, (error, canvasFromMap) => {
        if (error) {
            console.error(error);
            return;
        }

        canvasFromMap.id = "debugCanvas";
        canvasFromMap.style.position = "absolute";
        canvasFromMap.style.left = "-9999px"; 
        canvasFromMap.style.top = "0";
        canvasFromMap.style.opacity = "0";
        canvasFromMap.style.pointerEvents = "none";
        document.body.appendChild(canvasFromMap);

        const pieceW = canvasFromMap.width / GRID_SIZE;
        const pieceH = canvasFromMap.height / GRID_SIZE;

        const puzzleContainer = document.getElementById('puzzle');
        const elementsContainer = document.getElementById('elements');

        if (!puzzleContainer || !elementsContainer) return;

        puzzleContainer.innerHTML = '';
        elementsContainer.innerHTML = '';

        const existingOverlay = document.getElementById('puzzleOverlay');
        if (existingOverlay) existingOverlay.remove();

        const piecesArray = [];

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const slot = document.createElement('div');
                slot.className = 'placeholder';
                slot.id = `placeholder-${row}-${col}`;
                slot.style.width = `${TILE_PX}px`;
                slot.style.height = `${TILE_PX}px`;

                slot.addEventListener('dragover', ev => {
                    ev.preventDefault();
                    slot.classList.add('dragover');
                });

                slot.addEventListener('dragleave', () => {
                    slot.classList.remove('dragover');
                });

                slot.addEventListener('drop', ev => {
                    ev.preventDefault();
                    slot.classList.remove('dragover');
                });

                puzzleContainer.appendChild(slot);

                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceW;
                pieceCanvas.height = pieceH;

                const ctx = pieceCanvas.getContext('2d');
                ctx.drawImage(
                    canvasFromMap,
                    col * pieceW,
                    row * pieceH,
                    pieceW,
                    pieceH,
                    0,
                    0,
                    pieceW,
                    pieceH
                );

                const pieceImg = document.createElement('img');
                pieceImg.className = 'piece';
                pieceImg.id = `piece-${row}-${col}`;
                pieceImg.src = pieceCanvas.toDataURL();
                pieceImg.draggable = true;
                pieceImg.style.width = `${TILE_PX}px`;
                pieceImg.style.height = `${TILE_PX}px`;

                pieceImg.ondragstart = drag;
                pieceImg.ondragend = puzzleCheck;

                piecesArray.push(pieceImg);
            }
        }

        shuffleArray(piecesArray);
        piecesArray.forEach(piece => elementsContainer.appendChild(piece));
    });
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData('text/plain', ev.target.id);
}

function drop(ev) {
    ev.preventDefault();

    const draggedId = ev.dataTransfer.getData('text/plain');
    const dragged = document.getElementById(draggedId);
    const target = ev.target;

    if (!dragged || !target) return;

    if (target.classList.contains('placeholder') || target.id === 'elements') {
        target.appendChild(dragged);
    }

    if (target.classList.contains('piece')) {
        swapPieces(dragged, target);
    }
}

function swapPieces(pieceA, pieceB) {
    const parentA = pieceA.parentNode;
    const parentB = pieceB.parentNode;

    if (!parentA || !parentB) return;

    const nextA = pieceA.nextSibling;
    const nextB = pieceB.nextSibling;

    parentA.insertBefore(pieceB, nextA);
    parentB.insertBefore(pieceA, nextB);
}

function puzzleCheck() {
    const elementsContainer = document.getElementById('elements');
    if (!elementsContainer) return;

    console.log('--- START SPRAWDZANIA UKŁADU PUZZLI ---');

    if (elementsContainer.innerHTML.trim() !== '') {
        console.log('Nie wszystkie puzzle zostały przeniesione na planszę – sprawdzanie przerwane.');
        console.log('--- KONIEC SPRAWDZANIA: NIEUKOŃCZONE ---');
        return;
    }

    let allOk = true;

    outerLoop:
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const slotId = `placeholder-${row}-${col}`;
            const expectedPieceId = `piece-${row}-${col}`;

            const slot = document.getElementById(slotId);
            if (!slot) {
                console.log(`Brak placeholdera: ${slotId}`);
                allOk = false;
                break outerLoop;
            }

            const placedPiece = slot.firstElementChild;
            const placedId = placedPiece ? placedPiece.id : 'BRAK';

            console.log(
                `Sprawdzam ${slotId}: oczekiwano ${expectedPieceId}, znaleziono ${placedId}`
            );

            if (!placedPiece || placedPiece.id !== expectedPieceId) {
                console.log(`BŁĄD: w ${slotId} powinien być ${expectedPieceId}`);
                allOk = false;
                break outerLoop;
            }
        }
    }

    if (allOk) {
        console.log('Wszystkie puzzle są na właściwych miejscach – układ poprawny');
        console.log('--- KONIEC SPRAWDZANIA: OK ---');
        showVictoryNotification();
        showPuzzleOverlay();
    } else {
        console.log('Układ puzzli jest niepoprawny.');
        console.log('--- KONIEC SPRAWDZANIA: BŁĘDNY UKŁAD ---');
    }
}
