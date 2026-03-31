/**
 * Firefox Background Script (Manifest V2)
 * Handles persistent background tasks and message routing
 */

console.log('🔶 Codexia Firefox Background Script Loaded')

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📬 Background received:', message)
    
    if (message.action === 'logData') {
        // Store or process data
        console.log('📊 Data logged:', message.data)
        sendResponse({ status: 'logged' })
    }
    
    return true // Keep channel open for async responses
})

// Listen for tab updates
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log('✅ Tab loaded:', tab.url)
    }
})

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { name: 'Codexia Firefox Background' }
}
