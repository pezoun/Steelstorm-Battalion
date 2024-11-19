// classes.js
export class Boundary {
    constructor({ position, tileSize, context }) {
        this.position = position;
        this.width = tileSize;
        this.height = tileSize;
        this.context = context;
    }

    draw() {
        this.context.fillStyle = 'rgba(255, 0, 0, 0.0)';
        this.context.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Debug vykreslení hranic
        this.context.strokeStyle = 'rgba(255, 0, 0, 0.0)';
        this.context.strokeRect(this.position.x, this.position.y, this.width, this.height);
    }
}

export class Sprite {
    constructor({ position, image, width, height, rotation = 0, frames = { max: 1 }, context, rotationOffsetX = 0, rotationOffsetY = 0, hitbox = null, health = 100 }) {
        this.position = position;
        this.image = image;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.context = context;
        this.health = health;
        this.frames = {
            max: frames.max,
            val: 0,
            elapsed: 0
        };
        this.frameWidth = this.width / this.frames.max;
        this.moving = false;

        

        this.rotationOffsetX = rotationOffsetX;
        this.rotationOffsetY = rotationOffsetY;
        this.hitbox = hitbox || { width: this.frameWidth, height: this.height, offsetX: 0, offsetY: 0 };

        this.image.onload = () => {
            this.frameWidth = this.image.width / this.frames.max;
            this.height = this.image.height;
        };
    }

    draw() {
        this.context.save();

        // Posuneme kontext do požadovaného středu rotace
        this.context.translate(
            this.position.x + this.width / 2 + this.rotationOffsetX,
            this.position.y + this.height / 2 + this.rotationOffsetY
        );
        this.context.rotate(this.rotation);

        // Vykreslíme obrázek
        this.context.drawImage(
            this.image,
            this.frames.val * this.frameWidth,
            0,
            this.frameWidth,
            this.height,
            -this.frameWidth / 2 - this.rotationOffsetX,
            -this.height / 2 - this.rotationOffsetY,
            this.frameWidth,
            this.height
        );

        this.context.restore();

        // Vykreslení hitboxu pro debug
        if (this.debugHitbox) {
            const hitboxX = this.position.x + this.hitbox.offsetX;
            const hitboxY = this.position.y + this.hitbox.offsetY;
            const hitboxWidth = this.hitbox.width;
            const hitboxHeight = this.hitbox.height;

            this.context.strokeStyle = 'red';
            this.context.lineWidth = 2;
            this.context.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
        }
    }

    updateFrame() {
        
        if (this.moving && this.frames.max > 1) {
            this.frames.elapsed++;
            if (this.frames.elapsed % 10 === 0) {
                this.frames.val = (this.frames.val + 1) % this.frames.max;
            }
        } else {
            this.frames.val = 0;
        }
    }
}