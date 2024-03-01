class Level {
  constructor() {
    this.file;
    this.size;
    this.tileSet;
    this.tiles;

    this.displayTileSize;
    this.renderSurface;
    this.displaySurface;

    this.blockingTiles;
  }

  loadLevel(path) {
    loadJSON(path, (file) => {
      this.file = file;
      this.size = file.size;
      this.tileSet = new TileSet(file.tileSet);
      this.tiles = file.tiles;
      this.background = loadImage(file.background);
    })
  }

  setupRenderer(displayWindowWidth, displayWindowHeight, displayTileSize) {
    this.displayTileSize = displayTileSize;
    this.renderSurface = createGraphics(this.size[0] * displayTileSize, this.size[1] * displayTileSize);
    this.renderLevel();
    
    this.displaySurface = createGraphics(displayWindowWidth, displayWindowHeight);
  }

  renderLevel() {
    this.renderSurface.noSmooth();

    this.blockingTiles = [];

    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        this.tempImageType = this.tiles[i][j].type
        if (this.tempImageType != null) {
          // Handle tile properties
          this.tempProperties = this.tileSet.tileSet[this.tempImageType].properties
          if (this.tempProperties.blocking) {
            this.tempBXP = true;
            this.tempBXN = true;
            this.tempBYP = true;
            this.tempBYN = true;
            if (i > 0) {
              this.tempNeighborTileType = this.tiles[i - 1][j].type;
              if (this.tempNeighborTileType != null) {
                this.tempBXP = false;
                if (this.tileSet.tileSet[this.tempNeighborTileType].properties.blocking == false) {
                  this.tempBXP = true;
                }
              }
            }
            if (i < this.tiles.length - 1) {
              this.tempNeighborTileType = this.tiles[i + 1][j].type;
              if (this.tempNeighborTileType != null) {
                this.tempBXN = false;
                if (this.tileSet.tileSet[this.tempNeighborTileType].properties.blocking == false) {
                  this.tempBXN = true;
                }
              }
            }
            if (j > 0) {
              this.tempNeighborTileType = this.tiles[i][j - 1].type;
              if (this.tempNeighborTileType != null) {
                this.tempBYP = false;
                if (this.tileSet.tileSet[this.tempNeighborTileType].properties.blocking == false) {
                  this.tempBYP = true;
                  print("test", i, j);
                }
              }
            }
            if (j < this.tiles[i].length - 1) {
              this.tempNeighborTileType = this.tiles[i][j + 1].type;
              if (this.tempNeighborTileType != null) {
                this.tempBYN = false;
                if (this.tileSet.tileSet[this.tempNeighborTileType].properties.blocking == false) {
                  this.tempBYN = true;
                }
              }
            }
            this.blockingTiles.push({"pos": [i, j], "blocks": [this.tempBXP, this.tempBXN, this.tempBYP, this.tempBXN]});
          }

          // Render tile
          this.renderSurface.image(
            this.tileSet.tileSet[this.tempImageType].image,
            i * this.displayTileSize, j * this.displayTileSize,
            this.displayTileSize * this.tempProperties.dimensions[0], this.displayTileSize * this.tempProperties.dimensions[1]);          
        }
      }
    }
  }

  updateDisplay(offsetX, offsetY) {
    // Draw a specified portion of the rendered level to the displaySurface
    this.displaySurface.noSmooth();
    this.displaySurface.image(this.background, 0, 0, this.displaySurface.width, this.displaySurface.height);

    this.displaySurface.image(this.renderSurface, offsetX, offsetY);
  }

  displayLevel(scaleX, scaleY) {
    // Draw the displaySurface to the canvas
    image(this.displaySurface, 0, 0, this.displaySurface.width * scaleX, this.displaySurface.height * scaleY);
  }

  isDoneLoading() {
    return this.loadingStatus;
  }

  checkCollision(position, size) {
    this.tempCollisions = [];
    for (let i = 0; i < this.blockingTiles.length; i++) {
      this.tempTile = this.blockingTiles[i].pos;
      if (
          this.tempTile[0]       * this.displayTileSize < position[0] + size[0] &&// X axis
          (this.tempTile[0] + 1) * this.displayTileSize > position[0]           &&
          this.tempTile[1]       * this.displayTileSize < position[1] + size[1] &&// Y axis
          (this.tempTile[1] + 1) * this.displayTileSize > position[1]
      ) {
        this.tempCollisions.push(
          {"rect": [
            this.tempTile[0] * this.displayTileSize,
            this.tempTile[1] * this.displayTileSize,
            this.displayTileSize,
            this.displayTileSize
          ],
          "blocks": this.blockingTiles[i].blocks
        });
      }
    }
    return this.tempCollisions;
  }
}

class TileSet {
  constructor(rawTileSet) {
    this.tileSet = rawTileSet
    this.tileSet.forEach(tile => {
      tile.image = loadImage(tile.image);
    });
  }
}

var level;
const defaultCanvasWidth = 800;
const defaultCanvasHeight = 450;
var screenXmultiplier = 1;
var screenYmultiplier = 1;

function preload() {
  level = new Level();
  level.loadLevel("levels/tableTest1.json");
}

function setup() {
  createCanvas(defaultCanvasWidth, defaultCanvasHeight);
  windowResized();
  level.setupRenderer(defaultCanvasWidth, defaultCanvasHeight, 50);
  level.renderLevel();

  player = new Player(65, 68, 32, 69, level.file.properties.spawnPos);
}

function draw() {
  background(120, 100, 200);

  //delta = deltaTime / 1000;
  delta = 16.7 / 1000; // Lagspikes makes player glitch through the floor, so deltatime is temporarly disabled

  player.update(delta, level);
  playerPos = player.getPos();

  level.updateDisplay(playerPos[0] + defaultCanvasWidth / 2 - player.size / 2, playerPos[1] + defaultCanvasHeight / 2 - player.size / 2);
  level.displayLevel(screenXmultiplier, screenYmultiplier);
  
  player.draw(screenXmultiplier, screenYmultiplier);
}

function windowResized() {
  if (windowWidth < windowHeight * 1.77) {
    newWidth = windowWidth * 0.9;
    newHeight = (windowWidth / 1.77) * 0.9;
  } else {
    newWidth = (windowHeight / 0.5625) * 0.9;
    newHeight = windowHeight * 0.9;
  }
  resizeCanvas(newWidth, newHeight);

  screenXmultiplier = newWidth / defaultCanvasWidth;
  screenYmultiplier = newHeight / defaultCanvasHeight;
}