function sendStaffModeSettings() {
    chrome.storage.local.get(['staffModeEnabled', 'adminPermissionOverrideEnabled'], data => {
        window.postMessage({
            type: 'DISCORD_BADGES_STAFF_MODE',
            staffModeEnabled: data.staffModeEnabled !== false,
            adminPermissionOverrideEnabled: data.adminPermissionOverrideEnabled === true
        }, '*');
    });
}

sendStaffModeSettings();

window.addEventListener('message', event => {
    if (event.source !== window || event.data?.type !== 'DISCORD_BADGES_STAFF_MODE_REQUEST') return;
    sendStaffModeSettings();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!changes.staffModeEnabled && !changes.adminPermissionOverrideEnabled) return;
    sendStaffModeSettings();
});
