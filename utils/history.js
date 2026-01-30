import context from "./context.js";

let history = [];
let future = [];

export function recordSnapshot(ctx = context) {
    future = [];
    history.push(
        window.structuredClone(
            {
                name: ctx.name,
                icon: ctx.icon,
                selectedPath: ctx.selectedPath,
                defaultPath: ctx.defaultPath
            }
        )
    );
}

function reinstateSnapshot(snapshot) {
    Object.assign(context, snapshot);
    context.modal = false;
    context.saves = null;
    context.warning = null;
    context.commit(false);
}

export function undo() {
    if (history.length > 1) {
        future.push(history.pop());
        const snapshot = history.at(-1);
        reinstateSnapshot(snapshot);
    }
}

export function redo() {
    if (future.length > 0) {
        const snapshot = future.pop();
        history.push(snapshot);
        reinstateSnapshot(snapshot);
    }
}

export function clearHistory() {
    history = [];
    future = [];
}