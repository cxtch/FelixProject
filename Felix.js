//@ts-nocheck
var start = Date.now();
//using typescript because compile to es5 is so nice
/**
 * =============================
 * POLYFILLS
 * =============================
 */
Array.prototype.includes = function (item) {
    for (var i = 0; i < this.length; i++) {
        if (item === this[i])
            return true;
    }
    return false;
}
/**
 * =============================
 * GLOBALS
 * =============================
 */
var fpsNum;
var suffix = String.fromCharCode(160) + "\u00A77Felix";
var Mouse = org.lwjgl.input.Mouse;
var Keyboard = org.lwjgl.input.Keyboard;
var Display = org.lwjgl.opengl.Display;
var GL11 = org.lwjgl.opengl.GL11;
var range = 4; //EntityFromFOV
var modulelist = ["autoclicker", "velocity", "reach", "stealer", "sneak"]; //legit indicator
var anchorX = 280; //TargetHud
var anchorY = 245; //TargetHud
var minVelo = 30; //SmartVelocity
var randomVelo = 70; //SmartVelocity
var maxHealth = 20; //TargetHud
var jitterY = 1; //JitterClick
var jitterX = 1; //JitterClick
var hurtTicks = 0; //SmartReach
var sneaking = false; //GodBridge
var o = 29; //Breath
var changerate = 0.333333334; //Breath
var fps = []; //Breath
var reach = 3.5; //SmartReach
var healthThreshold = 15; //SmartReach LowHealthIncrease
var healthLowest = 5; //SmartReach when reach should max out
var reachIncrease = 0.5; //SmartReach
var comboMax = 4; //SmartReach combo hits until max reach
var currentTime = system.time();
var placeable = /plank|log|stone|wool|glass|clay|sponge|emerald|redstone|block|grass/gi;
var tools = /sword|axe|shovel|dust/gi;
for (i = 0; i < 60; i++) {
    var frame = {
        timeStamp: currentTime
    };
    fps.push(frame);
}
var breathIn = true;
/**
 * =============================
 * COMMAND HANDLER
 * =============================
 */
var Handler = {
    prefix: '!',
    listeners: [],
    keepString: false,
    setKeepString: function (value) {
        this.keepString = value;
    },
    setPrefix: function (p) {
        this.prefix = p;
    },
    on: function (a, b) {
        var c = {
            listener: a,
            fn: b
        };
        this.listeners.push(c);
    },
    findListener: function (c) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].listener === c) {
                break;
            }
        }
        if (typeof this.listeners[i] === 'undefined')
            return -1;
        return i;
    },
    listen: function (packetId, data) {
        if (packetId !== 7)
            return false;
        if (data.charAt(0) !== this.prefix)
            return false;
        data = data.match(/[A-z\d\s\!\@\#\$\%\^\&\*\(\)\?\.\<\,\;\\\`\~\"\:\+\=`]/g).join('');
        var com = data.trim().replace(this.prefix, '').toLowerCase().split(' ');
        if (this.findListener(com[0]) === -1)
            return true;
        this.q.cmd = this.listeners[this.findListener(com[0])].fn;
        if (com[1]) {
            if (this.keepString)
                this.q.args = com.slice(1).join().replace(/\w(,)/g, function (match) {
                    return match.replace(',', '') + ' ';
                });
            else
                this.q.args = com.slice(1);
        }
        else
            this.q.args = undefined;
        this.q.d = true;
        return true;
    },
    q: {
        d: false,
    },
    execute: function () {
        if (!this.q.d)
            return;
        this.q.cmd(this.q.args);
        this.q.d = false;
    }
};
/**
 * =============================
 * GRADIENTS
 * =============================
 */
var Gradients = {
    Rainbow: {
        0: [255, 20, 20],
        0.16666666666: [255, 255, 20],
        0.33333333333: [20, 255, 20],
        0.5: [20, 255, 255],
        0.66666666666: [20, 20, 255],
        0.83333333: [220, 20, 255],
        1: [255, 20, 20]
    },
    Calm: {
        0: [28, 176, 248],
        0.166666666666: [0, 193, 254],
        0.333333333333: [0, 207, 236],
        0.5: [0, 218, 197],
        0.666666666666: [0, 225, 139],
        0.833333333333: [56, 228, 65],
        1: [28, 178, 248]
    },
    Astolfo: {
        0: [50, 220, 255],
        0.3: [189, 40, 252],
        0.5: [255, 128, 162],
        0.6: [189, 40, 252],
        1: [50, 220, 255]
    },
    Instagram: {
        0: [100, 44, 242],
        0.25: [253, 29, 96],
        0.5: [252, 176, 69],
        0.75: [253, 29, 96],
        1: [100, 44, 242]
    }
};
/**
 * =============================
 * GODBRIDGE MAIN FUNCTION
 * =============================
 */
var GodBridge = function () {
    this.getName = function () { return "GodBridge" + suffix; };
    this.onEnable = function () {
        sneaking = false;
        if (moduleManager.getBoolean("Always_Safewalk"))
            localPlayer.sendMessage(".safewalk");
        localPlayer.sendMessage(".sneak Mode Watchdog");
        localPlayer.sendMessage(".sneak hold false");
        localPlayer.sendMessage(".hide safewalk");
        localPlayer.sendMessage(".hide sneak");
    };
    this.onPreUpdate = function () {
        entity.getEntities();
        var playerId = localPlayer.getId();
        var boundingBox = entity.getBoundingBox(playerId);
        var cPos = localPlayer.getPosition();
        var itemName = entity.getHeldItemName(playerId);
        if (!localPlayer.isOnGround()) {
            if (sneaking) {
                unToggleSneak();
            }
            return;
        }
        if (moduleManager.getBoolean("BlockCheck") && !isBlock(itemName))
            return;
        if (moduleManager.getBoolean("RandomDelay"))
            placeDelay();
        if (Math.abs(boundingBox[5].toFixed(2) % 1) > .75 || Math.abs(boundingBox[5].toFixed(2) % 1) < .10) {
            if (world.getBlock(cPos[0], cPos[1] - 1, cPos[2]) === "tile.air") {
                if (!sneaking) {
                    toggleSneak();
                    return;
                }
            }
            else if (sneaking) {
                unToggleSneak();
                return;
            }
        }
        else if (Math.abs(boundingBox[5].toFixed(2) % 1) < .65 && Math.abs(boundingBox[5].toFixed(2) % 1) > .32) {
            if (world.getBlock(cPos[0], cPos[1] - 1, Math.floor(boundingBox[5])) === "tile.air") {
                if (!sneaking) {
                    toggleSneak();
                    return;
                }
            }
        }
        else if (Math.abs(boundingBox[3].toFixed(2) % 1) > .75 || Math.abs(boundingBox[3].toFixed(2) % 1) < .10) {
            if (world.getBlock(cPos[0] + 0.3, cPos[1] - 1, cPos[2]) === "tile.air" || world.getBlock(cPos[0] - 0.3, cPos[1] - 1, cPos[2]) === "tile.air") {
                if (!sneaking) {
                    toggleSneak();
                    return;
                }
            }
            else if (sneaking) {
                unToggleSneak();
                return;
            }
        }
        else if (Math.abs(boundingBox[3].toFixed(2) % 1) < .65 && Math.abs(boundingBox[3].toFixed(2) % 1) > .32) {
            if (world.getBlock(Math.floor(boundingBox[3]), cPos[1] - 1, cPos[2]) === "tile.air") {
                if (!sneaking) {
                    toggleSneak();
                    return;
                }
            }
        }
        else if (sneaking) {
            unToggleSneak();
        }
    };
    this.onDisable = function () {
        if (moduleManager.isModuleActive("safewalk"))
            localPlayer.sendMessage(".safewalk");
        if (moduleManager.isModuleActive("sneak"))
            localPlayer.sendMessage(".sneak");
        localPlayer.sendMessage(".show safewalk");
        localPlayer.sendMessage(".show sneak");
        world.setTimer(1);
        sneaking = false;
    };
};
/**
 * =============================
 * GODBRIDGE EXTRA FUNCTIONS
 * =============================
 */
function isBlock(itemName) {
    if (itemName.match(placeable) && !itemName.match(tools))
        return true;
    return false;
}
function toggleSneak() {
    var pitch = localPlayer.getAngles()[0];
    if (moduleManager.getBoolean("PitchCheck") && pitch < 65)
        return;
    if (!moduleManager.getBoolean("Always_Safewalk"))
        localPlayer.sendMessage(".safewalk");
    localPlayer.sendMessage(".sneak");
    sneaking = true;
    if (moduleManager.getBoolean("RealisticSneak"))
        world.setTimer(0.65);
}
function unToggleSneak() {
    if (!moduleManager.getBoolean("Always_Safewalk") && moduleManager.isModuleActive("safewalk"))
        localPlayer.sendMessage(".safewalk");
    if (moduleManager.isModuleActive("sneak")) {
        localPlayer.sendMessage(".sneak");
        entity.getEntities();
    }
    world.setTimer(1);
    sneaking = false;
}
function placeDelay() {
    if (localPlayer.getTicksExisted() % 5 === 0) {
        var r = Math.round(Math.random() * 3);
        localPlayer.sendMessage(".fastplace delay " + r);
    }
}
/**
 * =============================
 * VISUAL FUNCTIONS
 * =============================
*/
function breath(o, breathIn) {
    if (breathIn) {
        o += 0.66666667 / (fpsNum / 60);
        if (o >= 255)
            o = 254;
        return o;
    }
    o -= 0.66666667 / (fpsNum / 60);
    return o;
}
var rgbToHex = function (array) {
    var rgb = array[0];
    rgb = (rgb << 8) + array[1];
    rgb = (rgb << 8) + array[2];
    return rgb;
};
var DrawRectWithDistance = function (x, y, xdistance, ydistance, r, g, b, a) {
    return render.drawRect(x + xdistance, y + ydistance, x, y, r, g, b, a);
};
var gradient = function (stops, render) {
    var greatest = 1;
    var lowest = 0;
    var ats = Object.keys(stops);
    if (render < 0) {
        return stops[ats[0]];
    }
    if (render > 1) {
        return stops[ats[ats.length - 1]];
    }
    for (var i = 0; i < ats.length; i++) {
        var at = parseFloat(ats[i]);
        if (render < at && at < greatest) {
            greatest = at;
        }
        else if (render > at && at > lowest) {
            lowest = at;
        }
        if (at == render) {
            return stops[at];
        }
    }
    var start = stops[lowest];
    var end = stops[greatest];
    var width = greatest - lowest;
    var offset = (render - lowest) / width;
    var percentOfStart = 1 - offset;
    var percentOfEnd = Math.min(1, offset);
    var mixed = [
        Math.min(255, (start[0] * percentOfStart) + (end[0] * percentOfEnd)),
        Math.min(255, (start[1] * percentOfStart) + (end[1] * percentOfEnd)),
        Math.min(255, (start[2] * percentOfStart) + (end[2] * percentOfEnd))
    ];
    return mixed;
};
var rgbToHex = function (array) {
    var rgb = array[0];
    rgb = (rgb << 8) + array[1];
    rgb = (rgb << 8) + array[2];
    return rgb;
};
/**
 * =============================
 * BETTER/LEGIT INDICATOR
 * thanks to JohnDuckesent
 * =============================
 */
var LegitIndicator = function () {
    this.getName = function () { return "LegitIndicator" + suffix; };
    var mColor = {
        disable: [255, 0, 0, 255],
        enable: [0, 255, 0, 255]
    };
    var mActiveToColor = function (i) {
        if (moduleManager.isModuleActive(i)) {
            return mColor['enable'];
        }
        else {
            return mColor['disable'];
        }
    };
    var X = 0;
    this.onRender2D = function (width, height, partialTicks) {
        var frame = {
            timeStamp: system.time()
        };
        fps.push(frame);
        for (i = 0; i < fps.length; i++) {
            if (system.time() - fps[i].timeStamp >= 1000)
                fps.shift();
        }
        fpsNum = fps.length;
        X += partialTicks / 350;
        X = X % 1;
        var colorArray = gradient(Gradients.Calm, X);
        var size = 0;
        for (var i in modulelist) {
            size += 20;
            // Draw Module
            if (o >= 253)
                breathIn = false;
            if (o <= 30)
                breathIn = true;
            o = breath(o, breathIn);
            DrawRectWithDistance(10, 90 + size, 90, 2, 17, 17, 17, o);
            DrawRectWithDistance(10, 105 + size, 90, 2, 17, 17, 17, o);
            DrawRectWithDistance(85, 92 + size, 13, 13, mActiveToColor(modulelist[i])[0], mActiveToColor(modulelist[i])[1], mActiveToColor(modulelist[i])[2], mActiveToColor(modulelist[i])[3]);
            DrawRectWithDistance(83, 92 + size, 2, 13, 17, 17, 17, o);
            DrawRectWithDistance(10, 90 + size, 2, 15, 17, 17, 17, o);
            DrawRectWithDistance(98, 90 + size, 2, 15, 17, 17, 17, o);
            DrawRectWithDistance(12, 92 + size, 71, 13, 75, 73, 73, o);
            render.drawString(modulelist[i], 20, 95 + size, rgbToHex(colorArray));
        }
        // Draw Title / Rectangle
        DrawRectWithDistance(6, 82, 98, 14, 17, 17, 17, 255);
        render.drawString("Module Info", 27, 85, rgbToHex(colorArray));
        // Draw Base Rectangle
        DrawRectWithDistance(6, 102, 2, 13 + size, 17, 17, 17, 175);
        DrawRectWithDistance(102, 102, 2, 13 + size, 17, 17, 17, 175);
        DrawRectWithDistance(6, 100, 98, 2, 17, 17, 17, 175);
        DrawRectWithDistance(6, 115 + size, 98, 2, 17, 17, 17, 175);
    };
};
/**
 * =============================
 * SMART VELOCITY
 * =============================
 */
var SmartVelocity = function () {
    this.getName = function () { return "SmartVelocity" + suffix; };
    this.onEnable = function () { return localPlayer.sendMessage(".hide velocity"); };
    this.onPreUpdate = function () {
        if (moduleManager.getBoolean("Require Click")) {
            if (moduleManager.isModuleActive("velocity") && !Mouse.isButtonDown(0) && !Mouse.isButtonDown(1)) {
                localPlayer.sendMessage('.velocity');
            }
            else if (!moduleManager.isModuleActive("velocity") && (Mouse.isButtonDown(0) || Mouse.isButtonDown(1))) {
                localPlayer.sendMessage(".velocity");
            }
        }
        if (moduleManager.getBoolean("Random")) {
            if (localPlayer.getHurtTime() === 9) {
                var newVelocity = (Math.random() * randomVelo + minVelo).toFixed(2);
                localPlayer.sendMessage(".velocity horizontal " + newVelocity);
            }
        }
    };
    this.onDisable = function () { return localPlayer.sendMessage(".show velocity"); };
};
/**
 * =============================
 * COMMANDS
 * =============================
 */
Handler.on('legitindicator', function (args) {
    if (!args) {
        chat.send('\xA7clegitindicator\xA7r: swap <module> <module>, reset');
        return;
    }
    switch (args[0]) {
        case ('swap'):
            modulelist[modulelist.indexOf(args[1])] = args[2];
            return;
        case ('reset'):
            modulelist = ["autoclicker", "velocity", "reach", "stealer", "sneak"];
            return;
    }
});
Handler.on('prefix', function (args) {
    if (!args) {
        chat.send('please include your desired prefix');
        return;
    }
    Handler.setPrefix(args[0]);
    chat.send("successfully set the prefix to " + args[0]);
});
Handler.on('fovhud', function (args) {
    if (!args) {
        chat.send("\u00A7cFOVHud\u00A7r: pos, reset");
        return;
    }
    if (args[0] === "pos") {
        if (!args[1] || !args[2]) {
            chat.send("proper usage: " + Handler.prefix + "fovhud pos <x> <y>");
            return;
        }
        anchorX = +args[1];
        anchorY = +args[2];
    }
    if (args[0] === "reset") {
        anchorX = 280;
        anchorY = 245;
    }
});
Handler.on('smartvelocity', function (args) {
    if (!args) {
        chat.send("\u00A7cSmartVelocity\u00A7r: set <min> <max>");
        return;
    }
    if ((args[0] == 'set') && (!args[1] || !args[2])) {
        chat.send("use command correctly, noob. set <min> <max>");
    }
    if (args[0] == 'set' && args[1] && args[2]) {
        minVelo = args[1];
        randomVelo = args[2] - args[1];
    }
});
Handler.on('jitterclick', function (args) {
    if (!args) {
        chat.send('\xA7cJitterClick\xA7r: reset, set <jitterX> <jitterY>');
        return;
    }
    switch (args[0]) {
        case ('reset'):
            jitterX = 1.5;
            jitterY = 1.5;
        case ('set'):
            if (!args[1] || !args[2]) {
                chat.send('set <jitterX> <jitterY>');
                return;
            }
            jitterX = args[1];
            jitterY = args[2];
            chat.send("set the new jitter values to " + args[1] + " and " + args[2]);
    }
});
Handler.on('limbo', function () {
    localPlayer.sendMessage('\xA7');
});
Handler.on('smartreach', function (args) {
    if (!args) {
        chat.send('\xA7cSmartReach\xA7r: reach, reach_max, health_threshold, health_lowest, default');
        return;
    }
    if (args[0] === 'default') {
        reach = 3.4;
        reachIncrease = 0.5;
        comboMax = 4;
        healthLowest = 5;
        healthThreshold = 15;
        return;
    }
    if (!args[1]) {
        chat.send("please include the setting's new value");
    }
    switch (args[0]) {
        case 'reach':
            reach = parseInt(args[1]);
            break;
        case 'reach_max':
            reachIncrease = parseInt(args[1]);
            break;
        case 'health_threshold':
            healthThreshold = parseInt(args[1]);
            break;
        case 'heatl_lowest':
            healthLowest = parseInt(args[1]);
            break;
    }
});
var bindAble = ['godbridge', 'fovhud', 'smartreach', 'smartvelocity', 'legitindicator'];
Handler.on('bind', function (args) {
    if (!args) {
        chat.send("\u00A7cBinds\u00A7r, usage: " + Handler.prefix + "bind add module key, " + Handler.prefix + "bind del module");
        return;
    }
    if (args[0] === 'add' && args[2] && bindAble.includes(args[1])) {
        localPlayer.sendMessage(".bind add " + args[1] + suffix + " " + args[2]);
    }
    else if (args[0] === 'del' && args[1] && bindAble.includes(args[1]))
        localPlayer.sendMessage(".bind del " + args[1] + suffix);
    else
        chat.send("\u00A7cBinds\u00A7r, usage: " + Handler.prefix + "bind add module key, " + Handler.prefix + "bind del module");
});
Handler.on('help', function () {
    chat.send('\xA7csmartvelocity\xA7r, manage settings related to smart velocity');
    chat.send('\xA7cfovhud\xA7r, manage settings related to FOVHud');
    chat.send('\xA7cprefix\xA7r, change the command prefix');
    chat.send('\xA7clegitindicator\xA7r, change the modules in legit indicator');
    chat.send('\xA7cjitterclick\xA7r, change the module\'s jitter amount (default: 1)');
    chat.send('\xA7climbo\xA7r, send yourself to limbo');
    chat.send('\xA7csmartreach\xA7r, manage smart reach values');
});
/**
 * =============================
 * FELIX COMMANDS IMPLEMENTS COMMAND HANDLER
 * =============================
 */
var FelixCommands = function () {
    this.getName = function () { return "FelixCommands"; };
    this.onSendPacket = function (id, data) { return Handler.listen(id, data); };
    this.onPreUpdate = function () { return Handler.execute(); };
};
/**
 * =============================
 * TARGHUD GLOBALS
 * DO NOT TOUCH UNLESS YOU KNOW WHAT YOU ARE DOING
 * =============================
 */
var X = 0;
var scaleFactor = 1.5;
var booleans = ['Astolfo', 'Rainbow', 'Instagram', 'Calm'];
var ratioWidth;
var ratioHeight;
var newClick = false;
var inBox = false;
var xOffSet;
var yOffSet;
/**
 * =============================
 * TARGETHUD MAIN FUNCTION
 * =============================
 */
var TargetHud = function () {
    this.getName = function () { return "FOVHud" + suffix; };
    this.onRender2D = function (w, h, partialTicks) {
        var target = undefined;
        entity.getEntities();
        ratioWidth = Display.getWidth() / w;
        ratioHeight = Display.getHeight() / h;
        if (moduleManager.getBoolean("RequireClick") && !Mouse.isButtonDown(0) && !moduleManager.getBoolean("Killaura"))
            return;
        if (moduleManager.getBoolean("Killaura")) {
            if (!moduleManager.isModuleActive("killaura"))
                return;
            if (localPlayer.getKillAuraTarget() != -1) {
                target = {
                    name: entity.getName(localPlayer.getKillAuraTarget()),
                    health: entity.getHealth(localPlayer.getKillAuraTarget()).toFixed(0)
                };
            }
            else if (moduleManager.getBoolean("RePosition"))
                target = undefined;
            else
                return;
        }
        else {
            target = EntityFromFOV();
        }
        if (typeof target == 'undefined' && !moduleManager.getBoolean("RePosition"))
            return;
        if (moduleManager.getBoolean("RePosition") && typeof target == 'undefined') {
            target = {
                name: 'Player',
                health: '20'
            };
        }
        if (target.health <= 0)
            return;
        X += partialTicks / 350;
        X = X % 1;
        for (i = 0; i < booleans.length; i++) {
            if (moduleManager.getBoolean(booleans[i])) {
                var g = Gradients[booleans[i]];
                break;
            }
        }
        if (g === undefined)
            var g = Gradients.Calm;
        var colorArray = gradient(g, X);
        if (!moduleManager.getBoolean("RePosition")) {
            renderHud(colorArray, target);
            return;
        }
        if (target.name == 'Player' && Mouse.isGrabbed())
            return;
        renderHud(colorArray, target);
        /**
         * THIS MAKES FOV HUD DRAGGABLE
         * feel free to use in your own code.
         */
        if (Mouse.isButtonDown(0)) {
            if (!newClick) {
                newClick = true;
                var mouseX_1 = Mouse.getEventX() / ratioWidth;
                var mouseY_1 = (Display.getHeight() - Mouse.getEventY()) / ratioHeight;
                if (mouseX_1 > anchorX && mouseX_1 < anchorX + 160 && mouseY_1 > anchorY && mouseY_1 < anchorY + 50) {
                    inBox = true;
                    xOffSet = mouseX_1 - anchorX;
                    yOffSet = mouseY_1 - anchorY;
                }
                else
                    inBox = false;
            }
            if (!inBox)
                return;
            var mouseX = Mouse.getEventX() / ratioWidth;
            var mouseY = (Display.getHeight() - Mouse.getEventY()) / ratioHeight;
            anchorX = mouseX - xOffSet;
            anchorY = mouseY - yOffSet;
        }
        else if (newClick) {
            newClick = false;
            inBox = false;
        }
    };
};
function renderHud(colorArray, target) {
    render.drawRect(anchorX, anchorY, anchorX + 160, anchorY + 50, 22, 22, 22, 200);
    render.drawRect(anchorX + 3, anchorY + 3, anchorX + 157, anchorY + 47, 18, 18, 18, 230);
    render.drawString(target.name, anchorX + 8, anchorY + 8, rgbToHex(colorArray));
    GL11.glScalef(scaleFactor, scaleFactor, scaleFactor);
    render.drawString(target.health + " HP", (anchorX + 8) / scaleFactor, (anchorY + 18.5) / scaleFactor, rgbToHex(colorArray));
    GL11.glScalef(1 / scaleFactor, 1 / scaleFactor, 1 / scaleFactor);
    render.drawRect(anchorX + 8, anchorY + 36, anchorX + progressLength(target.health), anchorY + 42, colorArray[0], colorArray[1], colorArray[2], 255);
}
function progressLength(health) {
    var fullLength = 152, increment = fullLength / 20;
    return increment * +health;
}
/**
 * =============================
 * FOV RELATED FUNCTIONS
 * =============================
 */
function EntityFromFOV() {
    var cPos = localPlayer.getPosition(), pitch = localPlayer.getAngles()[0], yaw = localPlayer.getAngles()[1], gran = 5, x = cPos[0], y = cPos[1] + 1.62, z = cPos[2], xShift = -1 * (Math.cos(pitch * Math.PI / 180)) * Math.sin(yaw * Math.PI / 180), yShift = -1 * Math.sin(pitch * Math.PI / 180), zShift = (Math.cos(pitch * Math.PI / 180)) * Math.cos(yaw * Math.PI / 180), entities = entity.getEntities(), closeEntities = [];
    for (var i = 0; i < entities.length; i++) {
        if (localPlayer.getDistanceToEntity(entities[i]) < 5)
            closeEntities.push(entities[i]);
    }
    for (var i = 0; i < gran * 4; i++) {
        for (var n = 0; n < closeEntities.length; n++) {
            //if you're reading this it probably means you know what you're doing. I'm SORRY about the nested for loops. 
            if (!entity.isPlayer(closeEntities[n]))
                continue;
            if (closeEntities[n] == localPlayer.getId())
                continue;
            var bb = entity.getBoundingBox(closeEntities[n]);
            if ((x > bb[0] - .23 && x < bb[3] + .23) && (z > bb[2] - .23 && z < bb[5] + .23) && (y > bb[1] && y < bb[4] + .23)) {
                var target = {
                    name: entity.getName(closeEntities[n]),
                    health: entity.getHealth(closeEntities[n]).toFixed(0),
                };
                hurtTicks = entity.getHurtTime(closeEntities[n]); //Smart Reach
                return target;
            }
        }
        x += xShift / gran;
        y += yShift / gran;
        z += zShift / gran;
    }
}
function BlockFromFov() {
    var cPos = localPlayer.getPosition(), pitch = localPlayer.getAngles()[0], yaw = localPlayer.getAngles()[1], gran = 5, x = cPos[0], y = cPos[1] + 1.62, z = cPos[2], blockReach = 6, blockExists = false, i = false, xShift = -1 * (Math.cos(pitch * Math.PI / 180)) * Math.sin(yaw * Math.PI / 180), yShift = -1 * Math.sin(pitch * Math.PI / 180), zShift = (Math.cos(pitch * Math.PI / 180)) * Math.cos(yaw * Math.PI / 180);
    while (!blockExists && i < gran * blockReach) {
        if (world.getBlock(x, y, z) != 'tile.air') {
            blockExists = true;
            break;
        }
        x += xShift / gran;
        y += yShift / gran;
        z += zShift / gran;
        i++;
    }
    return blockExists;
}
/**
 * =============================
 * JITTER CLICK
 * =============================
 */
var Jitter = function () {
    this.getName = function () { return "JitterClick" + suffix; };
    this.onRender2D = function () {
        if (!Mouse.isButtonDown(0) || !Mouse.isGrabbed())
            return;
        if (moduleManager.getBoolean("NoParkinsons") && BlockFromFov())
            return;
        var angles = localPlayer.getAngles(), yaw = angles[0] + ((Math.random() * jitterX - Math.random() * jitterX) / 2), pitch = angles[1] + ((Math.random() * jitterY - Math.random() * jitterY) / 2);
        localPlayer.setAngles(yaw, pitch);
    };
};
/**
 * =============================
 * SMART REACH
 * =============================
 */
var combo = 0;
var SmartReach = function () {
    this.getName = function () { return "SmartReach" + suffix; };
    this.onEnable = function () {
        if (!moduleManager.isModuleActive("reach")) {
            chat.send('\xA7cSmartReach\xA7r: You need reach to be toggled for this to work');
            localPlayer.sendMessage(".smartreach" + suffix);
        }
    };
    this.onPreUpdate = function () {
        var health = entity.getHealth(localPlayer.getId());
        if (moduleManager.getBoolean("LowHealthIncrease") && health <= healthThreshold) {
            if (health <= healthLowest) {
                //prevents dividing by 0
                localPlayer.sendMessage(".reach Reach " + (reach + reachIncrease));
            }
            else {
                var newReach = reachIncrease / (health - healthLowest) + reach;
                localPlayer.sendMessage(".reach Reach " + newReach.toFixed(2));
            }
        }
        if (moduleManager.getBoolean("ComboIncrease")) {
            if (!moduleManager.isModuleActive("fovhud" + suffix)) {
                chat.send("\xA7cSmartReach\xA7r: This setting requires FOVhud to be active.");
                localPlayer.sendMessage(".smartreach" + suffix + " comboincrease enabled false");
                return;
            }
            if (hurtTicks === 0 && combo !== 0) {
                combo = 0;
                localPlayer.sendMessage(".reach Reach " + reach);
                chat.send("combo reach reset");
                return;
            }
            if (hurtTicks === 9)
                combo++;
            if (combo === 0)
                return;
            var i = void 0;
            combo > comboMax ? i = comboMax : i = combo;
            var newReach = reachIncrease / comboMax * i + reach;
            localPlayer.sendMessage(".reach Reach " + newReach.toFixed(2));
        }
    };
};
/**
 * =============================
 * REGISTER MODULES
 * =============================
 */
var modA = new GodBridge(), modB = new LegitIndicator(), modC = new SmartVelocity(), modD = new FelixCommands(), modE = new TargetHud(), modF = new Jitter(), modG = new SmartReach();
moduleManager.registerModule(modA);
moduleManager.registerModule(modB);
moduleManager.registerModule(modC);
moduleManager.registerModule(modD);
moduleManager.registerModule(modE);
moduleManager.registerModule(modF);
moduleManager.registerModule(modG);
/**
 * =============================
 * REGISTER BOOLEANS
 * =============================
 */
moduleManager.registerBoolean("JitterClick" + suffix, "NoParkinsons", "Doesn't jitter while mining blocks", true);
moduleManager.registerBoolean("FOVHud" + suffix, "RequireClick", "Only render the target hud when you're holding down lmb", true);
moduleManager.registerBoolean("FOVHud" + suffix, "Rainbow", "Rainbow gradient", false);
moduleManager.registerBoolean("FOVHud" + suffix, "Calm", "Calm gradient", false);
moduleManager.registerBoolean("FOVHud" + suffix, "Astolfo", "Astolfo gradient", true);
moduleManager.registerBoolean("FOVHud" + suffix, "Instagram", "Instagram gradient", false);
moduleManager.registerBoolean("FOVHud" + suffix, "RePosition", "Move the targethud by dragging and clicking", false);
moduleManager.registerBoolean("FOVHud" + suffix, "Killaura", "Becomes a regular target hud for killaura", false);
moduleManager.registerBoolean("GodBridge" + suffix, "RealisticSneak", "slows down the world timer to give the empression you're actuall sneaking", false);
moduleManager.registerBoolean("GodBridge" + suffix, "Always_Safewalk", "Always have safewalk enabled", false);
moduleManager.registerBoolean("GodBridge" + suffix, "RandomDelay", "Randomize the fastplace delay when bridging", false);
moduleManager.registerBoolean("GodBridge" + suffix, "BlockCheck", "checks if you're holding a block", false);
moduleManager.registerBoolean("GodBridge" + suffix, "PitchCheck", "checks to see if you're actually making a bridge", false);
moduleManager.registerBoolean("SmartVelocity" + suffix, "Require Click", "Only use velocity when in a fight", true);
moduleManager.registerBoolean("SmartVelocity" + suffix, "Random", "Randomly changes your velocity", false);
moduleManager.registerBoolean("SmartReach" + suffix, "LowHealthIncrease", "Reach increases the lower your health is", false);
moduleManager.registerBoolean("SmartReach" + suffix, "ComboIncrease", "Reach increases with consecutive hits", true);
moduleManager.registerBoolean("water", "LOL YOU CAN REGISTER BOOLEANS TO OTHER MODULES ON LAUNCH", "TITLE", true);
var end = Date.now() - start;
chat.send("reloaded Felix.js in " + end + "ms");
//compile with tsc -t es5 Felix.ts
