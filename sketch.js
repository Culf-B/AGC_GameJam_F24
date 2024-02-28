class Level {
  constructor(path) {
    this.loadLevel(path);
    this.file = undefined;
    this.size = undefined;
    this.tileSet = undefined;
    this.tiles = undefined;

    this.loadingStatus = false; // True when done loading
  }
  loadLevel(path) {
    loadJSON(path, (file) => {
      this.file = file;
      this.loadingStatus = true;
    })
  }

  isDoneLoading() {
    return this.loadingStatus;
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

function setup() {
  createCanvas(400, 400);
  new Level("test.json");
}

function draw() {
  background(220);
}
