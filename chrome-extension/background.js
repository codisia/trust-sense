chrome.runtime.onInstalled.addListener(() => {
    console.log('TRUST SENSE extension installed or updated');
});

chrome.tabs.onActivated.addListener(() => {
    console.log('Tab activated - ready to analyze');
});
