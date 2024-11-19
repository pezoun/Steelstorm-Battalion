// Funkce pro normalizaci úhlu na rozsah [-π, π]
function normalizeAngle(angle) {
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;
    return angle;
}

// Funkce pro interpolaci úhlu s kontrolou rozdílu
function interpolateAngle(currentAngle, targetAngle, speed) {
    currentAngle = normalizeAngle(currentAngle);
    targetAngle = normalizeAngle(targetAngle);

    const difference = normalizeAngle(targetAngle - currentAngle);

    if (Math.abs(difference) < speed) {
        return targetAngle;
    }

    return currentAngle + Math.sign(difference) * speed;
}


export function towerRotation(player, tower, keys, cursorPosition) {
    
    const rotationSpeed = 0.02;
    
    if (cursorPosition) {
        if(player.isDestroyed) return;
        const dx = cursorPosition.x - (player.position.x + player.width / 2);
        const dy = cursorPosition.y - (player.position.y + player.height / 2);

        const rotateOffset = Math.PI / 2;
        const targetAngle = Math.atan2(dy, dx);

        // Interpolace úhlu věže
        tower.rotation = interpolateAngle(tower.rotation, targetAngle - rotateOffset, rotationSpeed);

        // Aktualizace pozice věže relativně k hráči
        tower.position.x = player.position.x + player.width / 2 - tower.width / 2;
        tower.position.y = player.position.y + player.height / 2 - tower.height + 60;
    } else {
        // Klávesové ovládání věže, pokud není použit kurzor
        let pressedKeys = [];
        if (keys.w) pressedKeys.push('w');
        if (keys.a) pressedKeys.push('a');
        if (keys.s) pressedKeys.push('s');
        if (keys.d) pressedKeys.push('d');

        if (pressedKeys.length > 2) {
            pressedKeys = pressedKeys.slice(-2);
        }

        const keyCombination = pressedKeys.join('');

        // Nastavení rotace podle stisknutých kláves
        let targetAngle = tower.rotation;

        switch (keyCombination) {
            case 'w':
                targetAngle = Math.PI;
                break;
            case 's':
                targetAngle = 0;
                break;
            case 'a':
                targetAngle = Math.PI / 2;
                break;
            case 'd':
                targetAngle = -Math.PI / 2;
                break;
            case 'wa':
                targetAngle = 3 * Math.PI / 4;
                break;
            case 'wd':
                targetAngle = -3 * Math.PI / 4;
                break;
            case 'as':
                targetAngle = Math.PI / 4;
                break;
            case 'sd':
                targetAngle = -Math.PI / 4;
                break;
            default:
                break;
        }

        // Interpolace úhlu věže při ovládání pomocí kláves
        tower.rotation = interpolateAngle(tower.rotation, targetAngle, rotationSpeed);
    }
}