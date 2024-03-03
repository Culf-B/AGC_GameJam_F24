class Player {
    /*
    Basic player class
    */
    constructor(mLeft, mRight, jump, interact, spawnPos) {
        this.keyCodes = {
            "mLeft": mLeft,
            "mRight": mRight,
            "jump": jump,
            "interact": interact
        };
        this.jumpKeyPressed = false;
        
        // Physics
        this.speed = 300;
        this.jumpForce = 1300;
        this.g = 9.82 * 5; // px / s
        this.vel = [0, 0];
        this.gliderGMultiplier = 0.1;

        // Animations
        this.standingAnimation = new GameAnimation(
            0.5,
            [
                "assets/playerAssets/duckStand1.png",
                "assets/playerAssets/duckStand2.png"
            ]
        )
        this.walkingAnimation = new GameAnimation(
            0.2,
            [
                "assets/playerAssets/duckWalk1.png",
                "assets/playerAssets/duckWalk2.png",
                "assets/playerAssets/duckWalk3.png",
                "assets/playerAssets/duckWalk4.png"
            ]
        )
        this.currentAnimation = this.standingAnimation;
        
        // Position and size
        this.x = 0;
        this.y = 0;
        this.size = 100;
        this.onGround = false;
        this.glide = false;

        this.hitboxXOffset = 30;
        this.hitboxYOffset = 30;
        this.hitBoxWidth = 40;
        this.hitBoxHeight = 66;

        this.freeMove = false;
        this.playermove=1;
        this.direction = 1;

        this.inInteraction = false;
        this.wantsInteraction = false;
        this.currentInteraction = [];
        this.interactionIndex = 0;
        this.interactionKeyLastState = false;
        this.interactionSkipTimer = 0;
    }

    getPos() {
        return [this.x, this.y]
    }
  
    getDrawOffset(scaleX, scaleY) {
        return [((width / 2) - ((this.size * scaleX) / 2) * this.direction), height / 2 - (this.size * scaleY) / 2]
    }

    update(delta, level) {
        /*
        Events and movement
        Argument "delta" has to be time in seconds since the last frame (deltaTime / 1000)
        */
        this.currentAnimation.update(delta)

        let movementToDo = [0, 0];
        // Events
        if (!this.inInteraction) {
            if (keyIsDown(this.keyCodes.mLeft)) {
                movementToDo[0] += 1 * this.speed;
                this.direction = 1;
            }
            if (keyIsDown(this.keyCodes.mRight)) {
                movementToDo[0] -= 1 * this.speed;
                this.direction = -1;
            }
            // Do jump
            if (keyIsDown(this.keyCodes.jump) && this.onGround) {
                this.vel[1] += this.jumpForce;
                this.jumpKeyPressed = true;
            }
            // Toggle glide
            if (keyIsDown(this.keyCodes.jump) && !this.onGround && !this.jumpKeyPressed) {
                this.jumpKeyPressed = true;
                this.glide = true;
            } else if (this.jumpKeyPressed && !keyIsDown(this.keyCodes.jump)) {
                this.jumpKeyPressed = false;
                this.glide = false;
            } else if (this.onGround) {
                this.glide = false;
            }
        }
        // Interaction events / update
        if (keyIsDown(this.keyCodes.interact)) {
            if (!this.inInteraction && this.interactionSkipTimer > 1) {
                this.wantsInteraction = true;
            } else {
                this.wantsInteraction = false;
                if (this.interactionSkipTimer > 1) {
                    this.interactionSkipTimer = 0;
                    this.interactionIndex += 1
                    if (this.interactionIndex > this.currentInteraction.length - 1) {
                        this.inInteraction = false;
                        if (finalInteractionStarted) {
                            changeLevel(-2);
                        }
                    }
                }
            }
        } else {
            this.wantsInteraction = false;
        }
        this.interactionSkipTimer += delta;
        
        // Velocity changes on y axis (gravity and jump)
        this.currentGravityAccel = -this.g * delta * 100;
        if (this.glide && this.vel[1] + this.currentGravityAccel < 0) {
            this.currentGravityAccel *= this.gliderGMultiplier;
        }
        this.vel[1] += this.currentGravityAccel;
  
        if (movementToDo[0] == 0) {
            this.currentAnimation = this.standingAnimation;
        } else if (movementToDo[0] != 0) {
            this.currentAnimation = this.walkingAnimation;
        }

        this.onGround = false;
        this.yStart = this.y;
        this.vel1Start = this.vel[1];
        this.tempCollisions = level.checkCollision([-this.x - movementToDo[0] * delta + this.hitboxXOffset, -this.y - this.vel[1] * delta + this.hitboxYOffset], [this.hitBoxWidth, this.hitBoxHeight]);
        for (let i = 0; i < this.tempCollisions.length; i++) {
            this.tempCollision = this.tempCollisions[i].rect;
            // Ground collision
            if (
                this.tempCollision[1] + this.tempCollision[3] > -this.y + this.hitboxYOffset + this.hitBoxHeight &&
                this.tempCollisions[i].blocks[2] == true
            ) {
                this.vel[1] = 0
                this.y = -this.tempCollision[1] + this.hitBoxHeight + this.hitboxYOffset;
                this.onGround = true;
            }
            // Collisions right side
            else if (
                this.tempCollision[0] + this.tempCollision[2] > -this.x + this.hitboxXOffset + this.hitBoxWidth &&
                this.tempCollisions[i].blocks[0] == true
            ) {
                movementToDo[0] = 0;
                this.x = -this.tempCollision[0] + this.hitBoxWidth + this.hitboxXOffset;
            }
            // Collisions left side
            else if (
                this.tempCollision[0] < -this.x + this.hitboxXOffset &&
                this.tempCollisions[i].blocks[1] == true
            ) {
                movementToDo[0] = 0;
                this.x = -this.tempCollision[0] - this.tempCollision[2] + this.hitboxXOffset;
            }
        }

        // Movement
        this.x += movementToDo[0] * delta;
        this.y += this.vel[1] * delta;
    }

    draw(scaleX, scaleY, level) {
        /*
        Draw the player on the screen
        */
        // Determine player x position
        if (this.freeMove && this.x > 0) {
            this.drawX = this.x + sW / 2 - this.size / 2 - (level.levelWidth - level.sW);
        } else if (this.freeMove && this.x < 0) {
            this.drawX = this.x + sW / 2 - this.size / 2;
        } else {
            this.drawX = width / 2 - this.size / 2;
        }
        push()
        this.tempDrawOffset = this.getDrawOffset(scaleX, scaleY);
        translate(this.tempDrawOffset[0], this.tempDrawOffset[1]);
        scale(this.direction,1);
        noSmooth();
        image(this.currentAnimation.get(), 0, 0, this.size * scaleX, this.size * scaleY);
        //rect(this.hitboxXOffset * scaleX, this.hitboxYOffset * scaleY, this.hitBoxWidth * scaleX, this.hitBoxHeight * scaleY); // Hitbox
        pop()
    }
  }