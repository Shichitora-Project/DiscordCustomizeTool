function sendUserTypeSettings() {
    chrome.storage.local.get(['userType'], data => {
        window.postMessage({
            type: 'DPC_USER_TYPE_SETTINGS',
            userType: data.userType || 'normal'
        }, '*');
    });
}

window.addEventListener('message', event => {
    if (event.source !== window || event.data?.type !== 'DPC_USER_TYPE_REQUEST') return;
    sendUserTypeSettings();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.userType) return;
    sendUserTypeSettings();
});
