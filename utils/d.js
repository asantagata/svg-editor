import context from "./context.js";

export function tokenize(d) {
    let token = '', tokens = [], tokenHasPeriod = false;
    if (d.length === 0) return tokens;
    for (const char of d) {
        const codePoint = char.codePointAt(0);
        if ((codePoint >= 48 && codePoint <= 57) || codePoint === 69 || codePoint === 101) { // numeric
            token += char;
        } else if ((codePoint >= 65 && codePoint <= 90) || (codePoint >= 97 && codePoint <= 122)) { // alphabetical
            if (token)
                tokens.push(token);
            tokens.push(char);
            token = '';
            tokenHasPeriod = false;
        } else if (codePoint === 45) { // -
            if (token && token.endsWith('e') || token.endsWith('E')) {
                token += char;
            } else {
                if (token)
                    tokens.push(token);
                token = char;
                tokenHasPeriod = false;
            }
        } else if (codePoint === 46) { // .
            if (tokenHasPeriod) {
                tokens.push(token);
                token = char;
            } else {
                token += char;
            }
            tokenHasPeriod = true;
        } else { // whitespace, comma, mystery
            if (token)
                tokens.push(token)
            token = '';
            tokenHasPeriod = false;
        }
    }
    if (token)
        tokens.push(token);
    return tokens;
}

const argc = {
    M: 2, m: 2, L: 2, l: 2, H: 1, h: 1, V: 1, v: 1, C: 6, c: 6, S: 4, s: 4, Q: 4, q: 4, T: 2, t: 2, A: 7, a: 7, Z: 0, z: 0
}

export function commandify(d) {
    const tokens = tokenize(d);
    let command = null, commands = [];
    for (const token of tokens) {
        const codePoint = token.codePointAt(0);
        if ((codePoint >= 65 && codePoint <= 90) || (codePoint >= 97 && codePoint <= 122)) {
            if (command)
                commands.push(command);
            command = {type: token, args: []};
        } else {
            if (command.args.length === argc[command.type]) {
                commands.push(command);
                command = {type: command.type === 'M' ? 'L' : command.type === 'm' ? 'l' : command.type, args: [parseFloat(token)]};
            } else {
                command.args.push(parseFloat(token));
            }
        }
    }
    if (command)
        commands.push(command);
    return commands;
}

export function stringify(commands) {
    return commands.map(c => `${c.type}${c.args.map(a => a.toString()).join(' ')}`).join('');
}

export function insertCommand(type, index) {
    const {width: w, height: h} = context.icon;
    const cx = w / 2, cy = h / 2;
    const latestCommand = context.selectedPath.d[index];
    const x = latestCommand.args.at(-2) ?? context.selectedPath.d[0].args[0], 
        y = latestCommand.args.at(-1) ?? context.selectedPath.d[0].args[0];
    let args = [];
    if (context.selectedPath.d.length === 1) {
        const ax = w - x, ay = h - y; // across from center
        args = {
            M: [ax, ay],
            L: [ax, ay],
            Q: [cx, ay, ax, y],
            C: [x, ay, ax, y, ax, ay],
            A: [Math.abs(cx - x) / 2 || 1, Math.abs(cy - y) / 2 || 1, 0, 0, 0, ax, ay],
            Z: []
        }[type];
    } else {
        if (index === context.selectedPath.d.length - 1) {
            const previousCommand = context.selectedPath.d[index - 1];
            const px = previousCommand.args.at(-2) ?? context.selectedPath.d[0].args[0], 
                py = previousCommand.args.at(-1) ?? context.selectedPath.d[0].args[0]; // previous
            const ex = 2*x - px, ey = 2*y - py;
            args = {
                M: [ex, ey],
                L: [ex, ey],
                Q: [x, ey, ex, ey],
                C: [x, ey, ex, y, ex, ey],
                A: [Math.abs(x - px) / 2 || 1, Math.abs(y - py) / 2 || 1, 0, 0, 0, ex, ey],
                Z: []
            }[type];
        } else {
            const nextCommand = context.selectedPath.d[index + 1];
            const nx = nextCommand.args.at(-2) ?? context.selectedPath.d[0].args[0], 
                ny = nextCommand.args.at(-1) ?? context.selectedPath.d[0].args[0];
            const mx = (x + nx) / 2, my = (y + ny) / 2;
            args = {
                M: [mx, my],
                L: [mx, my],
                Q: [x, my, mx, my],
                C: [x, my, mx, y, mx, my],
                A: [Math.abs(x - mx) / 2 || 1, Math.abs(y - my) / 2 || 1, 0, 0, 0, mx, my],
                Z: []
            }[type];
        }
    }
    context.selectedPath.d.splice(index + 1, 0, {
        type,
        args,
        id: Math.max(...context.selectedPath.d.map(cmd => cmd.id)) + 1,
    });
}

export function setCommandType(command, type) {
    const index = context.selectedPath.d.indexOf(command);
    if (index === 0) return;
    const prevCommand = context.selectedPath.d[index - 1];
    const {x, y} = isolateCoordsFromAbsoluteCmd(command, context.selectedPath.d);
    const {x: px, y: py} = isolateCoordsFromAbsoluteCmd(prevCommand, context.selectedPath.d);
    command.type = type;
    command.args = {
        M: [x, y],
        L: [x, y],
        Q: [px, y, x, y],
        C: [px, y, x, py, x, y],
        A: [Math.abs(x - px) / 2 || 1, Math.abs(y - py) / 2 || 1, 0, 0, 0, x, y],
        Z: []
    }[type];
}

const cmdPointArgs = {
    m: [0], l: [0], h: [0], v: [-1], c: [0, 2, 4], s: [0, 2], q: [0, 2], t: [0], a: [5], z: [],
    M: [0], L: [0], C: [0, 2, 4], Q: [0, 2], A: [5], Z: []
}

export function isolateCoordsFromAbsoluteCmd(command, commands) {
    return command.type === 'Z' 
        ? {x: commands[0].args[0], y: commands[0].args[1]} 
        : {
            x: command.args[cmdPointArgs[command.type].at(-1)], 
            y: command.args[cmdPointArgs[command.type].at(-1) + 1]
        };
}

export function fixCommands(commands) {
    let coords = {x: 0, y: 0};
    if (commands[0]?.type?.toUpperCase() !== 'M')
        commands.unshift({type: 'M', args: [0, 0]}); // must always start with M
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];

        // make command absolute, not relative
        const up = cmd.type.toUpperCase();
        if (cmd.type !== up) {
            for (const xCoordIndex of cmdPointArgs[cmd.type]) {
                if (cmd.args[xCoordIndex] !== undefined) cmd.args[xCoordIndex] += coords.x;
                const yCoordIndex = xCoordIndex + 1
                if (cmd.args[yCoordIndex] !== undefined) cmd.args[yCoordIndex] += coords.y;
            }
            cmd.type = up;
        }

        // S -> C, T -> Q
        if (cmd.type === 'S') {
            let prevEndControlPoint = coords;
            const prevCmd = commands[i - 1];
            if (prevCmd.type === 'C')
                prevEndControlPoint = {x: prevCmd.args[2], y: prevCmd.args[3]};
            cmd.type = 'C';
            cmd.args.splice(0, 0, 2*coords.x - prevEndControlPoint.x, 2*coords.y - prevEndControlPoint.y);
        } else if (cmd.type === 'T') {
            let prevEndControlPoint = coords;
            const prevCmd = commands[i - 1];
            if (prevCmd.type === 'Q')
                prevEndControlPoint = {x: prevCmd.args[0], y: prevCmd.args[1]};
            cmd.type = 'Q';
            cmd.args.splice(0, 0, 2*coords.x - prevEndControlPoint.x, 2*coords.y - prevEndControlPoint.y);
        }

        // fix coords, H,V -> L
        if (cmd.type === 'Z') {
            coords = {x: commands[0].args[0], y: commands[0].args[1]};
        } else {
            const [lastXCoordIndex, lastYCoordIndex] = [cmdPointArgs[cmd.type.toLowerCase()].at(-1), cmdPointArgs[cmd.type.toLowerCase()].at(-1) + 1];
            if (cmd.args[lastXCoordIndex] !== undefined) coords.x = cmd.args[lastXCoordIndex];
            if (cmd.args[lastYCoordIndex] !== undefined) coords.y = cmd.args[lastYCoordIndex];
            if (cmd.type === 'H' || cmd.type === 'V') {
                cmd.type = 'L';
                cmd.args = [coords.x, coords.y];
            }
        }
    }
    return commands;
}

export function translateCommandBy(command, offsets) {
    for (const xPointIndex of cmdPointArgs[command.type]) {
        command.args[xPointIndex] += offsets.x;
        command.args[xPointIndex + 1] += offsets.y;
    }
}

const resizePointArgs = {...cmdPointArgs, a: [0, 5], A: [0, 5]};

export function resizeSVGToFit(svg, width, height) {
    const ratio = Math.min(width / svg.width, height / svg.height);
    svg.width *= ratio, svg.height *= ratio;
    svg.children.forEach(path => {
        path['stroke-width'] *= ratio;
        path.d.forEach(cmd => resizePointArgs[cmd.type].forEach(index => {
            cmd.args[index] *= ratio, cmd.args[index + 1] *= ratio;
        }))
    });
}