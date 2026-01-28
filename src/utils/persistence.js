import context from "./context.js";

const NAME = 'SVGs';
const VERSION = 1;

export function getID() {
    const ID_NAME = 'id';
    if (localStorage.getItem(ID_NAME) === null) {
        localStorage.setItem(ID_NAME, '0');
    }
    const ID = +localStorage.getItem(ID_NAME);
    localStorage.setItem(ID_NAME, `${ID + 1}`);
    return ID;
}

function workOnDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(NAME, VERSION);
        request.onupgradeneeded = (event) => {
            if (event.oldVersion === 0) {
                const database = event.target.result;
                if (!database?.objectStoreNames.contains(NAME)) {
                    database.createObjectStore(NAME);
                }
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function putSVGInDB() {
    const db = await workOnDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(NAME, "readwrite");
        const key = context.id;
        const value = {id: context.id, name: context.name, icon: context.icon, defaultPath: context.defaultPath, lastModified: Date.now()};
        const req = tx.objectStore(NAME).put(value, key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getAllFromDB() {
    const db = await workOnDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(NAME, "readonly");
        const req = tx.objectStore(NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteFromDB(key) {
    const db = await workOnDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(NAME, "readwrite");
        const req = tx.objectStore(NAME).delete(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}