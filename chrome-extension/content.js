chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        const content = document.documentElement.innerText;
        const title = document.title;
        const url = window.location.href;
        
        sendResponse({
            content: content,
            title: title,
            url: url
        });
    }
});

// Show icon indicator on page
console.log('TRUST SENSE extension loaded');
