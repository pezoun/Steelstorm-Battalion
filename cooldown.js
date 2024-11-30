
export let cooldownRemaining = 0;
export let cooldownDuration = 0;
export const activeAbilities = [];

// Funkce pro spuštění ability
export function startAbilityDuration(name, duration, iconSrc) {
    // Zkontrolujeme, zda ability už není aktivní
    const existingAbility = activeAbilities.find((a) => a.name === name);
    if (existingAbility) {
        console.log(`Ability "${name}" is already active.`);
        return;
    }

    // Přidáme novou abilitu
    activeAbilities.push({
        name: name,
        duration: duration,
        durationRemaining: duration,
        icon: new Image(), // Načteme ikonu
    });

    // Nastavíme zdroj ikony
    activeAbilities[activeAbilities.length - 1].icon.src = iconSrc;
}

// Funkce pro aktualizaci zbývajícího času všech abilit
export function updateAbilityDuration(deltaTime) {
    for (let i = activeAbilities.length - 1; i >= 0; i--) {
        activeAbilities[i].durationRemaining -= deltaTime;

        // Odstraníme abilitu, pokud její čas vypršel
        if (activeAbilities[i].durationRemaining <= 0) {
            activeAbilities.splice(i, 1);
        }
    }
}

export function getCooldownRemaining() {
    return cooldownRemaining;
}

// Načteme obrázek jednou při inicializaci
const centerIconImage = new Image();
centerIconImage.src = "/images/centerIcon.png";

// Funkce pro inicializaci cooldownu
export function startCooldown(durationInSeconds) {
    cooldownDuration = durationInSeconds;
    cooldownRemaining = durationInSeconds;
}

// Funkce pro aktualizaci zbývajícího času cooldownu
export function updateCooldown(deltaTime) {
    if (cooldownRemaining > 0) {
        cooldownRemaining = Math.max(0, cooldownRemaining - deltaTime);
    }
}

// Funkce pro vykreslení rotujícího cooldownu
export function drawCooldown(context, x, y, radius) {
    const percentage = cooldownRemaining / cooldownDuration;

    // Kruh cooldownu (vnější)
    context.beginPath();
    context.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + percentage * 2 * Math.PI, false);
    context.lineWidth = 5;
    context.strokeStyle = "rgba(0, 255, 0, 0.8)"; // Barva okraje kruhu
    context.stroke();

    // Kruh pozadí cooldownu
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "rgba(0, 0, 0, 0.5)"; // Poloprůhledné pozadí
    context.fill();

    // Vykreslení obrázku uprostřed
    const imageSize = radius * 1.5;
    context.drawImage(centerIconImage, x - imageSize / 2, y - imageSize / 2, imageSize, imageSize);

    // Vykreslení textu cooldownu (zbývající čas)
    if (cooldownRemaining > 0) {
        context.font = `${radius * 0.7}px Arial`;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        const remainingSeconds = Math.ceil(cooldownRemaining);
        context.fillText(remainingSeconds, x, y);
    }
}

export function drawAbilityIndicator(context, x, y, radius) {
    if (activeAbilities.length === 0) return; // Pokud nejsou aktivní žádné ability, nevykreslujeme nic

    activeAbilities.forEach((ability, index) => {
        const offset = index * (radius * 3); // Posun indikátorů podle pořadí
        const percentage = ability.durationRemaining / ability.duration;

        // Kruh ability (vnější)
        context.beginPath();
        context.arc(x, y - offset, radius, -Math.PI / 2, -Math.PI / 2 + percentage * 2 * Math.PI, false);
        context.lineWidth = 5;
        context.strokeStyle = "rgba(0, 255, 0, 0.8)";
        context.stroke();

        // Kruh pozadí ability
        context.beginPath();
        context.arc(x, y - offset, radius, 0, 2 * Math.PI, false);
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fill();

        // Vykreslení ikony ability
        const imageSize = radius * 1.5;
        if (ability.icon.complete) {
            context.drawImage(ability.icon, x - imageSize / 2, y - offset - imageSize / 2, imageSize, imageSize);
        }

        // Vykreslení textu zbývajícího času
        if (ability.durationRemaining > 0) {
            context.font = `${radius * 0.7}px Arial`;
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            const remainingSeconds = Math.ceil(ability.durationRemaining);
            context.fillText(remainingSeconds, x, y - offset);
        }
    });
}