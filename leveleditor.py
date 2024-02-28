import pygame
import json
from os import path
import uielements

class Tile:
    def __init__(self, tileSet, tileType, x, y, tileSize):
        self.tileSet = tileSet
        self.tileType = tileType
        self.tileSize = tileSize
        self.changeType(self.tileType)
        self.x = x
        self.y = y

    def changeType(self, newType):
        self.tileType = newType
        if self.tileType == None:
            self.image = pygame.Surface([50, 50])
            self.image.fill([0, 0, 0])
        else:
            self.image = pygame.image.load(self.tileSet[self.tileType]["image"])
        
        self.image = pygame.transform.scale(self.image, self.tileSize)

    def draw(self, surface, tileOffsetX, tileOffsetY):
        surface.blit(self.image, [self.x * self.tileSize[0] + tileOffsetX * self.tileSize[0], self.y * self.tileSize[1] + tileOffsetY * self.tileSize[1]])

def saveLevel():
    levelFile["tiles"] = []

    for i, line in enumerate(loadedTiles):
        levelFile["tiles"].append([])
        for tile in line:
            levelFile["tiles"][i].append({"type": tile.tileType})

    with open(fileToOpen, "w") as f:
        f.write(json.dumps(levelFile, indent = 4))

    print("Level saved!")

fileToOpen = input('Filename: ')
fileToOpen += ".json"
# Hard coded value for testing
#fileToOpen = "test.json"

print("Loading level...")
if not path.exists(fileToOpen):
    print(f'The file "{fileToOpen}" doesn\'t exist!')

    print("Performing first time level setup")
    
    levelFile = {}

    # Size
    width = int(input("Level width (in tiles): "))
    height = int(input("Level height (in tiles): "))
    levelFile["size"] = [width, height]

    # Tileset
    levelFile["tileSet"] = []

    # Background
    levelFile["background"] = ""

    # Properties
    levelFile["properties"] = {}

    # Tiles
    levelFile["tiles"] = []
    for i in range(width):
        levelFile["tiles"].append([])
        for j in range(height):
            levelFile["tiles"][i].append({"type":None})
    
    # Save
    with open(fileToOpen, "w") as f:
        f.write(json.dumps(levelFile, indent = 4))

    print("Setup complete, level saved!")

else:
    with open(fileToOpen, "r") as f:
        levelFile = json.loads(f.read())
    print("Level loaded!")

print("Running graphical level editor")

pygame.init()
pygame.font.init()

font = pygame.font.SysFont("Consolas", 14)

screen = pygame.display.set_mode([800, 800])
pygame.display.set_caption("Graphical level editor")
clock = pygame.time.Clock()

run = True

tileSize = [25, 25]
tileOffsetX = 0
tileOffsetY = 0
# Levelsize
width = levelFile["size"][0]
height = levelFile["size"][1]

hoveringType = None
selectedType = None

# Windows
renderSurface = pygame.Surface([500, 500])
renderSurfacePos = [0, 0]

renderInfo = pygame.Surface([500, 80])

tileEditorSurface = pygame.Surface([290, 590])
tileEditorSurfacePos = [510, 0]

brushWindow = pygame.Surface([800, 200])
brushWindowPos = [0, 600]

# Ui elements setup
standard_button_colorscheme = {
    "standard": [(255,255,255),(255,255,255),(0,0,255,32)],
    "click":    [(255,255,255),(255,255,255),(0,0,255,128)],
    "hover":    [(255,255,255),(255,255,255),(0,0,255,64)]
}

tileEditorGroup = uielements.Group(tileEditorSurfacePos)

saveButton = uielements.Button(
    tileEditorSurface,
    pygame.Rect(10,10,100,50),
    standard_button_colorscheme,
    font,
    text="Save level",
    command = lambda: saveLevel()
)

tileEditorGroup.add_elements(saveButton)
tileEditorGroup.activate_all()

loadedTiles = []
for i, row in enumerate(levelFile["tiles"]):
    loadedTiles.append([])
    for j, tile in enumerate(row):
        loadedTiles[i].append(Tile(levelFile["tileSet"], tile["type"], i, j, tileSize))

while run:
    for event in pygame.event.get():
        if event.type == pygame.QUIT or event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            run = False
        elif event.type == pygame.KEYUP:
            if event.key == pygame.K_UP:
                tileOffsetY += 1
            elif event.key == pygame.K_DOWN:
                tileOffsetY -= 1
            elif event.key == pygame.K_LEFT:
                tileOffsetX += 1
            elif event.key == pygame.K_RIGHT:
                tileOffsetX -= 1
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                
                m_pos = pygame.mouse.get_pos()

                # If on brush window
                if pygame.Rect(brushWindowPos, brushWindow.get_size()).collidepoint(m_pos):
                    selectedType = hoveringType
    
    if pygame.mouse.get_pressed()[0]:
        m_pos = pygame.mouse.get_pos()
        if pygame.Rect(renderSurfacePos, renderSurface.get_size()).collidepoint(m_pos):
            tileX = int(m_pos[0] / tileSize[0]) - tileOffsetX
            tileY = int(m_pos[1] / tileSize[1]) - tileOffsetY
            if tileX < width and tileX >= 0 and tileY < width and tileY >= 0:
                loadedTiles[tileX][tileY].changeType(selectedType)

    screen.fill([100, 100, 100])

    hoveringType = None

    # Render tiles
    renderSurface.fill([255, 255, 255])

    for row in loadedTiles:
        for tile in row:
            tile.draw(renderSurface, tileOffsetX, tileOffsetY)

    screen.blit(renderSurface, [0, 0])

    # Render window info
    renderInfo.fill([50, 50, 50])

    renderInfo.blit(
        font.render(
            f'''Position: {-tileOffsetX}, {-tileOffsetY}
Levelfile: {fileToOpen}
Selected tile type index: {selectedType}
Selected tile type path: {levelFile["tileSet"][selectedType]["image"] if selectedType != None else None}
            ''',
            True, [0, 255, 0]), [0, 0])

    screen.blit(renderInfo, [0, 510])

    # Tile editor window
    tileEditorSurface.fill([50, 50, 50])

    tileEditorGroup.update()

    screen.blit(tileEditorSurface, tileEditorSurfacePos)

    # Brush window
    brushWindow.fill([50, 50, 50])

    line = 0
    maxTilesPrLine = brushWindow.get_width() // 50
    for i, tileType in enumerate(levelFile["tileSet"]):
        if i  > maxTilesPrLine:
            line += 1
        brushWindow.blit(pygame.transform.scale(pygame.image.load(tileType["image"]), [50, 50]), [(i - line * maxTilesPrLine) * 50, line * 50])
        if pygame.Rect((i - line * maxTilesPrLine) * 50 + brushWindowPos[0], line * 50 + brushWindowPos[1], 50, 50).collidepoint(pygame.mouse.get_pos()):
            hoveringType = i


    screen.blit(brushWindow, brushWindowPos)

    pygame.display.update()
    clock.tick(60)