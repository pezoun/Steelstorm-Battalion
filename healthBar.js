export function drawHealthBar(player, context) {
    if (!player.id) {
        console.warn('Player ID is not defined, skipping health bar drawing');
        return;
    }

    const barWidth = 80; // Šířka health baru
    const barHeight = 10; // Výška health baru
    const barX = player.position.x + player.width / 2 - barWidth / 2;
    const barY = player.position.y - 20;

    //console.log(`Drawing health bar for Player ${player.id}: Health ${player.health}`);

    const health = Math.max(0, player.health);
    const healthPercentage = health / 100;
    const filledWidth = barWidth * healthPercentage;

    context.fillStyle = 'red';
    context.fillRect(barX, barY, barWidth, barHeight);

    context.fillStyle = 'green';
    context.fillRect(barX, barY, filledWidth, barHeight);

    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barWidth, barHeight);
}