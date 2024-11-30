export function rectangularCollision({ rectangle1, rectangle2 }) {
    // Zajistíme, že oba objekty mají potřebná data
    if (!rectangle1 || !rectangle2 || !rectangle1.position || !rectangle2.position) {
        console.error("Invalid rectangles for collision detection", { rectangle1, rectangle2 });
        return false;
    }

    // Pokud objekt má hitbox, použijeme jeho vlastnosti. Jinak použijeme celé tělo objektu.
    const rect1X = rectangle1.position.x + (rectangle1.hitbox?.offsetX || 0);
    const rect1Y = rectangle1.position.y + (rectangle1.hitbox?.offsetY || 0);
    const rect1Width = rectangle1.hitbox?.width || rectangle1.width;
    const rect1Height = rectangle1.hitbox?.height || rectangle1.height;

    const rect2X = rectangle2.position.x + (rectangle2.hitbox?.offsetX || 0);
    const rect2Y = rectangle2.position.y + (rectangle2.hitbox?.offsetY || 0);
    const rect2Width = rectangle2.hitbox?.width || rectangle2.width;
    const rect2Height = rectangle2.hitbox?.height || rectangle2.height;

    // Kontrola kolize pomocí obdélníků
    return (
        rect1X + rect1Width >= rect2X &&
        rect1X <= rect2X + rect2Width &&
        rect1Y + rect1Height >= rect2Y &&
        rect1Y <= rect2Y + rect2Height
    );
}


export function checkTankCollision(player, player2) {
    if (!player || !player2) {
        console.error("Player or Player2 is undefined in checkTankCollision");
        return false;
    }

    // Upravené pozice hitboxů hráče 1
    const playerHitbox = {
        position: {
            x: player.position.x + player.hitbox.offsetX,
            y: player.position.y + player.hitbox.offsetY,
        },
        width: player.hitbox.width,
        height: player.hitbox.height,
    };

    // Upravené pozice hitboxů hráče 2
    const player2Hitbox = {
        position: {
            x: player2.position.x + player2.hitbox.offsetX,
            y: player2.position.y + player2.hitbox.offsetY,
        },
        width: player2.hitbox.width,
        height: player2.hitbox.height,
    };

    // Použití rectangularCollision pro detekci kolize
    return rectangularCollision({
        rectangle1: playerHitbox,
        rectangle2: player2Hitbox,
    });
}

