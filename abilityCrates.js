import { rectangularCollision } from './collisions.js';
import { activateAbility } from './abilities.js';
import { boundaries } from './main.js';

const crateSize = 32; // Velikost krabic
const maxCrates = 2; // Maximální počet krabic na mapě
const respawnInterval = 15000; // Interval respawnování krabic (v milisekundách)

let spawnedCrates = []; // Seznam všech aktuálních krabic

// Kontrola, zda pozice není v kolizi
function isPositionValid(x, y) {
    const crateBounds = {
        position: { x, y },
        width: crateSize,
        height: crateSize,
    };

    return !boundaries.some((boundary) =>
        rectangularCollision({ rectangle1: crateBounds, rectangle2: boundary })
    );
}

// Funkce pro spawnování krabic
export function spawnCrates() {
    while (spawnedCrates.length < maxCrates) {
        const randomX = Math.floor(Math.random() * (canvas.width - crateSize));
        const randomY = Math.floor(Math.random() * (canvas.height - crateSize));

        if (isPositionValid(randomX, randomY)) {
            spawnedCrates.push({ x: randomX, y: randomY });
        }
    }
}

// Funkce pro sbírání krabic hráčem
export function collectCrates(player) {
    for (let i = spawnedCrates.length - 1; i >= 0; i--) {
        const crate = spawnedCrates[i];
        const playerBounds = {
            position: {
                x: player.position.x + player.hitbox.offsetX,
                y: player.position.y + player.hitbox.offsetY,
            },
            width: player.hitbox.width,
            height: player.hitbox.height,
        };

        const crateBounds = {
            position: { x: crate.x, y: crate.y },
            width: crateSize,
            height: crateSize,
        };

        if (rectangularCollision({ rectangle1: playerBounds, rectangle2: crateBounds })) {
            // Hráč sebral krabici
            spawnedCrates.splice(i, 1); // Odebereme krabici
            grantRandomAbility(player); // Přiřadíme náhodnou abilitu
        }
    }
}

// Funkce pro náhodné přiřazení ability
function grantRandomAbility(player) {
    const abilityKeys = ["fasterTurretRotation", "moreSpeed", "aimbot", "betterProjectiles"]; // Seznam všech abilit
    const randomKey = abilityKeys[Math.floor(Math.random() * abilityKeys.length)];
    console.log(`Player získal náhodnou abilitu: ${randomKey}`);
    activateAbility(player, randomKey);
}

// Funkce pro pravidelné respawnování krabic
export function startCrateRespawner() {
    setInterval(() => {
        spawnCrates();
    }, respawnInterval);
}

// Export aktuálních krabic pro použití v `drawCrates`
export function getSpawnedCrates() {
    return spawnedCrates;
}