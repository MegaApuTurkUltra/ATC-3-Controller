Array.prototype.shuffle = function() {
    for (var i = this.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }
}

let canvas = document.getElementById("screen");
let ctx = canvas.getContext('2d');

let bots = [];

let registeredBots = [];

let tags = {};

let running = false;

let cycles = 0;

let zaps = [];

let displayLocked = false;
let selectedBot = null;

function loadBot(name, codeText) {
    for (let bot of registeredBots) {
        if (bot.name == name) {
            if(!confirm("Replace " + name + "?"))
                return;
            else {
                registeredBots.splice(i, 1);
                break;
            }
        }
    }

    let bot = {
        x: 0,
        y: 0,
        code: [],
        variables: {
            EXECUTION_POINTER: 1,
            DIRECTION: 0,
            RANDOM: 0,
            DATA1: 0,
            DATA2: 0
        },
        name: name,
        protects: []
    };
    bot.code = codeText.split(/\r?\n/).map(e => e.startsWith("TAG") ? "TAG " + name : e);
    if (bot.code.length > 32) {
        alert(name + "'s code is too long");
        return;
    }

    while (bot.code.length < 32) {
        bot.code.push("");
    }
    
    bot.color = "rgb(" + Math.floor(Math.random() * 150) + "," + Math.floor(Math.random() * 150) + "," + Math.floor(Math.random() * 150) + ")";
    registeredBots.push(bot);

    let dom = document.createElement("div");
    dom.className = "row";
    dom.id = name;
    dom.innerHTML = `
        <div class="color" style="background-color:${bot.color};"></div>
        <div class="name">${name}</div>
        <div class="tags">0</div>
        <button class="edit">E</button>
        <button class="delete">X</button>`;
    dom.querySelector(".edit").onclick = function() {
        let botName = this.parentElement.id;
        document.querySelector("#bot-name").value = botName;
        document.querySelector("#input").classList.add("active");
        for (let i = 0; i < registeredBots.length; i++) {
            if (registeredBots[i].name == botName) {
                document.querySelector("#bot-code").value = registeredBots[i].code.join("\n");
                break;
            }
        }
    };

    dom.querySelector(".delete").onclick = function() {
        let botName = this.parentElement.id;
        if (confirm("Delete " + botName + "?")) {
            this.parentElement.remove();
            for (let i = 0; i < registeredBots.length; i++) {
                if (registeredBots[i].name == botName) {
                    registeredBots.splice(i, 1);
                    break;
                }
            }
        }
    };
    document.querySelector("#list").appendChild(dom);

    frame();
}

document.querySelector("#load").onclick = function(){
    document.querySelector("#input").classList.add("active");
};

document.querySelector("#input .ok").onclick = function(){
    document.querySelector("#input").classList.remove("active");
    loadBot(document.querySelector("#bot-name").value, document.querySelector("#bot-code").value);
}

document.querySelector("#input .nope").onclick = function(){
    document.querySelector("#input").classList.remove("active");
}


document.querySelector("#bot-code").onkeydown = function(e){
    let newLines = this.value.split(/\r?\n/g).length;

    if(e.keyCode == 13 && newLines >= 32) {
        return false;
    }
};

let field = [];

function initMatch() {
    field = [];
    for(let x = 0; x < 100; x++){
        field[x] = [];
        for(let y = 0; y < 100; y++){
            field[x][y] = null;
        }
    }
    
    bots = [];
    cycles = 0;
    tags = {};
    
    for(let bot0 of registeredBots) {
        for(let i = 0; i < 10; i++) {
            let bot = JSON.parse(JSON.stringify(bot0));
            bot.variables.RANDOM = Math.floor(Math.random() * 33);
            let tries = 0;
            while(tries == 0 || field[bot.x][bot.y]){
                bot.x = Math.floor(Math.random() * 100);
                bot.y = Math.floor(Math.random() * 100);
                if(tries++ > 50) {
                    alert("Couldn't place bot " + name);
                    return;
                }
            }
            field[bot.x][bot.y] = { type: "bot", bot: bot };
            bots.push(bot);
        }
    }
}

function frame() {
    document.querySelector(".botinfo").innerHTML = JSON.stringify(selectedBot, null, 1);
    ctx.clearRect(0, 0, 500, 500);
    
    ctx.beginPath();
    for (var x = 0; x <= 500; x += 5) {
        ctx.moveTo(0.5 + x, 0);
        ctx.lineTo(0.5 + x, 500);
    }

    for (var x = 0; x <= 500; x += 5) {
        ctx.moveTo(0, 0.5 + x);
        ctx.lineTo(500, 0.5 + x);
    }

    ctx.strokeStyle = "black";
    ctx.stroke();
    
    for(let bot of bots) {
        ctx.fillStyle = bot.color;
        ctx.fillRect(bot.x * 5, bot.y * 5, 5, 5);
    }
    
    while(zaps.length){
        let zap = zaps.pop();
        ctx.beginPath();
        ctx.moveTo(zap[0] * 5 + 2.5, zap[1] * 5 + 2.5);
        ctx.lineTo(zap[2] * 5 + 2.5, zap[3] * 5 + 2.5);
        ctx.strokeStyle = "red";
        ctx.stroke();
        ctx.fillStyle = "red";
        ctx.fillRect(zap[2] * 5 - 5, zap[3] * 5 - 5, 15, 15);
    }
    
    if(selectedBot != null) {
        ctx.fillStyle = "blue";
        ctx.fillRect(selectedBot.x * 5, selectedBot.y * 5, 5, 5);
    }
}

frame();

function turn() {
    if(!running) return;
    bots.shuffle();
    
    for(let bot of bots) {
        runBot(bot);
    }
    
    frame();
    
    cycles++;
    document.querySelector(".cycles").textContent = cycles;
    if(cycles >= 5000) {
        cycles = 0;
        running = false;
    }
    
    setTimeout(turn, 1000 / parseInt(document.querySelector("#speed").value));
}

document.querySelector("#run").onclick = function(){
    running = !running;
    if(running && registeredBots.length == 0){
        cycles = 0;
        running = false;
    }
    console.log("Now running: ", running);
    if(running) {
        if(cycles == 0) initMatch();
        turn();
    }
}

document.querySelector("#screen").onmousedown = function(e){
    displayLocked = !displayLocked;
}

document.querySelector("#screen").onmousemove = function(e){
    if(displayLocked) return;
    let x = Math.floor((e.pageX - this.offsetLeft) / 5);
    let y = Math.floor((e.pageY - this.offsetTop) / 5);
    if(field[x]) {
        selectedBot = field[x][y] && field[x][y].type == "bot" ? field[x][y].bot : null;
        frame();
    }
}

function runBot(bot) {
    window.currentBot = bot;
    document.querySelector("#" + bot.name + " .tags").textContent = tags[bot.name];
    bot.variables.EXECUTION_POINTER = parseInt(bot.variables.EXECUTION_POINTER);
    if(isNaN(bot.variables.EXECUTION_POINTER)
            || !isFinite(bot.variables.EXECUTION_POINTER)
            || bot.variables.EXECUTION_POINTER > bot.code.length
            || bot.variables.EXECUTION_POINTER < 1) {
        bot.variables.EXECUTION_POINTER = 1;
    }
    
    let line = bot.code[bot.variables.EXECUTION_POINTER - 1]
        .split(" ")
        .filter(e => e.length > 0)
        .map(item => item.trim().toUpperCase());
    if(line.length < 1) {
        bot.variables.EXECUTION_POINTER++;
        return;
    }
    
    bot.variables.EXECUTION_POINTER++;
    
    runLine(bot, line);
    
    bot.variables.RANDOM = Math.floor(Math.random() * 33);
    
    bot.variables.DIRECTION = parseInt(bot.variables.DIRECTION);
    if(isNaN(bot.variables.DIRECTION)
            || !isFinite(bot.variables.DIRECTION)
            || bot.variables.DIRECTION < 0
            || bot.variables.DIRECTION > 3) {
        bot.variables.DIRECTION = Math.floor(Math.random() * 4);
    }
}

function runLine(bot, line){
    if(line[0] == "SET") {
        if(line.length >= 3) {
            let value = parseValue(bot, line[2]);
            let thisParam = line[1];
            let thisBot = bot;
            function parseParamSet(bot, param) {
                if(param.startsWith("*")) {
                    let otherBot = findBotInDirection(bot);
                    if(otherBot && otherBot != thisBot) {
                        parseParamSet(otherBot, param.substring(1));
                    } else {
                        return;
                    }
                }
    
                if(param.startsWith("@")) {
                    let index = parseInt(parseValue(thisBot, param.substring(1))) - 1;
                    if(!isNaN(index) && index < bot.code.length && index > -1) {
                        if(hasProtect(bot, "line", index)) { return; }
                        
                        value = "" + value;
                        // only execute the tag if the line didn't already contain that bot's tag
                        if(value.split(" ")[0] == "TAG" && thisBot != bot && bot.code[index] != value) {
                            let name = value.split(" ")[1];
                            if(!tags.hasOwnProperty(name)) tags[name] = 0;
                            tags[name]++;
                        }
                        
                        bot.code[index] = value;
                        
                        
                        if(thisBot != bot){
                            zaps.push([thisBot.x, thisBot.y, bot.x, bot.y]);
                        }
                    }
                } else if(bot.variables.hasOwnProperty(param)) {
                    if(hasProtect(bot, "variable", param)) { return; }
                    bot.variables[param] = value;
                }
            }
            parseParamSet(bot, thisParam);
        }
    } else if(line[0] == "IF" && line.length >= 6) {
        let line1 = parseInt(parseValue(bot, line[4])) || 1;
        let line2 = parseInt(parseValue(bot, line[5])) || 1;
        let value1 = parseValue(bot, line[1]);
        let value2 = parseValue(bot, line[3]);
        let op = line[2];
        let condition = false;
        if(op == "EQUALS"){
            condition = value1 == value2;
        } else if(op == "LESSTHAN") {
            condition = value1 < value2;
        } else if(op == "GREATERTHAN") {
            condition = value1 > value2;
        }
        
        let newLine = (condition ? bot.code[line1 - 1] : bot.code[line2 - 1])
            .split(" ")
            .filter(e => e.length > 0)
            .map(item => item.trim().toUpperCase());
        if(newLine.length > 0) {
            runLine(bot, newLine);
        }
    } else if(line[0] == "MOVE") {
        moveBot(bot, bot.variables.DIRECTION);
    } else if(line[0] == "PROTECT" && line.length >= 2){
        if(line[1].startsWith("@")) {
            let index = parseInt(parseValue(bot, line[1].substring(1))) - 1;
            if(!isNaN(index) && index < bot.code.length && index > -1) {
                bot.protects.push({ line: index });
            }
        } else {
            bot.protects.push({ variable: line[1] });
        }
    }
}

function hasProtect(bot, type, value) {
    for(let i = 0; i < bot.protects.length; i++) {
        if(bot.protects[i][type] == value) {
            bot.protects.splice(i, 1);
            return true;
        }
    }
    return false;
}

function parseValue(bot, param) {
    let value = 0;
    let parts = param.split("+");
    if(parts.length > 1) {
        return parseValue(bot, parts[0]) + parseValue(bot, parts[1]);
    }
    parts = param.split("-");
    if(parts.length > 1) {
        return parseValue(bot, parts[0]) - parseValue(bot, parts[1]);
    }
    parts = param.split("%");
    if(parts.length > 1) {
        return parseValue(bot, parts[0]) % parseValue(bot, parts[1]);
    }
    
    if(param.startsWith("*")) {
        let otherBot = findBotInDirection(bot);
        if(otherBot) {
            return parseValue(otherBot, param.substring(1));
        } else {
            return -1;
        }
    }
    
    if(param.startsWith("@")) {
        let line = bot.code[parseInt(parseValue(bot, param.substring(1))) - 1] || "";
        // return a parsed and rebuilt version of the line, in case
        // anybody's strategy is actually to read lines
        let tokens = line.split(" ");
        if(line[0] == "TAG") return "TAG " + bot.name;
        if(line[0] == "SET") {
            for(var i = 3; i < tokens.length; i++) delete tokens[i];
            return tokens.join(" ");
        }
        if(line[0] == "IF") {
            for(var i = 6; i < tokens.length; i++) delete tokens[i];
            return tokens.join(" ");
        }
        if(line[0] == "MOVE") {
            return "MOVE";
        }
        if(line[0] == "PROTECT") {
            for(var i = 2; i < tokens.length; i++) delete tokens[i];
            return tokens.join(" ");
        }
        return line;
    }
    
    if(bot.variables.hasOwnProperty(param)) {
        value = bot.variables[param];
    } else if(param.match(/^[0-9\-]+$/)) {
        value = parseInt(param);
    }
    return value;
}

function findBotInDirection(bot) {
    bot.variables.DIRECTION = bot.variables.DIRECTION % 4;
    let vertical = bot.variables.DIRECTION  == 0 || bot.variables.DIRECTION == 2;
    for(let i = 0, j = vertical ? bot.y : bot.x; i < 99; i++){
        if(!vertical && field[bot.x][j] && field[bot.x][j].type == "bot") {
            if(field[bot.x][j].bot.name == bot.name) return null;
            return field[bot.x][j].bot;
        }
        
        if(vertical && field[j][bot.y] && field[j][bot.y].type == "bot") {
            if(field[j][bot.y].bot.name == bot.name) return null;
            return field[j][bot.y].bot;
        }
        
        if(bot.variables.DIRECTION == 0 || bot.variables.DIRECTION == 3) {
            j--;
        } else {
            j++;
        }
        if(j > 99) j = 0;
        if(j < 0) j = 99;
    }
    return null;
}

function moveBot(bot, dir) {
    dir = dir % 4;
    let oldx = bot.x;
    let oldy = bot.y;
    
    if(dir == 0){
        bot.y--;
    } else if(dir == 1) {
        bot.x++;
    } else if(dir == 2) {
        bot.y++;
    } else {
        bot.x--;
    }
    
    if(bot.x < 0) bot.x = 99;
    if(bot.x > 99) bot.x = 0;
    if(bot.y < 0) bot.y = 99;
    if(bot.y > 99) bot.y = 0;
    
    if(field[bot.x][bot.y]) {
        bot.x = oldx;
        bot.y = oldy;
    } else {
        field[oldx][oldy] = null;
        field[bot.x][bot.y] = { type: "bot", bot: bot };
    }
}
