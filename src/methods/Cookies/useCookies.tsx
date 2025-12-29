export const getCookie = (key: string): string => {
    // Check if document is defined (running in the browser)
    if (typeof document === 'undefined') {
        // Return a default value or handle the case when running in a server-side environment
        return '';
    }
    return document.cookie.split("; ").reduce((total, currentCookie) => {
        const item = currentCookie.split("=");
        const storedKey = item[0];
        const storedValue = item[1];
        return key === storedKey
            ? decodeURIComponent(storedValue)
            : total;
    }, '');
};

export const isNew = (slug: string): boolean => {
    return getCookie(slug) ===  ''
}

export const setCookie = (key: string, value: string | number = 0, numberOfDays: number = 365) => {
    if (typeof document === 'undefined') {
        // Return a default value or handle the case when running in a server-side environment
        return '';
    }
    const safe_key = key.replace(/\//g, '')
    const now = new Date();
    now.setTime(now.getTime() + (numberOfDays * 60 * 60 * 24 * 1000));
    document.cookie = `${safe_key}=${value.toString()};     expires=${now.toUTCString()}; path=/`;
};

export const makeToken = (idLength: number = 11): string => {
    let token = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < idLength) {
        token += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return token;
}

export const getUid = (): string => {
    // A UID is a side-wide unique identifier for the user.
    // In contrast to the secret, this UID can be public.
    let uid = getCookie('uid')
    if (!uid) {
        uid = setUid()
    }
    return uid
}

const setUid = (): string => {
    const value = makeToken(16)
    setCookie('uid', value)
    return value
}