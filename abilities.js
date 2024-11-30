import { player, tower, player2 } from "/main.js";
import { setRotationSpeed, normalizeAngle } from "./towerRotation.js";
import { startAbilityDuration } from "./cooldown.js";
let aimbotInterval;
export let aimbotActive = false;

const abilityIcons = {
    fasterTurretRotation: "./images/fasterRotation.png",
    moreSpeed: "./images/moreSpeed.png",
    aimbot: "/images/aimbot.png",
    betterProjectiles: "/images/betterProjectiles.png",
};

let abilities = {
    fasterTurretRotation: {
        name: "Faster Turret Rotation",
        duration: 10,
        cooldown:10, // Doba trvání v sekundách
        apply: () => {
            console.log("Faster turret rotation activated!");
            setRotationSpeed(0.2); // Zdvojnásobení rychlosti rotace
        },
        remove: () => {
            console.log("Faster turret rotation expired!");
            setRotationSpeed(0.02); // Návrat k výchozí rychlosti rotace
        },
    },
    moreSpeed: {
        name: "More Speed",
        duration: 5, // Doba cooldownu v sekundách
        apply: (player) => {
            console.log("Speed boost activated!");
            player.speed = 2.5; // Nastavení rychlosti pro konkrétního hráče
        },
        remove: (player) => {
            console.log("Speed boost expired!");
            player.speed = 1; // Návrat k normální rychlosti
        },
    },
    aimbot: {
        name: "Aimbot",
        duration: 4,
        apply: () => {
            console.log("Aimbot activated!");
            
            if (aimbotActive) {
                console.warn("Aimbot is already active!");
                return;
            }
    
            aimbotActive = true;
    
            // Spustíme interval pro dynamické míření
            aimbotInterval = setInterval(() => {
                if (!player2.isDestroyed) {
                    // Aktualizujeme pozici věže na střed tanku hráče 1
                    tower.position.x = player.position.x + player.width / 2 - tower.width / 2;
                    tower.position.y = player.position.y + player.height / 2 - tower.height / 2 + 20;
    
                    // Vypočítáme rozdíl mezi pozicí věže (střed) a hráčem 2 (střed)
                    const dx = player2.position.x + player2.width / 2 - (tower.position.x + tower.width / 2);
                    const dy = player2.position.y + player2.height / 2 - (tower.position.y + tower.height / 2);
    
                    // Výpočet cílového úhlu a přidání malé korekce
                    const targetAngle = Math.atan2(dy, dx);
    
                    // Nastavení rotace věže s korekcí
                    tower.rotation = normalizeAngle(targetAngle - Math.PI / 2);
                } else {
                    console.warn("Player 2 is destroyed. Aimbot targeting skipped.");
                }
            }, 16); // Aktualizace každých ~60 FPS
        },
        remove: () => {
            if (aimbotActive) {
                console.log("Aimbot expired!");
                clearInterval(aimbotInterval);
                aimbotActive = false;
            }
        },
    },
    betterProjectiles: {
        name: "Better Projectiles",
        duration: 5, // Doba trvání schopnosti v sekundách
        apply: (player) => {
            console.log("Better Projectiles activated!");
            player.bulletDamageMultiplier = 2;
            player.speedMultiplier = 2; // Zvýšení poškození
        },
        remove: (player) => {
            console.log("Better Projectiles expired!");
            player.bulletDamageMultiplier = 1;
            player.speedMultiplier = 1; // Návrat na původní hodnotu
        },
    },
};

export function activateAbility(player, abilityKey) {
    const ability = abilities[abilityKey];
    if (!ability) {
        console.error(`Ability "${abilityKey}" does not exist!`);
        return;
    }

    console.log(`Activating ability: ${ability.name}`);
    ability.apply(player);
    
    const iconSrc = abilityIcons[abilityKey];
    startAbilityDuration(ability.name, ability.duration, iconSrc);

    setTimeout(() => {
        ability.remove(player);
    }, ability.duration * 1000);
}

// Spawnování krabic
