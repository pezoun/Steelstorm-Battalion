// healthBar.js
export function drawHealthBar(player, c) {
    const barWidth = 80; // Šířka health baru
    const barHeight = 10; // Výška health baru
    const barX = player.position.x + player.width / 2 - barWidth / 2; // Pozice X
    const barY = player.position.y - 20; // Pozice Y nad hráčem

    // Vypočítáme šířku vyplněné části podle zdraví
    const healthPercentage = player.health / 100;
    const filledWidth = barWidth * healthPercentage;

    // Vykreslení pozadí health baru (červená)
    c.fillStyle = 'red';
    c.fillRect(barX, barY, barWidth, barHeight);

    // Vykreslení vyplněné části (zelená)
    c.fillStyle = 'green';
    c.fillRect(barX, barY, filledWidth, barHeight);

    // Rámeček health baru
    c.strokeStyle = 'black';
    c.lineWidth = 1;
    c.strokeRect(barX, barY, barWidth, barHeight);
}

