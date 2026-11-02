chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'activeBadgeOrder', 'overrideEnabled', 'badgeOmissionEnabled', 'customBadges', 'badgeEdits'], (data) => {
    window.postMessage({
        type: 'FROM_BADGE_EXTENSION_BRIDGE',
        enabledHashes: data.enabledHashes,
        badgeOrder: data.badgeOrder,
        activeBadgeOrder: data.activeBadgeOrder,
        overrideEnabled: data.overrideEnabled !== false,
        badgeOmissionEnabled: data.badgeOmissionEnabled !== false,
        customBadges: Array.isArray(data.customBadges) ? data.customBadges : [],
        badgeEdits: data.badgeEdits && typeof data.badgeEdits === 'object' ? data.badgeEdits : {}
    }, '*');
});

chrome.storage.onChanged.addListener((changes) => {
    chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'activeBadgeOrder', 'overrideEnabled', 'badgeOmissionEnabled', 'customBadges', 'badgeEdits'], (data) => {
        window.postMessage({
            type: 'FROM_BADGE_EXTENSION_BRIDGE',
            enabledHashes: data.enabledHashes || [],
            badgeOrder: data.badgeOrder || [],
            activeBadgeOrder: data.activeBadgeOrder || [],
            overrideEnabled: data.overrideEnabled !== false,
            badgeOmissionEnabled: data.badgeOmissionEnabled !== false,
            customBadges: Array.isArray(data.customBadges) ? data.customBadges : [],
        badgeEdits: data.badgeEdits && typeof data.badgeEdits === 'object' ? data.badgeEdits : {}
        }, '*');
    });
});
