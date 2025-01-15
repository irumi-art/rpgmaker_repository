var Imported = Imported || {};
Imported.CamControl = true;

(function() {

// Load plugin parameters and set tile size
const Params = PluginManager.parameters('CamControl');
const TileSize = Number(Params['Tile Size'] || 48);

// Adjust map display coordinates to avoid jitter
Game_Map.prototype.displayX = function() {
    return Math.round(this._displayX * TileSize) / TileSize;
};

Game_Map.prototype.displayY = function() {
    return Math.round(this._displayY * TileSize) / TileSize;
};

// Extend plugin command handling to include camera controls
const OriginalPluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    if (command === 'CAM') handleCameraCommand(args); // Handle "CAM" plugin command
    else OriginalPluginCommand.call(this, command, args);
};

// Function to process "CAM" plugin commands
function handleCameraCommand(args) {
    const key = args[0]?.toLowerCase(); // Command type: player, event, disable, or x,y position
    const speed = getValue(args[1] || 800); // Camera scroll speed

    switch (key) {
        case 'player':
            $gameMap.setCameraTarget($gamePlayer, speed); // Focus on player
            break;
        case 'event':
            $gameMap.setCameraTarget($gameMap.event(getValue(args[1])), getValue(args[2]) || speed); // Focus on event
            break;
        case 'disable':
            $gameMap.resetCamera(); // Reset camera to default behavior
            break;
        default:
            const x = getValue(args[0]), y = getValue(args[1]);
            $gameMap.setCameraTarget({ x, y, _realX: x, _realY: y }, speed); // Focus on specified x,y coordinates
            break;
    }
}

// Utility function to parse values or game variables
function getValue(input) {
    return input?.startsWith('v') ? $gameVariables.value(Number(input.slice(1))) : Number(input);
}

// Set the camera target and speed
Game_Map.prototype.setCameraTarget = function(target, speed = 800) {
    this.cameraTarget = target; // Define camera target (player, event, or coordinates)
    this.cameraSpeed = speed;  // Define camera scroll speed
    this.defaultCamera = false; // Indicate custom camera is active
};

// Reset the camera to follow the player
Game_Map.prototype.resetCamera = function() {
    this.cameraTarget = $gamePlayer; // Reset target to player
    this.defaultCamera = true;      // Enable default camera behavior
};

// Overwrite map scrolling to use camera target if set
const OriginalMapScroll = Game_Map.prototype.updateScroll;
Game_Map.prototype.updateScroll = function() {
    if (this.defaultCamera || !this.cameraTarget) {
        return OriginalMapScroll.call(this); // Use default scroll if no custom camera
    }

    const centerX = Graphics.boxWidth / 2, centerY = Graphics.boxHeight / 2; // Screen center coordinates
    const targetX = this.cameraTarget.screenX(), targetY = this.cameraTarget.screenY(); // Target screen position
    const dx = Math.abs(targetX - centerX) / this.cameraSpeed; // Horizontal scroll speed
    const dy = Math.abs(targetY - centerY) / this.cameraSpeed; // Vertical scroll speed

    // Adjust scroll based on target position relative to screen center
    if (targetY < centerY) this.scrollUp(dy);
    if (targetY > centerY) this.scrollDown(dy);
    if (targetX < centerX) this.scrollLeft(dx);
    if (targetX > centerX) this.scrollRight(dx);
};

})();
