import { sendTowerData } from './main.js';
export let rotationSpeed = 0.02;

export function setRotationSpeed(newSpeed) {
    rotationSpeed = newSpeed;
}

export function normalizeAngle(angle) {
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;
    return angle;
}

export function interpolateAngle(currentAngle, targetAngle, speed) {
    currentAngle = normalizeAngle(currentAngle);
    targetAngle = normalizeAngle(targetAngle);

    const difference = normalizeAngle(targetAngle - currentAngle);

    if (Math.abs(difference) < speed) {
        return targetAngle;
    }

    return currentAngle + Math.sign(difference) * speed;
}

export function towerRotation(player, tower, keys, cursorPosition, scale, socket) {
    if (player.isDestroyed) return;

    const previousRotation = tower.rotation;

    if (cursorPosition) {
        const adjustedCursorX = cursorPosition.x / scale;
        const adjustedCursorY = cursorPosition.y / scale;

        const dx = adjustedCursorX - (player.position.x + player.width / 2);
        const dy = adjustedCursorY - (player.position.y + player.height / 2);

        const rotateOffset = Math.PI / 2;
        const targetAngle = Math.atan2(dy, dx);

        tower.rotation = interpolateAngle(tower.rotation, targetAngle - rotateOffset, rotationSpeed);

        // Aktualizace pozice věže
        tower.position.x = player.position.x + player.width / 2 - tower.width / 2;
        tower.position.y = player.position.y + player.height / 2 - tower.height + 60;
    }

    // Poslat aktualizaci na server jen při změně
    if (previousRotation !== tower.rotation) {
        sendTowerData();
    }
}