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
        
        // Physics
        this.speed = 300;
        this.jumpForce = 20 * 100;
        this.g = 9.82 * 5; // px / s
        this.vel = [0, 0];

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
            /*if (keyIsDown(this.keyCodes.jump) && this.y == sH * level.levelData.value.floorPosition - this.size) {
                this.vel[1] -= this.jumpForce;
            }*/
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
        if (this.y < height * (height - 50) - this.size) {
          this.vel[1] -= this.g * delta * 100;
        } else if (this.vel[1] > 0) {
          this.vel[1] = 0; 
        }
  
        if (movementToDo[0] == 0) {
            this.currentAnimation = this.standingAnimation;
        } else if (movementToDo[0] != 0) {
            this.currentAnimation = this.walkingAnimation;
        }

        self.tempCollision = level.checkCollision([this.x + 400 - this.size / 2, this.y + 225 - this.size / 2], [this.size, this.size]);
        if (self.tempCollision != false) {
            console.log(self.tempCollision);
        }

        // Movement
        this.x += movementToDo[0] * delta;
        this.y += this.vel[1] * delta;
        this.y = mouseY;

        // Left and right side boundary
        if (this.x > 800) {
            this.x = 800;
        }
        if (this.x < 0 - this.size) {
            this.x = 0 - this.size;
        }

        // Bottom of screen boundary
        if (this.y > height - this.size) {
          this.y = height  - this.size;
        }
    }

    detectCollision() {

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
        translate(this.drawX - 50 * scaleX * this.direction, height / 2 - (this.size * scaleY) / 2)
        scale(this.direction,1);
        noSmooth();
        image(this.currentAnimation.get(),0,0, this.size * scaleX, this.size * scaleY);
        pop()
    }
  }