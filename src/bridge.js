chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'activeBadgeOrder', 'overrideEnabled', 'badgeOmissionEnabled'], (data) => {
    window.postMessage({
        type: 'FROM_BADGE_EXTENSION_BRIDGE',
        enabledHashes: data.enabledHashes,
        badgeOrder: data.badgeOrder,
        activeBadgeOrder: data.activeBadgeOrder,
        overrideEnabled: data.overrideEnabled !== false,
        badgeOmissionEnabled: data.badgeOmissionEnabled !== false
    }, '*');
});

chrome.storage.onChanged.addListener((changes) => {
    chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'activeBadgeOrder', 'overrideEnabled', 'badgeOmissionEnabled'], (data) => {
        window.postMessage({
            type: 'FROM_BADGE_EXTENSION_BRIDGE',
            enabledHashes: data.enabledHashes || [],
            badgeOrder: data.badgeOrder || [],
            activeBadgeOrder: data.activeBadgeOrder || [],
            overrideEnabled: data.overrideEnabled !== false,
        badgeOmissionEnabled: data.badgeOmissionEnabled !== false
        }, '*');
    });
});
