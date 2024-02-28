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
            this.blockingTiles.push([i, j]);
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

    this.blockingTiles.forEach(tile => {
      // X axis
      print(position, [tile[0] * this.displayTileSize, tile[1] * this.displayTileSize]);
      
      if (tile[0] * this.displayTileSize < position[0] + size[0] && (tile[0] + 1) * this.displayTileSize > position[0]) {
        // Y axis
        if (tile[1] * this.displayTileSize < position[1] + size[1] && (tile[1] + 1) * this.displayTileSize > position[1]) {
          return [tile[0] * this.displayTileSize, tile[1] * this.displayTileSize];
        }
      }
    });
    return false;
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
  level.loadLevel("levels/test.json");
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

  delta = deltaTime / 1000;

  player.update(delta, level);

  playerPos = player.getPos();
  level.updateDisplay(playerPos[0], playerPos[1] - height / 2);
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