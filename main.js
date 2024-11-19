import { Boundary, Sprite } from './classes.js';
import { handlePlayerMovement } from './playerMovement.js';
import { towerRotation } from './towerRotation.js';
import { collisions } from './collisions.js';
import { bulletCollisions } from './bulletCollisions.js';
import { drawHealthBar } from './healthBar.js';
import { startCooldown, drawCooldown } from './cooldown.js';


const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const playerImage = new Image();
playerImage.src = '/images/Panzer_down.png';

const destroyedPlayerImage = new Image();
destroyedPlayerImage.src = '/images/Panzer_Broken2.png';

const panzerTowerImage = new Image();
panzerTowerImage.src = '/images/PanzerTower.png';

const destroyedTowerImage = new Image();
destroyedTowerImage.src = '/images/Panzer_BrokenTower.png';

const backgroundImage = new Image();
backgroundImage.src = '/images/Normandy.png';

const crateImage = new Image();
crateImage.src = `/images/crate.png`;

export const bulletImage = new Image();
bulletImage.onload = () => console.log("Bullet image loaded");
bulletImage.src = '/images/bulletImage.png';

const damagedCrateImage = new Image();
damagedCrateImage.onload = () => console.log("Damaged crate image loaded");
damagedCrateImage.src = `/images/damagedcrate.png?${Date.now()}`;


const tileSize = 32;
const mapWidth = 44;
const collisionsMap = [];
for (let i = 0; i < collisions.length; i += mapWidth) {
    collisionsMap.push(collisions.slice(i, mapWidth + i));
}



export function updateCrateBoundaries() {
    // Odstraníme všechny hranice krabic z boundaries
    boundaries = boundaries.filter(boundary => boundary.type !== 'crate');

    // Projdeme `bulletCollisionsMap` a aktualizujeme hranice podle stavu krabic
    bulletCollisionsMap.forEach((row, i) => {
        row.forEach((cell, j) => {
            const boundaryX = j * tileSize;
            const boundaryY = i * tileSize;

            // Přidáme kolizi pro nepoškozenou (1666) nebo poškozenou (1667) krabici
            if (cell === 1666 || cell === 1667) {
                boundaries.push(new Boundary({
                    position: { x: boundaryX, y: boundaryY },
                    tileSize,
                    context: c,
                    type: 'crate'
                }));
            }
            

            // Odstraníme kolizi zničené krabice (cell === 0)
            if (cell === 0) {
                console.log(`Hledáme krabici na pozici indexů: (${j}, ${i})`);
            
                // Najdeme index krabice v poli boundaries pomocí indexů `j` a `i`
                const crateBoundaryIndex = boundaries.findIndex(boundary =>
                    boundary.position.x === j * tileSize &&
                    boundary.position.y === i * tileSize &&
                    boundary.type === 'crate'
                );
            
                // Pokud najdeme krabici, odstraníme její kolizi
                if (crateBoundaryIndex !== -1) {
                    boundaries.splice(crateBoundaryIndex, 1);
                    console.log(`Kolize krabice odstraněna na pozici: (${j * tileSize}, ${i * tileSize})`);
                } else {
                    console.log(`Kolize krabice nenalezena na pozici: (${j * tileSize}, ${i * tileSize})`);
                }
            }
        });
    });
}

export let boundaries = [];
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1441) {
            boundaries.push(new Boundary({
                position: { x: j * tileSize, y: i * tileSize },
                tileSize,
                context: c
            }));
        }
    });
});

const bulletBoundaries = [];
export const bulletCollisionsMap = [];
for (let i = 0; i < bulletCollisions.length; i += mapWidth) {
    bulletCollisionsMap.push(bulletCollisions.slice(i, mapWidth + i));
}

bulletCollisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1555) { // Symbol '2' bude znamenat kolizi pro střely
            bulletBoundaries.push(new Boundary({
                position: { x: j * tileSize, y: i * tileSize },
                tileSize,
                context: c
            }));
        }
    });
});

function drawCrates() {
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
            if (cell === 1667) {
                if (damagedCrateImage.complete) {
                    c.drawImage(damagedCrateImage, x, y, tileSize, tileSize);
                } 
            }
        });
    });
}

const background = new Sprite({
    position: { x: 0, y: 0 },
    image: backgroundImage,
    width: canvas.width,
    height: canvas.height,
    context: c
});

export const player = new Sprite({
    position: {
        x: canvas.width / 2 - 197 / 4 / 2 -70,
        y: canvas.height / 2 - 68 / 2 + 80
    },
    image: playerImage,
    width: 197,  
    height: 68,  
    frames: { max: 4 },
    context: c,
    hitbox: {
        width: 197 / 4,  
        height: 55,   
        offsetX: 197 / 2.7,  
        offsetY: 5
    },
    health: 100,
    isDestroyed: false
});



const tower = new Sprite({
    position: {
        x: player.position.x,
        y: player.position.y
    },
    image: panzerTowerImage,
    width: 42,
    height: 90,
    context: c,
    rotationOffsetX: 0,
    rotationOffsetY: -20
});

let cursorPosition = { x: 0, y: 0 };


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

const speed = 1;
const keys = { w: false, a: false, s: false, d: false };

// Funkce pro kontrolu kolizí
export function rectangularCollision({ rectangle1, rectangle2 }) {
    // Kontrola, zda mají obdélníky všechny potřebné vlastnosti
    if (
        !rectangle1 ||
        !rectangle2 ||
        !rectangle1.position ||
        !rectangle2.position ||
        rectangle1.hitbox === undefined ||
        rectangle2.width === undefined ||
        rectangle2.height === undefined
    ) {
        return false;
    }

    return (
        rectangle1.position.x + rectangle1.hitbox.offsetX + rectangle1.hitbox.width >= rectangle2.position.x &&
        rectangle1.position.x + rectangle1.hitbox.offsetX <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + rectangle1.hitbox.offsetY + rectangle1.hitbox.height >= rectangle2.position.y &&
        rectangle1.position.y + rectangle1.hitbox.offsetY <= rectangle2.position.y + rectangle2.height
    );
}

function checkTankCollisionWithCrates(player) {
    return bulletCollisionsMap.some((row, i) => {
        return row.some((cell, j) => {
            // Kontrolujeme kolizi pro nepoškozené (1666) i poškozené (1667) krabice
            if (cell === 1666 || cell === 1667) {
                const crateBoundary = {
                    position: { x: j * tileSize, y: i * tileSize },
                    width: tileSize,
                    height: tileSize
                };

                // Použijeme rectangularCollision pro kontrolu kolize
                return rectangularCollision({
                    rectangle1: player,
                    rectangle2: crateBoundary
                });
            }
            return false;
        });
    });
}

export const bullets = [];
let canShoot = true;
const shootCooldown = 2;

// Funkce pro vytvoření střely
export function createBullet(player, tower) {

    if (!canShoot || player.isDestroyed) return;
    
    const angle = tower.rotation + Math.PI / 2;
    const turretLength = tower.height / 2;
    const bulletX = player.position.x + player.width / 2 + Math.cos(angle) * turretLength;    
    const bulletY = player.position.y + player.height / 2 + Math.sin(angle) * turretLength;

    const bullet = {
        x: bulletX,
        y: bulletY,
        angle: angle,
        speed: 10,
        image: bulletImage,
    };

    bullets.push(bullet);

    canShoot = false;
    startCooldown(shootCooldown); // Spustí cooldown
    setTimeout(() => (canShoot = true), shootCooldown * 1000); 
}


document.addEventListener('keydown', (event) => {
    if (event.key === 'h' || event.key === 'H') {
        player.health -= 20;
        console.log(`Zdraví hráče: ${player.health}`);

        if (player.health <= 0 && !player.isDestroyed) {
            console.log('Tank zničen!');
            player.health = 0; // Nastavíme zdraví na minimum
            player.isDestroyed = true;
            player.image = destroyedPlayerImage;
            tower.image = destroyedTowerImage;
            player.moving = false;
            tower.rotation = tower.rotation;
            tower.position = {
                x: player.position.x + player.width / 2 - tower.width / 2,
                y: player.position.y
            };
            
        }
    }
});

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

function animate() {
    window.requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    background.draw();
    boundaries.forEach((boundary) => boundary.draw());

    drawCrates(); // Vykreslení krabic

    player.updateFrame();
    player.draw();
    towerRotation(player, tower, keys, cursorPosition);
    tower.draw();

    updateBullets(player, c);
    drawHealthBar(player, c);
    drawCooldown(c);
    // Zpracování pohybu hráče
    const { newPositionX, newPositionY } = handlePlayerMovement(player, keys, speed);

    function updateBullets(player, context) {
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
            if (checkBulletCollision(bullet, player)) {
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
    
    function checkBulletCollision(bullet, player) {
        const gridX = Math.floor(bullet.x / tileSize);
        const gridY = Math.floor(bullet.y / tileSize);
    
        const bulletHitbox = {
            position: { x: bullet.x - 2.5, y: bullet.y - 2.5 },
            width: 5,
            height: 5,
        };
    
        const playerHitbox = {
            position: { x: player.position.x + player.hitbox.offsetX, y: player.position.y + player.hitbox.offsetY },
            width: player.hitbox.width,
            height: player.hitbox.height,
        };
    
        // Kontrola, zda střela zasáhla hráče
        if (rectangularCollision({ rectangle1: bulletHitbox, rectangle2: playerHitbox })) {
            player.health -= 20;
            console.log(`Tank zasažen! Zdraví: ${player.health}`);
            if (player.health <= 0) {
                console.log('Tank zničen! Game over.');
            }
            return true; // Kolize s hráčem
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
                console.log(`Střela narazila do překážky na pozici: (${gridX}, ${gridY})`);
                return true; // Kolize s překážkou
            }
            if (cellValue === 1666) {
                bulletCollisionsMap[gridY][gridX] = 1667; // Poškozená krabice
                console.log('Krabice poškozena na pozici:', gridX, gridY);
                return true; // Kolize s krabicí
            } else if (cellValue === 1667) {
                bulletCollisionsMap[gridY][gridX] = 0; // Krabice zničena
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

    

    // Kontrola kolizí při pohybu na ose X
    // Kontrola kolizí při pohybu na ose X
let collisionX = false;
boundaries.forEach(boundary => {
    if (rectangularCollision({
        rectangle1: { ...player, position: { x: newPositionX, y: player.position.y } },
        rectangle2: boundary
    })) {
        collisionX = true;
    }
});

// Kontrola kolize s krabicemi
if (checkTankCollisionWithCrates({ position: { x: newPositionX, y: player.position.y }, hitbox: player.hitbox })) {
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
        rectangle1: { ...player, position: { x: player.position.x, y: newPositionY } },
        rectangle2: boundary
    })) {
        collisionY = true;
    }
});

// Kontrola kolize s krabicemi
if (checkTankCollisionWithCrates({ position: { x: player.position.x, y: newPositionY }, hitbox: player.hitbox })) {
    collisionY = true;
}

// Pokud není kolize na ose Y, posuneme hráče na novou pozici
if (!collisionY) {
    player.position.y = newPositionY;
}
}

// Načtení obrázků a spuštění animace
Promise.all([
    new Promise((resolve, reject) => {
        backgroundImage.onload = resolve;
        backgroundImage.onerror = reject;
    }),
    new Promise((resolve, reject) => {
        playerImage.onload = resolve;
        playerImage.onerror = reject;
    })
]).then(() => { // Inicializace hry při načtení
    animate(); // Spuštění hry
}).catch(error => console.error("Chyba při načítání obrázků:", error));