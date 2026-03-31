/**
 * Firefox Content Script (Manifest V2)
 * Injected into all web pages
 */

console.log('🔶 Codexia Firefox Content Script Loaded')

// Listen for messages from popup/background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received:', message)
    
    if (message.action === 'getPageContent') {
        // Extract page content
        const text = document.body?.innerText || document.documentElement.innerText || ''
        const title = document.title || ''
        const meta = document.querySelector('meta[name="description"]')?.content || ''
        
        const content = `${title}\n\n${meta}\n\n${text}`.substring(0, 10000)
        
        console.log('✅ Extracted content:', content.length, 'chars')
        
        sendResponse({
            content: content,
            title: title,
            url: window.location.href
        })
    }
    
    return true
})

console.log('🟢 Content script ready')
