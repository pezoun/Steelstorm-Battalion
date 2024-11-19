let cooldownRemaining = 0; // Cooldown zbývající čas
let cooldownInterval; // Interval pro aktualizaci cooldownu

// Funkce pro inicializaci cooldownu
export function startCooldown(durationInSeconds) {
    cooldownRemaining = durationInSeconds;
    if (cooldownInterval) clearInterval(cooldownInterval); // Vyčistí předchozí interval

    cooldownInterval = setInterval(() => {
        cooldownRemaining--;
        if (cooldownRemaining <= 0) {
            clearInterval(cooldownInterval); // Zastaví, pokud cooldown vyprší
        }
    }, 1000);
}

// Funkce pro vykreslení cooldownu
export function drawCooldown(context) {
    if (cooldownRemaining > 0) {
        context.font = '20px Arial';
        context.fillStyle = 'white';
        context.fillText(`Cooldown: ${cooldownRemaining}s`, 10, 30); // Text v levém horním rohu
    }
}