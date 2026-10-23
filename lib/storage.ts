export function readStorage(key: string) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

export function removeStorage(key: string) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}
