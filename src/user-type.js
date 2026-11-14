(() => {
    const snapshots = new WeakMap();
    const keys = ['bot', 'flags', 'system', 'isClyde'];

    function applyUserType(userType) {
        try {
            let _mods = webpackChunkdiscord_app.push([[Symbol()],{},r=>r.c]);
            webpackChunkdiscord_app.pop();

            let findByProps = (...props) => {
                for (let m of Object.values(_mods)) {
                    try {
                        if (!m.exports || m.exports === window) continue;
                        if (props.every((x) => m.exports?.[x])) return m.exports;

                        for (let ex in m.exports) {
                            if (props.every((x) => m.exports?.[ex]?.[x]) && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return m.exports[ex];
                        }
                    } catch {}
                }
            };

            const currentUser = findByProps('getCurrentUser')?.getCurrentUser?.();
            if (!currentUser) return;
            if (!snapshots.has(currentUser)) {
                if (userType === 'normal') return;
                snapshots.set(currentUser, Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(currentUser, key)])));
            }
            const original = snapshots.get(currentUser);
            for (const key of keys) {
                try {
                    if (original[key]) Object.defineProperty(currentUser, key, original[key]);
                    else delete currentUser[key];
                } catch {}
            }
            if (userType === 'bot') currentUser.bot = true;
            if (userType === 'verifiedBot') {
                currentUser.bot = true;
                currentUser.flags = 65536;
            }
            if (userType === 'system') currentUser.system = true;
            if (userType === 'ai') currentUser.isClyde = () => true;
        } catch {}
    }

    window.addEventListener('message', event => {
        if (event.source !== window || event.data?.type !== 'DPC_USER_TYPE_SETTINGS') return;
        const userType = ['normal', 'bot', 'verifiedBot', 'system', 'ai'].includes(event.data.userType) ? event.data.userType : 'normal';
        applyUserType(userType);
    });

    window.postMessage({ type: 'DPC_USER_TYPE_REQUEST' }, '*');
})();
