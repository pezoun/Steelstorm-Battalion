import { Boundary, Sprite } from './classes.js';
import { handlePlayerMovement } from './playerMovement.js';
import { towerRotation } from './towerRotation.js';
import { collisions } from './collisionsArray.js';
import { bulletCollisions } from './bulletCollisionsArray.js';
import { drawHealthBar } from './healthBar.js';
import { startCooldown, updateCooldown, drawCooldown, updateAbilityDuration, drawAbilityIndicator} from './cooldown.js';
import { spawnCrates, collectCrates, startCrateRespawner, getSpawnedCrates } from './abilityCrates.js';
import { rectangularCollision} from './collisions.js';
import { checkTankCollisionWithCrates } from './crateCollisions.js';

// Připojení k WebSocket serveru
const socket = new WebSocket('ws://localhost:8080');

// Událost po připojení
socket.addEventListener('open', () => {
    console.log('Connected to the server.');
});

// Událost při příjmu zprávy
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'serverFull') {
        alert(data.message); // Zobraz zprávu uživateli
        socket.close(); // Zavři socket na klientské straně
    }
    
});


// Příjem zpráv ze serveruwwdadwd
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        player.id = data.id;
        console.log(`Player initialized with ID: ${player.id}`);
        
        // Projděte všechny hráče ze serveru
        data.players.forEach(otherPlayerData => {
            if (otherPlayerData.id === player.id) {
                // Inicializujte lokálního hráče
                player.health = otherPlayerData.health;
            } else {
                // Inicializujte protihráče
                player2.id = otherPlayerData.id;
              
                player2.health = otherPlayerData.health;
                console.log(`Opponent initialized with ID: ${player2.id}`);
            }
        });
    }
    if (data.type === 'newPlayer') {
        if (data.id !== player.id) {
            // Inicializujte protihráče
            player2.id = data.id;
            player2.position = { ...data.position };
            player2.health = data.health;
            console.log(`New opponent joined with ID: ${player2.id}`);
        }
    }

    if (data.type === 'playerDestroyed') {
        if (data.id === player2.id) {
            destroyTank(player, tower);
            console.log("Local player destroyed.");

        } else if (data.id === player.id) {
            destroyTank(player2, tower2);
            console.log("Opponent destroyed.");

        } else {
            console.warn(`Unknown player destroyed: ${data.id}`);
        }
    }

    if (data.type === 'updatePosition') {
        // Aktualizace pozice druhého hráče
        player2.position.x = data.position.x;
        player2.position.y = data.position.y;
        player2.rotation = data.position.rotation;
    }
    
    if (data.type === 'updateTower') {
        // Aktualizace rotace a pozice věže druhého hráče
        tower2.rotation = data.tower.rotation;
        tower2.position = data.tower.position;
    }
    
    if (data.type === 'updateHealth') {
        if (data.id === player2.id) {
            player.health = data.health; // Aktualizace zdraví druhého hráče
        } else if (data.id === player.id) {
            player2.health = data.health; // Aktualizace zdraví lokálního hráče
        }
    }

    if (data.type === 'updateCrate') {
        console.log(`Updating crate: (${data.position.x}, ${data.position.y}) -> ${data.state}`);
        bulletCollisionsMap[data.position.y][data.position.x] = data.state;

        // Pokud je krabice zničena, aktualizovat také hranice
        if (data.state === 0) {
            const crateBoundaryIndex = boundaries.findIndex(
                (boundary) =>
                    boundary.position.x === data.position.x * tileSize &&
                    boundary.position.y === data.position.y * tileSize &&
                    boundary.type === 'crate'
            );
            if (crateBoundaryIndex !== -1) {
                boundaries.splice(crateBoundaryIndex, 1);
                console.log(`Boundary removed for crate at (${data.position.x}, ${data.position.y})`);
            }
        }
    }

    if (data.type === 'playerDisconnected') {
        if (data.id === player2.id) {
            console.warn('Opponent disconnected.');
            player2.id = null; // Protihráč byl odpojen
        }
    }
});

// Funkce pro odesílání dat o pohybu hráče
export function sendMovementData() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'movement',
            id: player.id, // ID hráče
            position: {
                x: player.position.x,
                y: player.position.y,
                rotation: player.rotation,
            },
        }));
    }
}

// Funkce pro odesílání dat o rotaci věže
export function sendTowerData() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'towerUpdate',
            id: player.id, // ID hráče
            rotation: tower.rotation,
            position: {
                x: tower.position.x,
                y: tower.position.y,
            },
        }));
    }
}

export function sendHealthUpdate(health) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
            JSON.stringify({
                type: 'updateHealth',
                id: player.id, // ID hráče, který odesílá zprávu
                health: health, // Aktuální hodnota zdraví
            })
        );
    }
}

export function sendCrateUpdate(gridX, gridY, newState) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'updateCrate',
            position: { x: gridX, y: gridY },
            state: newState, // Nový stav krabice
        }));
    }
}

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const playerImage = new Image();
playerImage.src = '/images/Panzer_down.png';

const player2Image = new Image();
player2Image.src = '/images/Panzer_down_red.png';

const destroyedPlayerImage = new Image();
destroyedPlayerImage.src = '/images/Panzer_Broken2.png';

const panzerTowerImage = new Image();
panzerTowerImage.src = '/images/PanzerTower.png';

const panzerTower2Image = new Image();
panzerTower2Image.src = '/images/PanzerTower_red.png';

const destroyedTowerImage = new Image();
destroyedTowerImage.src = '/images/Panzer_BrokenTower.png';

const backgroundImage = new Image();
backgroundImage.src = '/images/Normandy.png';

const crateImage = new Image();
crateImage.src = `/images/crate.png`;

export const bulletImage = new Image();
bulletImage.src = '/images/bulletImage.png';

const damagedCrateImage = new Image();
damagedCrateImage.src = `/images/damagedcrate.png?${Date.now()}`;

export let scale = 1;

export const tileSize = 32;
const mapWidth = 44;
const collisionsMap = [];
for (let i = 0; i < collisions.length; i += mapWidth) {
    collisionsMap.push(collisions.slice(i, mapWidth + i));
}

let bulletBoundaries = [];
export let bulletCollisionsMap = [];
for (let i = 0; i < bulletCollisions.length; i += mapWidth) {
    bulletCollisionsMap.push(bulletCollisions.slice(i, mapWidth + i));
}


    bulletCollisionsMap.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 1555) {
                bulletBoundaries.push(new Boundary({
                    position: { x: j * tileSize * scale, y: i * tileSize * scale },
                    tileSize: tileSize * scale,
                    context: c
                }));
            }
        });
    });

export let boundaries = [];
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1441) {
            boundaries.push(new Boundary({
                position: { x: j * tileSize * scale, y: i * tileSize * scale },
                tileSize: tileSize * scale,
                context: c
            }));
        }
    });
});

// definování pozadí//
const background = new Sprite({
    position: { x: 0, y: 0 },
    image: backgroundImage,
    width: canvas.width,
    height: canvas.height,
    context: c
});
//definování hráčů 1 a 2//
export const player = new Sprite({
    position: {
        x : canvas.width / 2 - 197/ 2 - 300 * scale,
        y : canvas.height / 2 - 68 / 2 - 10 * scale,
    },
    image: playerImage,
    width :197 * scale,
    height : 68 * scale,
    frames: { max: 4 },
    context: c,
    hitbox : {
        width: (197 / 4) * scale,
        height: 55 * scale,
        offsetX: (197 / 2.7) * scale,
        offsetY: 5 * scale,
    },
    speed: 1,
    health: 100,
    speedMultiplier:1,
    bulletDamageMultiplier: 1,
    isDestroyed: false
});

export const player2 = new Sprite({
    position: {
        x: canvas.width / 2 -197 / 2 + 300 * scale, // Druhý hráč na jiném místě
        y: canvas.height / 2 - 68 / 2 - 10 * scale
    },
    image: player2Image, // Pokud má druhý hráč jiný vzhled, použij jiný obrázek
    width: 197 * scale,  
    height: 68 * scale,   
    frames: { max: 4 },
    context: c,
    hitbox: {
        width: 73 * scale,  
        height: 68 * scale,   
        offsetX: 62 * scale,  
        offsetY: 0 * scale
    },
    health: 100, 
    speedMultiplier:1,
    bulletDamageMultiplier: 1,// Zdraví pro druhého hráče
    isDestroyed: false
});
//definovaní věží 1 a 2
export const tower = new Sprite({
    position: {
        x: player.position.x + (player.width / 2) - (42 * scale) / 2, // Šířka věže / 2
        y: player.position.y - 20 * scale // Offset věže
    },
    image: panzerTowerImage,
    width: 42 * scale,
    height: 90 * scale,
    context: c,
    rotationOffsetX: 0,
    rotationOffsetY: -20 * scale
});

export const tower2 = new Sprite({
    position: {
        x: player2.position.x + 77 * scale,
        y: player2.position.y + 9 * scale
    },
    image: panzerTower2Image,
    width: 42 * scale,
    height: 90 * scale,
    context: c,
    rotationOffsetX: 0,
    rotationOffsetY: -20 * scale
});



document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
    
});


canvas.addEventListener('click', (_event) => {
    createBullet(player, tower);
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        createBullet(player, tower);
    }
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    cursorPosition.x = event.clientX - rect.left;
    cursorPosition.y = event.clientY - rect.top;
});

let cursorPosition = { x: 0, y: 0 };
const keys = { w: false, a: false, s: false, d: false };
export let speed = 1; // Výchozí rychlost hráče
export function setSpeed(newSpeed) {
    speed = newSpeed;
}

export const bullets = [];
let canShoot = true;
const shootCooldown = 2;

// Funkce pro vytvoření střely
export function createBullet(player, tower) {
    if (!canShoot || player.isDestroyed) return;

    const angle = tower.rotation + Math.PI / 2;
    const turretLength = (tower.height / 2) * scale;
    const bulletX = player.position.x + (player.width / 2) + Math.cos(angle) * turretLength;
    const bulletY = player.position.y + (player.height / 2) + Math.sin(angle) * turretLength;

    const bullet = {
        x: bulletX,
        y: bulletY,
        angle: angle,
        speed: 20 * (player.speedMultiplier || 1) * scale,
        damage: 20 * (player.bulletDamageMultiplier || 1),
        image: bulletImage,
        shooter: player // Přidání informace o střelci
    };
    bullets.push(bullet);

    canShoot = false;
    startCooldown(shootCooldown); // Spustí cooldown
    setTimeout(() => (canShoot = true), shootCooldown * 1000);
}
function drawCrates() {
    // Vykreslíme krabice ze stávající mapy kolizí
    bulletCollisionsMap.forEach((row, i) => {
        row.forEach((cell, j) => {
            const x = j * tileSize;
            const y = i * tileSize;

            // Pokud je hodnota 1666, vykreslíme nepoškozenou krabici
            if (cell === 1666) {
                if (crateImage.complete) {
                    c.drawImage(crateImage, x, y, tileSize, tileSize);
                }
            }
            // Pokud je hodnota 1667, vykreslíme poškozenou krabici
            if (cell === 1667) {
                if (damagedCrateImage.complete) {
                    c.drawImage(damagedCrateImage, x, y, tileSize, tileSize);
                }
            }
        });
    });

    // Přidáme vykreslení dynamicky spawnovaných krabic
    const crates = getSpawnedCrates(); // Získáme dynamické krabice ze systému v crates.js
    crates.forEach((crate) => {
        if (crateImage.complete) {
            c.drawImage(crateImage, crate.x, crate.y, tileSize, tileSize);
        }
    });
}
//funkce pro obnovu hranic pro krabice

function destroyTank(player, tower) {
    if (!player.isDestroyed) {
        console.log(`Tank destroyed: ${player.id}`);
        player.isDestroyed = true;
        player.health = 0;
        player.image = destroyedPlayerImage; // Zničený tank obrázek
        tower.image = destroyedTowerImage; // Zničená věž obrázek
        player.moving = false;

        // Aktualizujeme pozici věže
        tower.position = {
            x: player.position.x + player.width / 2 - tower.width / 2,
            y: player.position.y
        };
    }
}
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Původní rozměry mapy (1409 x 768)
    const mapWidth = 1409;
    const mapHeight = 768;

    // Zajistíme zachování poměru stran mapy
    scale = Math.min(windowWidth / mapWidth, windowHeight / mapHeight);

    // Přizpůsobíme canvas
    canvas.width = mapWidth;
    canvas.height = mapHeight;

    // Změníme měřítko pomocí CSS
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = "top left";
    // Aktualizujeme hitboxy, pozice a velikosti objektů
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


let lastFrameTime = performance.now();

function animate(ws) {
    window.requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    if (!player || !player2) {
        console.error("Player or Player2 is not initialized!");
        return;
    }

    if (!player.isDestroyed) {
        player.updateFrame();
        player.draw();
        towerRotation(player, tower, keys, cursorPosition, scale, socket);
        tower.draw();
    } else {
        // Pokud je zničený, vykresli zničený tank
        destroyTank(player, tower);
    }

    // Pokud protihráč není zničen, vykresli ho normálně
    if (!player2.isDestroyed) {
        player2.updateFrame();
        player2.draw();
        tower2.draw();
    } else {
        // Pokud je zničený, vykresli zničený tank
       destroyTank(player2, tower2);
    }

    const now = performance.now();
    const deltaTime = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    background.draw();
    boundaries.forEach((boundary) => boundary.draw());
    drawCrates();
    spawnCrates();
    startCrateRespawner();
    collectCrates(player);

    tower2.position.x = player2.position.x + player2.width / 2 - tower2.width / 2;
    tower2.position.y = player2.position.y + player2.height / 2 - tower2.height + 60;

    player.updateFrame();
    player2.updateFrame();
    player2.draw();
    player.draw();

    towerRotation(player, tower, keys, cursorPosition, scale, socket);
    tower.draw();
    tower2.draw();

    updateBullets(player, player2, c);
    drawHealthBar(player, c);
    drawHealthBar(player2, c);
    updateCooldown(deltaTime);
    drawCooldown(c, canvas.width - 40, 730, 30);
    updateAbilityDuration(deltaTime);
    drawAbilityIndicator(c, canvas.width - 40, canvas.height - 100, 30);


    // Zpracování pohybu hráče
    const { newPositionX, newPositionY } = handlePlayerMovement(player, keys, socket);

    function updateBullets(player, player2, context) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            // Výpočet nové pozice střely
            const newX = bullet.x + Math.cos(bullet.angle) * bullet.speed;
            const newY = bullet.y + Math.sin(bullet.angle) * bullet.speed;

            if (!bullet || typeof bullet.x !== 'number' || typeof bullet.y !== 'number') {
                console.error('Invalid bullet found:', bullet);
                bullets.splice(i, 1); // Odstranit nevalidní střelu
                continue;
            }

            // Kontrola kolize střely
            if (checkBulletCollision(bullet, player, player2)) {
                bullets.splice(i, 1); // Odstranit střelu, která kolidovala
                continue; // Přeskočit na další střelu
            }

            // Aktualizace pozice střely
            bullet.x = newX;
            bullet.y = newY;

            // Vykreslení střely
            const bulletWidth = 7;
            const bulletHeight = 21;
            context.save();
            context.translate(bullet.x, bullet.y);
            context.rotate(bullet.angle - Math.PI / 2);
            context.drawImage(bullet.image, -bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
            context.restore();

            // Odstranit střelu, pokud opustí canvas
            if (bullet.x < 0 || bullet.x > context.canvas.width || bullet.y < 0 || bullet.y > context.canvas.height) {
                bullets.splice(i, 1);
            }
        }
    }

    function checkBulletCollision(bullet, player, player2) {
        const gridX = Math.floor(bullet.x / tileSize);
        const gridY = Math.floor(bullet.y / tileSize);
    
        const bulletHitbox = {
            position: { x: bullet.x - 2.5, y: bullet.y - 2.5 },
            width: 5,
            height: 5,
        };
    
        const player1Hitbox = {
            position: { x: player.position.x + player.hitbox.offsetX, y: player.position.y + player.hitbox.offsetY },
            width: player.hitbox.width,
            height: player.hitbox.height,
        };
    
        const player2Hitbox = {
            position: { x: player2.position.x + player2.hitbox.offsetX, y: player2.position.y + player2.hitbox.offsetY },
            width: player2.hitbox.width,
            height: player2.hitbox.height,
        };
    
        // Kontrola kolize s hráčem 1
        if (bullet.shooter !== player && rectangularCollision({ rectangle1: bulletHitbox, rectangle2: player1Hitbox })) {
            player.health -= bullet.damage;
            
            sendHealthUpdate(player.health); // Odešli novou hodnotu zdraví na server
        
            if (player.health <= 0 && !player.isDestroyed) {
                destroyTank(player, tower);
            }
            return true;
        }
        
        if (bullet.shooter !== player2 && rectangularCollision({ rectangle1: bulletHitbox, rectangle2: player2Hitbox })) {
            player2.health -= bullet.damage;
        
            // Odešli informaci o zdraví druhého hráče na server
            sendHealthUpdate(player2.health);
        
            if (player2.health <= 0 && !player2.isDestroyed) {
                destroyTank(player2, tower2);
            }
            return true;
        }
        // Kontrola kolize střely s objekty na mapě
        if (
            gridY >= 0 &&
            gridY < bulletCollisionsMap.length &&
            gridX >= 0 &&
            gridX < bulletCollisionsMap[0].length
        ) {
            const cellValue = bulletCollisionsMap[gridY][gridX];
            if (cellValue === 1555) {
                return true; // Kolize s překážkou
            }
            if (cellValue === 1666) {
                sendCrateUpdate(gridX, gridY, 1667);
                bulletCollisionsMap[gridY][gridX] = 1667;
                 // Poškozená krabice
                return true; // Kolize s krabicí
            } else if (cellValue === 1667) {
                sendCrateUpdate(gridX, gridY, 0);
                bulletCollisionsMap[gridY][gridX] = 0;
                 // Krabice zničena
                const crateBoundaryIndex = boundaries.findIndex(
                    (boundary) =>
                        boundary.position.x === gridX * tileSize &&
                        boundary.position.y === gridY * tileSize &&
                        boundary.type === 'crate'
                );
                if (crateBoundaryIndex !== -1) {
                    boundaries.splice(crateBoundaryIndex, 1);
                    console.log(`Kolize krabice odstraněna na pozici: (${gridX * tileSize}, ${gridY * tileSize})`);
                }
                console.log('Krabice zničena na pozici:', gridX, gridY);
                return true; // Kolize s krabicí
            }
        }
    
        return false; // Žádná kolize
    }

    let collisionX = false;
            boundaries.forEach(boundary => {
            if (rectangularCollision({rectangle1: {...player,position: { x: newPositionX, y: player.position.y } // Nová pozice hráče na ose X
        },
        rectangle2: {
            position: boundary.position, // Pozice hranice
            width: boundary.width,       // Šířka hranice
            height: boundary.height      // Výška hranice
        }
    })) {
        collisionX = true;
    }
});

// Kontrola kolize s krabicemi na ose X
if (checkTankCollisionWithCrates({
    position: { x: newPositionX, y: player.position.y },
    hitbox: player.hitbox
})) {
    collisionX = true;
}

// Pokud není kolize na ose X, posuneme hráče na novou pozici
if (!collisionX) {
    player.position.x = newPositionX;
}

// Kontrola kolizí při pohybu na ose Y
let collisionY = false;
boundaries.forEach(boundary => {
    if (rectangularCollision({
        rectangle1: {...player,position: { x: player.position.x, y: newPositionY } // Nová pozice hráče na ose Y
        },
        rectangle2: {
            position: boundary.position, // Pozice hranice
            width: boundary.width,       // Šířka hranice
            height: boundary.height      // Výška hranice
        }
    })) {
        collisionY = true;
    }
});

// Kontrola kolize s krabicemi na ose Y
if (checkTankCollisionWithCrates({
    position: { x: player.position.x, y: newPositionY },
    hitbox: player.hitbox
})) {
    collisionY = true;
}

// Pokud není kolize na ose Y, posuneme hráče na novou pozici
if (!collisionY) {
    player.position.y = newPositionY;
}
}

Promise.all([
    new Promise((resolve, reject) => {
        backgroundImage.onload = resolve;
        backgroundImage.onerror = reject;
    }),
    new Promise((resolve, reject) => {
        playerImage.onload = resolve;
        playerImage.onerror = reject;
    })
]).then(() => {
    animate(); // Spuštění hry
}).catch(error => console.error("Chyba při načítání obrázků:", error));
