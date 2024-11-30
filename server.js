const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const playerSlots = [null, null]; // Dva hráči maximálně

wss.on('connection', (ws) => {
    console.log('New connection established.');
    console.log(`Total clients connected: ${wss.clients.size}`);
    const availableSlotIndex = playerSlots.findIndex(slot => slot === null);

    if (availableSlotIndex === -1) {
        console.log('Server is full. Connection refused.');
        ws.send(JSON.stringify({ type: 'serverFull', message: 'Game is full.' }));
        ws.close();
        return;
    }

    // Nastav nového hráče
    ws.id = generateUniqueID();
    playerSlots[availableSlotIndex] = {
        id: ws.id,
        ws: ws,
        position: { x: 0, y: 0, rotation: 0 },
        tower: { rotation: 0, position: { x: 0, y: 0 } }, // Přidat informace o věži
        health: 100,
    };
    console.log(`Player connected in slot ${availableSlotIndex} with ID ${ws.id}`);

    // Poslat inicializaci novému hráči
    ws.send(JSON.stringify({
        type: 'init',
        id: ws.id,
        players: playerSlots.filter(player => player !== null).map(player => ({
            id: player.id,
            position: player.position,
            health: player.health,
            tower: player.tower, // Přidání věže
        })),
    }));

    // Informovat druhého hráče o novém hráči
    broadcast({
        type: 'newPlayer',
        id: ws.id,
        position: playerSlots[availableSlotIndex].position,
        health: playerSlots[availableSlotIndex].health,
    }, ws);

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'movement') {
            // Aktualizace pozice tanku hrĂĄÄe
            const playerSlot = playerSlots.find(slot => slot?.id === ws.id);
            if (playerSlot) {
                playerSlot.position = data.position;

                // OdesĂ­lĂĄnĂ­ aktualizace ostatnĂ­m hrĂĄÄĹŻm
                broadcast({
                    type: 'updatePosition',
                    id: playerSlot.id,
                    position: playerSlot.position,
                }, ws);
            }
        } else if (data.type === 'towerUpdate') {
            const playerSlot = playerSlots.find(slot => slot?.id === ws.id);
            if (playerSlot) {
                playerSlot.tower = {
                    rotation: data.rotation,
                    position: data.position,
                };
        
                // Odeslání aktualizace ostatním hráčům
                broadcast({
                    type: 'updateTower',
                    id: playerSlot.id,
                    tower: playerSlot.tower, // Odesílání věže
                }, ws);
            }
        }else if (data.type === 'updateHealth') {
            const playerSlot = playerSlots.find(slot => slot?.id === data.id);
            if (playerSlot) {
                playerSlot.health = data.health;
                console.log(`Health update for player ${playerSlot.id}: ${playerSlot.health}`);
        
                // Pokud zdraví klesne na nulu
                if (playerSlot.health <= 0 && !playerSlot.isDestroyed) {
                    playerSlot.isDestroyed = true;
                    console.log(`Player ${playerSlot.id} is destroyed.`);
        
                    // Vysíláme zprávu o zničení hráče
                    broadcast({
                        type: 'playerDestroyed',
                        id: playerSlot.id, // Pouze zničený hráč
                    });
                }
        
                // Vysílej aktualizaci zdraví
                broadcast({
                    type: 'updateHealth',
                    id: playerSlot.id,
                    health: playerSlot.health,
                });
            }
        }else if (data.type === 'updateCrate') {
            console.log(`Broadcasting crate update: (${data.position.x}, ${data.position.y}) -> ${data.state}`);
    
            // Rozeslat změnu všem ostatním klientům
            broadcast({
                type: 'updateCrate',
                position: data.position,
                state: data.state,
            }, ws);
        }
    });


    ws.on('close', () => {
        console.log(`Player ${ws.id} disconnected.`);
        const playerIndex = playerSlots.findIndex(slot => slot?.id === ws.id);
        if (playerIndex !== -1) {
            playerSlots[playerIndex] = null;
        }

        broadcast({ type: 'playerDisconnected', id: ws.id });
    });
});

function broadcast(data, excludeSocket) {
    console.log(`Broadcasting: ${JSON.stringify(data)}`);
    wss.clients.forEach((client, index) => {
        if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(data));
            } catch (error) {
                console.error(`Failed to send message to client ${index}:`, error);
            }
        }
    });
}

function generateUniqueID() {
    return Math.random().toString(36).substring(2, 9);
}

console.log('Server running on ws://localhost:8080');