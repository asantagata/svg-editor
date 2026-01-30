import { undo, redo } from "./history.js";

export default function handleShortcut(e) {
    if (document.querySelector('input:focus')) return;
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'z':
                e.preventDefault();
                undo();
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
        }
    }
}