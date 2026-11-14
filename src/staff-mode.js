(() => {
    let staffModeEnabled = true;
    let adminPermissionOverrideEnabled = false;
    let staffRetryTimer = null;
    let adminRetryTimer = null;
    let staffRetriesRemaining = 200;
    let adminRetriesRemaining = 200;

    const environmentSnapshots = new Map();
    const userSnapshots = new Map();
    let adminOverrideState = null;

    function restoreProperty(target, key, descriptor) {
        try {
            if (descriptor) Object.defineProperty(target, key, descriptor);
            else delete target[key];
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not restore', key, error);
        }
    }

    function getStore(name) {
        try {
            window.findStore ??= storeName => (
                window.Flux ??= webpackChunkdiscord_app.push([[Symbol()],, req =>
                    req.b && Object.values(req.c).values().map(module => module.exports)
                        .filter(value => typeof value === 'object' && value !== window && value !== DOMTokenList.prototype)
                        .flatMap(value => [value, ...Object.values(value)])
                        .find(value => value?.Store?.prototype)
                ])
            ).Store.getAll().find(store => store.getName() === storeName);
            return window.findStore(name) || null;
        } catch {
            return null;
        }
    }

    function getUserStore() {
        try {
            const chunkArray = window.webpackChunkdiscord_app;
            if (chunkArray?.push) {
                const modules = chunkArray.push([[Symbol()], {}, req => req.c]);
                chunkArray.pop();
                const userModule = Object.values(modules || {}).find(module =>
                    module?.exports?.default?.__proto__?.getUsers &&
                    module?.exports?.default?.getCurrentUser
                );
                if (userModule?.exports?.default) return userModule.exports.default;
            }
        } catch {}
        return getStore('UserStore');
    }

    function getDispatcherHandlers(userStore) {
        try {
            return Array.from(userStore?._dispatcher?._actionHandlers?._nodes?.values?.() || []);
        } catch {
            return [];
        }
    }

    function refreshStaffExperimentStores(userStore) {
        const user = userStore?.getCurrentUser?.();
        if (!user) return false;

        const handlers = getDispatcherHandlers(userStore);
        if (!handlers.length) return false;

        try {
            handlers.find(item => item.name === 'DeveloperExperimentStore')
                ?.actionHandler?.CONNECTION_OPEN?.();
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not refresh developer experiment state', error);
        }

        try {
            handlers.find(item => item.name === 'ExperimentStore')
                ?.actionHandler?.OVERLAY_INITIALIZE?.({ user });
            handlers.find(item => item.name === 'ExperimentStore')?.storeDidChange?.();
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not refresh experiment state', error);
        }
        return true;
    }

    function applyStaffMode() {
        if (!staffModeEnabled) return;

        let environmentReady = false;
        const environment = window.GLOBAL_ENV;
        if (environment && typeof environment === 'object') {
            if (!environmentSnapshots.has(environment)) {
                environmentSnapshots.set(environment, {
                    PROJECT_ENV: Object.getOwnPropertyDescriptor(environment, 'PROJECT_ENV'),
                    RELEASE_CHANNEL: Object.getOwnPropertyDescriptor(environment, 'RELEASE_CHANNEL')
                });
            }
            try {
                environment.PROJECT_ENV = 'staging';
                environment.RELEASE_CHANNEL = 'staging';
                environmentReady = true;
            } catch (error) {
                console.warn('[Discord Profile Customize Tool] Could not apply environment settings', error);
            }
        }

        const userStore = getUserStore();
        let userReady = false;
        let experimentsReady = false;
        try {
            const user = userStore?.getCurrentUser?.();
            if (user) {
                if (!userSnapshots.has(user)) {
                    userSnapshots.set(user, Object.getOwnPropertyDescriptor(user, 'flags'));
                }
                user.flags = (Number(user.flags) || 0) | 1;
                userReady = true;
                experimentsReady = refreshStaffExperimentStores(userStore);
            }
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not apply client-side staff flags', error);
        }

        if ((!environmentReady || !userReady || !experimentsReady) && staffRetriesRemaining > 0 && staffRetryTimer === null) {
            staffRetriesRemaining -= 1;
            staffRetryTimer = window.setTimeout(() => {
                staffRetryTimer = null;
                applyStaffMode();
            }, 50);
        }
    }

    function restoreStaffMode() {
        if (staffRetryTimer !== null) {
            window.clearTimeout(staffRetryTimer);
            staffRetryTimer = null;
        }

        for (const [environment, snapshot] of environmentSnapshots) {
            restoreProperty(environment, 'PROJECT_ENV', snapshot.PROJECT_ENV);
            restoreProperty(environment, 'RELEASE_CHANNEL', snapshot.RELEASE_CHANNEL);
        }
        environmentSnapshots.clear();

        for (const [user, descriptor] of userSnapshots) {
            restoreProperty(user, 'flags', descriptor);
        }
        userSnapshots.clear();

        refreshStaffExperimentStores(getUserStore());
    }

    function savePrototypeDescriptor(snapshots, prototype, key) {
        let prototypeSnapshot = snapshots.get(prototype);
        if (!prototypeSnapshot) {
            prototypeSnapshot = new Map();
            snapshots.set(prototype, prototypeSnapshot);
        }
        if (!prototypeSnapshot.has(key)) {
            prototypeSnapshot.set(key, Object.getOwnPropertyDescriptor(prototype, key));
        }
    }

    function setPrototypeOverride(snapshots, prototype, key, value) {
        savePrototypeDescriptor(snapshots, prototype, key);
        Object.defineProperty(prototype, key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value
        });
    }

    function applyGuildOwnerDisplayOverride(state) {
        const currentUser = state.userStore?.getCurrentUser?.();
        if (!currentUser?.id) return;

        try {
            state.guildStore?.getGuildsArray?.().forEach(guild => {
                if (!state.guildSnapshots.has(guild)) {
                    state.guildSnapshots.set(guild, Object.getOwnPropertyDescriptor(guild, 'ownerId'));
                }
                guild.ownerId = currentUser.id;
            });
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not apply client-side guild owner display override', error);
        }
    }

    function applyAdminPermissionOverride() {
        if (!adminPermissionOverrideEnabled || adminOverrideState) return;

        const permissionStore = getStore('PermissionStore');
        const userStore = getUserStore();
        const guildStore = getStore('GuildStore');
        if (!permissionStore || !userStore || !guildStore) {
            if (adminRetriesRemaining > 0 && adminRetryTimer === null) {
                adminRetriesRemaining -= 1;
                adminRetryTimer = window.setTimeout(() => {
                    adminRetryTimer = null;
                    applyAdminPermissionOverride();
                }, 50);
            }
            return;
        }

        const permissionPrototype = Object.getPrototypeOf(permissionStore);
        if (!permissionPrototype) return;

        const state = {
            permissionStore,
            userStore,
            guildStore,
            prototypeSnapshots: new Map(),
            guildSnapshots: new Map(),
            guildListener: null,
            guildUnsubscribe: null
        };

        try {
            const permissionProps = Object.fromEntries(
                Object.keys(permissionStore.getGuildPermissionProps({ id: 0 })).map(key => [key, true])
            );
            const allPermissions = () => ~0n;
            const alwaysAllowed = () => true;

            for (const method of [
                'getGuildPermissions',
                'getChannelPermissions',
                'computePermissions',
                'computeBasicPermissions'
            ]) {
                setPrototypeOverride(state.prototypeSnapshots, permissionPrototype, method, allPermissions);
            }
            setPrototypeOverride(
                state.prototypeSnapshots,
                permissionPrototype,
                'getGuildPermissionProps',
                guild => ({ ...permissionProps, guild })
            );
            for (const method of [
                'can',
                'canAccessGuildSettings',
                'canAccessMemberSafetyPage',
                'canBasicChannel',
                'canImpersonateRole',
                'canManageUser',
                'canWithPartialContext',
                'isRoleHigher'
            ]) {
                setPrototypeOverride(state.prototypeSnapshots, permissionPrototype, method, alwaysAllowed);
            }

            state.guildListener = () => applyGuildOwnerDisplayOverride(state);
            state.guildUnsubscribe = guildStore.addChangeListener?.(state.guildListener);
            applyGuildOwnerDisplayOverride(state);

            adminOverrideState = state;
            permissionStore.emitChange?.();
            guildStore.emitChange?.();
        } catch (error) {
            restoreAdminPermissionOverride(state);
            console.warn('[Discord Profile Customize Tool] Could not apply client-side admin permission override', error);
        }
    }

    function restoreAdminPermissionOverride(state = adminOverrideState) {
        if (adminRetryTimer !== null) {
            window.clearTimeout(adminRetryTimer);
            adminRetryTimer = null;
        }
        if (!state) return;

        try {
            if (typeof state.guildUnsubscribe === 'function') {
                state.guildUnsubscribe();
            } else {
                state.guildStore?.removeChangeListener?.(state.guildListener);
            }
        } catch (error) {
            console.warn('[Discord Profile Customize Tool] Could not remove guild listener', error);
        }

        for (const [guild, descriptor] of state.guildSnapshots) {
            restoreProperty(guild, 'ownerId', descriptor);
        }
        state.guildSnapshots.clear();

        for (const [prototype, properties] of state.prototypeSnapshots) {
            for (const [key, descriptor] of properties) {
                restoreProperty(prototype, key, descriptor);
            }
        }
        state.prototypeSnapshots.clear();

        try { state.permissionStore?.emitChange?.(); } catch {}
        try { state.guildStore?.emitChange?.(); } catch {}

        if (state === adminOverrideState) adminOverrideState = null;
    }

    function setSettings(settings) {
        if (typeof settings.staffModeEnabled === 'boolean' && settings.staffModeEnabled !== staffModeEnabled) {
            staffModeEnabled = settings.staffModeEnabled;
            staffRetriesRemaining = 200;
            if (staffModeEnabled) applyStaffMode();
            else restoreStaffMode();
        }
        if (typeof settings.adminPermissionOverrideEnabled === 'boolean' && settings.adminPermissionOverrideEnabled !== adminPermissionOverrideEnabled) {
            adminPermissionOverrideEnabled = settings.adminPermissionOverrideEnabled;
            adminRetriesRemaining = 200;
            if (adminPermissionOverrideEnabled) applyAdminPermissionOverride();
            else restoreAdminPermissionOverride();
        }
    }

    window.addEventListener('message', event => {
        if (event.source !== window || event.data?.type !== 'DISCORD_BADGES_STAFF_MODE') return;
        setSettings(event.data);
    });

    window.postMessage({ type: 'DISCORD_BADGES_STAFF_MODE_REQUEST' }, '*');
    applyStaffMode();
})();
