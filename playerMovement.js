export function handlePlayerMovement(player, keys, speed) {
    if(player.isDestroyed) return;
    let newPositionX = player.position.x;
    let newPositionY = player.position.y;
    player.moving = false;

    // Připravíme pole pro zaznamenání stisknutých směrových kláves
    const pressedKeys = [];
    if (keys.w) pressedKeys.push('w');
    if (keys.a) pressedKeys.push('a');
    if (keys.s) pressedKeys.push('s');
    if (keys.d) pressedKeys.push('d');

    // Bereme v potaz pouze první dvě klávesy v `pressedKeys`
    const keyCombination = pressedKeys.slice(0, 2).join('');

    // Switch pro zjištění směru pohybu
    switch (keyCombination) {
        case 'wd':
            newPositionY -= speed;
            newPositionX += speed;
            player.moving = true;
            player.rotation = -3 * Math.PI / 4;
            break;
        case 'wa':
            newPositionY -= speed;
            newPositionX -= speed;
            player.moving = true;
            player.rotation = 3 * Math.PI / 4;
            break;
        case 'sd':
            newPositionY += speed;
            newPositionX += speed;
            player.moving = true;
            player.rotation = -Math.PI / 4;
            break;
        case 'as':
            newPositionY += speed;
            newPositionX -= speed;
            player.moving = true;
            player.rotation = Math.PI / 4;
            break;
        case 'w':
            newPositionY -= speed;
            player.moving = true;
            player.rotation = Math.PI;
            break;
        case 's':
            newPositionY += speed;
            player.moving = true;
            player.rotation = 0;
            break;
        case 'a':
            newPositionX -= speed;
            player.moving = true;
            player.rotation = Math.PI / 2;
            break;
        case 'd':
            newPositionX += speed;
            player.moving = true;
            player.rotation = -Math.PI / 2;
            break;
        default:
            player.moving = false;
            break;
    }
     // Kontrola kolizí s hranicemi mapy
     if (newPositionX < 0) {
        newPositionX = 0;
    }
    if (newPositionX + player.width > canvas.width) {
        newPositionX = canvas.width - player.width;
    }
    if (newPositionY < 0) {
        newPositionY = 0;
    }
    if (newPositionY + player.height > canvas.height) {
        newPositionY = canvas.height - player.height;
    }
    return { newPositionX, newPositionY };
}