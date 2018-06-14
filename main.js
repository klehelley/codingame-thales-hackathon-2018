const FIELD = {
    "x": 10000,
    "y": 8000
};
const UFO_AMOUNT = 2;
const BOOST_COOLDOWN = 8;

let currentGameState = {
    "me": {
        "side": null,
        "flag": {
            "x": -1,
            "y": -1
        },
        "ufos": [
            {
                "boostCooldown": 0,
                "role": "TODO",
                "position": {
                    "x": -1,
                    "y": -1
                },
                "vector": {
                    "x": -1,
                    "y": -1
                },
                "hasFlag": false
            },
            {
                "boostCooldown": 0,
                "role": "TODO",
                "position": {
                    "x": -1,
                    "y": -1
                },
                "vector": {
                    "x": -1,
                    "y": -1
                },
                "hasFlag": false
            }
        ]
    },
    "enemy": {
        "side": null,
        "flag": {
            "x": -1,
            "y": -1
        },
        "ufos": [
            {
                "boostCooldown": 0,
                "position": {
                    "x": -1,
                    "y": -1
                },
                "vector": {
                    "x": -1,
                    "y": -1
                },
                "hasFlag": false
            },
            {
                "boostCooldown": 0,
                "position": {
                    "x": -1,
                    "y": -1
                },
                "vector": {
                    "x": -1,
                    "y": -1
                },
                "hasFlag": false
            }
        ]
    }
};
let previousGameState;

function exists(flag) {
    return flag.x !== -1 && flag.y !== -1;
}
function parseFlag(line) {
    const coords = line.split(' ');
    const flag = {
        "x": parseInt(coords[0]),
        "y": parseInt(coords[1])
    };
    return exists(flag) ? flag : null;
}
function parseUfo(line) {
    var infos = line.split(' ');
    return {
        "position": {
            "x": parseInt(infos[0]),
            "y": parseInt(infos[1])
        },
        "vector": {
            "x": parseInt(infos[2]),
            "y": parseInt(infos[3])
        },
        "hasFlag": (parseInt(infos[4]) === 1)
    };
}
function updateUfos(ufos) {
    for (var i = 0; i < UFO_AMOUNT; i++) {
        const ufo = parseUfo(readline());
        ufos[i].position = ufo.position;
        ufos[i].vector = ufo.vector;
        ufos[i].hasFlag = ufo.hasFlag;
    }
}
function cooldown(ufo) {
    if (ufo.boostCooldown > 0) {
        ufo.boostCooldown--;
    }
}
function updateGameState() {
    const begin = Date.now();
    // Saving state for comparison (enemy boost detection, etc.)
    previousGameState = currentGameState;

    // Loading provided values
    currentGameState.me.flag = parseFlag(readline());
    currentGameState.enemy.flag = parseFlag(readline());
    updateUfos(currentGameState.me.ufos);
    updateUfos(currentGameState.enemy.ufos);

    // Manage cooldowns
    for (var i = 0; i < UFO_AMOUNT; i++) {
        cooldown(currentGameState.me.ufos[i]);
    }
    for (var i = 0; i < UFO_AMOUNT; i++) {
        cooldown(currentGameState.enemy.ufos[i]);
    }
    
    // Initialize sides
    if (! currentGameState.me.side) {
        currentGameState.me.side = currentGameState.me.ufos[0].position.x < FIELD.x / 2 ? 'LEFT' : 'RIGHT';
        currentGameState.enemy.side = currentGameState.me.side === 'LEFT' ? 'RIGHT' : 'LEFT';
    }
    const end = Date.now()
    printErr('- updateGameState: ' + (end - begin) + ' ms');
}

function defineStrategy() {
    const begin = Date.now();
    // Décider rôle des vaisseaux (ATK, DEF, [ASP?, DSP?]) :
    // - Si un vaisseau possède le drapeau, il est forcément en ATK, et l'autre en DEF
    // - Sinon, si un vaisseau adverse possède le drapeau, alors tous les vaisseaux à portée (règle ignorée pour les autres) et plus proches de lui que du drapeau passent en DEF
    // - Sinon, le vaisseau le plus proche du drapeau adverse passe en ATK
    // - Enfin, si un vaisseau n'a pas de rôle affecté alors celui-ci est déterminé de manière à avoir 1 ATK et 1 DEF (au pire aléatoire)
    currentGameState.me.ufos[0].role = 'DEF';
    currentGameState.me.ufos[1].role = 'ATK';
    // WIP
    const end = Date.now()
    printErr('- defineStrategy: ' + (end - begin) + ' ms');
}

function applyStrategy() {
    for (var i = 0; i < UFO_AMOUNT; i++) {
        const begin = Date.now();
        if (currentGameState.me.ufos[i].role === 'ATK') {
            applyAtkStrategy(i);
        } else {
            applyDefStrategy(i);
        }
        const end = Date.now()
        printErr('- applyStrategy[' + i + ']: ' + (end - begin) + ' ms');
    }
}

// ATK :
//  - Aller chercher le drapeau si on ne l'a pas, en faisant attention à la vitesse d'approche (pour ne pas toucher les murs), en ignorant (pour le moment) la position des vaisseaux adverses
//  - Retourner dans la zone de l'équipe si on l'a, en faisant attention à ne pas percuter d'autre vaisseau en chemin, sachant que l'on a la priorité sur DEF
//  - Si il y a un temps de respawn, se rendre dans la zone adverse en attendant
//  - Le boost est principalement utilisé à partir du moment où le drapeau est en possession du vaisseau
function applyAtkStrategy(i) {
    if (currentGameState.me.ufos[i].hasFlag) {
        printErr('  ATK has enemy flag');
        print(
            (currentGameState.me.side === 'LEFT' ? 500 : FIELD.x - 500) + ' ' +
            currentGameState.me.ufos[i].position.y + ' ' +
            (currentGameState.me.ufos[i].boostCooldown === 0 ? 'BOOST' : '100')
        );
        if (currentGameState.me.ufos[i].boostCooldown === 0) {
            currentGameState.me.ufos[i].boostCooldown = BOOST_COOLDOWN;
        }
    } else if (currentGameState.enemy.flag) {
        printErr('  ATK target enemy flag');
        print(
            currentGameState.enemy.flag.x + ' ' +
            currentGameState.enemy.flag.y + ' ' +
            '100'
        );
    } else {
        printErr('  ATK idle');
        print(
            (currentGameState.me.side === 'LEFT' ? FIELD.x - 500 : 500) + ' ' +
            (FIELD.y / 2) + ' ' +
            '50'
        );
    }
}

// Pour chaque vaisseau, suivant le rôle affecté, les règles suivantes s'appliquent :
// DEF :
//  - Si notre drapeau est pris, aller à la poursuite du vaisseau qui le possède pour le percuter
//  - Sinon, se placer dessus
//  - Si il y a un temps de respawn, se rendre dans la base en attendant
//  - Le boost est principalement utilisé pour rattraper un vaisseau adverse en possession de notre drapeau
function applyDefStrategy(i) {
    if (currentGameState.me.flag) {
        printErr('  DEF protect our flag');
        print(
            currentGameState.me.flag.x + ' ' +
            currentGameState.me.flag.y + ' ' +
            '50'
        );
    } else if (currentGameState.enemy.ufos[0].hasFlag && 
            (currentGameState.me.side === 'LEFT' ? currentGameState.enemy.ufos[0].position.x < FIELD.x / 2 : currentGameState.enemy.ufos[0].position.x > FIELD.x / 2)) {
        printErr('  DEF chase enemy 0');
        print(
            (currentGameState.me.side === 'LEFT' ? currentGameState.enemy.ufos[0].position.x + 100 : currentGameState.enemy.ufos[0].position.x - 100) + ' ' +
            currentGameState.enemy.ufos[0].position.y + ' ' +
            (currentGameState.me.ufos[i].boostCooldown === 0 ? 'BOOST' : '100')
        );
        if (currentGameState.me.ufos[i].boostCooldown === 0) {
            currentGameState.me.ufos[i].boostCooldown = BOOST_COOLDOWN;
        }
    } else if (currentGameState.enemy.ufos[1].hasFlag && 
        (currentGameState.me.side === 'LEFT' ? currentGameState.enemy.ufos[1].position.x < FIELD.x / 2 : currentGameState.enemy.ufos[1].position.x > FIELD.x / 2)) {
        printErr('  DEF chase enemy 1');
        print(
            (currentGameState.me.side === 'LEFT' ? currentGameState.enemy.ufos[1].position.x + 100 : currentGameState.enemy.ufos[1].position.x - 100) + ' ' +
            currentGameState.enemy.ufos[1].position.y + ' ' +
            (currentGameState.me.ufos[i].boostCooldown === 0 ? 'BOOST' : '100')
        );
        if (currentGameState.me.ufos[i].boostCooldown === 0) {
            currentGameState.me.ufos[i].boostCooldown = BOOST_COOLDOWN;
        }
    } else {
        printErr('  DEF idle');
        print(
            (currentGameState.me.side === 'LEFT' ? 500 : FIELD.x - 500) + ' ' +
            (FIELD.y / 2) + ' ' +
            '50'
        );
    }
}

while (true) {
    updateGameState();
    defineStrategy();
    applyStrategy();
}
