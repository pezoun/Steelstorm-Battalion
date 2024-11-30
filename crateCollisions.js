import { tileSize, bulletCollisionsMap, boundaries } from './main.js';
import { Boundary } from './classes.js';
import { rectangularCollision } from './collisions.js';


export function updateCrateBoundaries() {
    // Odstraníme všechny hranice krabic z boundaries
    boundaries = boundaries.filter(boundary => boundary.type !== 'crate');

    // Projdeme `bulletCollisionsMap` a aktualizujeme hranice podle stavu krabic
    bulletCollisionsMap.forEach((row, i) => {
        row.forEach((cell, j) => {
            const boundaryX = j * tileSize;
            const boundaryY = i * tileSize;

            // Přidáme kolizi pro nepoškozenou (1666) nebo poškozenou (1667) krabici
            if (cell === 1666 || cell === 1667) {
                boundaries.push(new Boundary({
                    position: { x: boundaryX, y: boundaryY },
                    tileSize,
                    context: c,
                    type: 'crate'
                }));
            }
            
            // Odstraníme kolizi zničené krabice (cell === 0)
            if (cell === 0) {
                console.log(`Hledáme krabici na pozici indexů: (${j}, ${i})`);
            
                // Najdeme index krabice v poli boundaries pomocí indexů `j` a `i`
                const crateBoundaryIndex = boundaries.findIndex(boundary =>
                    boundary.position.x === j * tileSize &&
                    boundary.position.y === i * tileSize &&
                    boundary.type === 'crate'
                );
        
                // Pokud najdeme krabici, odstraníme její kolizi
                if (crateBoundaryIndex !== -1) {
                    boundaries.splice(crateBoundaryIndex, 1);
                    console.log(`Kolize krabice odstraněna na pozici: (${j * tileSize}, ${i * tileSize})`);
                } else {
                    console.log(`Kolize krabice nenalezena na pozici: (${j * tileSize}, ${i * tileSize})`);
                }
            }
        });
    });
}
export function checkTankCollisionWithCrates(player) {
    return bulletCollisionsMap.some((row, i) => {
        return row.some((cell, j) => {
            // Kontrolujeme kolizi pro nepoškozené (1666) i poškozené (1667) krabice
            if (cell === 1666 || cell === 1667) {
                const crateBoundary = {
                    position: { x: j * tileSize, y: i * tileSize },
                    width: tileSize,
                    height: tileSize
                };
                // Použijeme rectangularCollision pro kontrolu kolize
                return rectangularCollision({
                    rectangle1: player,
                    rectangle2: crateBoundary
                });
            }
            return false;
        });
    });
}