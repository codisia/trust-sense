Office.onReady((result) => {
    if (result.host === Office.HostType.Outlook) {
        document.getElementById('loading').style.display = 'none';
        analyzeCurrentEmail();
    }
});

async function analyzeCurrentEmail() {
    try {
        const messageProperties = await Office.context.mailbox.item.getAsync('properties');
        
        const sender = Office.context.mailbox.item.sender?.emailAddress || 'Unknown';
        const subject = Office.context.mailbox.item.subject || 'No Subject';
        
        // Get email body
        Office.context.mailbox.item.body.getAsync(
            Office.CoercionType.Text,
            async (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const body = result.value;
                    await analyzeEmail(sender, subject, body);
                }
            }
        );

    } catch (error) {
        showError(error.message);
    }
}

async function analyzeEmail(sender, subject, body) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';

    try {
        const response = await fetch('http://localhost:8000/api/platforms/email/analyze-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'outlook-plugin'
            },
            body: JSON.stringify({
                email_subject: subject,
                email_body: body,
                sender: sender,
                recipient: Office.context.mailbox.userProfile.emailAddress
            })
        });

        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }

        const data = await response.json();
        displayAnalysis(data, sender, subject);

    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayAnalysis(data, sender, subject) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('result').style.display = 'block';

    // Display sender and subject
    document.getElementById('sender').textContent = sender;
    document.getElementById('subject').textContent = subject.substring(0, 40) + 
        (subject.length > 40 ? '...' : '');

    // Phishing analysis
    const phishingScore = Math.round(data.phishing_score || 0);
    const phishingBadge = document.getElementById('phishing-badge');
    
    phishingBadge.textContent = data.is_phishing ? 'HIGH RISK' : (phishingScore > 50 ? 'MEDIUM' : 'LOW');
    phishingBadge.className = 'phishing-badge';
    
    if (phishingScore > 70) phishingBadge.classList.add('phishing-high');
    else if (phishingScore > 40) phishingBadge.classList.add('phishing-medium');
    else phishingBadge.classList.add('phishing-low');

    document.getElementById('phishing-score').textContent = `Score: ${phishingScore}/100`;

    // Spam detection
    document.getElementById('spam-status').textContent = data.is_spam ? '⚠️ SPAM DETECTED' : '✅ Not Spam';

    // Malicious intent
    const maliciousScore = Math.round(data.malicious_intent_score || 0);
    document.getElementById('malicious-score').textContent = maliciousScore;

    // Warnings
    const warningsDiv = document.getElementById('warnings');
    warningsDiv.innerHTML = '';

    if (data.is_phishing) {
        warningsDiv.innerHTML += `
            <div class="warning">
                <div class="warning-text">⚠️ <strong>PHISHING ALERT:</strong> This email shows signs of phishing. 
                Do not click links or download attachments.</div>
            </div>
        `;
    }

    if (data.is_spam) {
        warningsDiv.innerHTML += `
            <div class="warning">
                <div class="warning-text">⚠️ <strong>SPAM:</strong> This email has been classified as spam. 
                Consider marking as spam and deleting.</div>
            </div>
        `;
    }

    // Recommendations
    const recommendations = [
        'Verify sender address carefully',
        'Do not click suspicious links',
        'Do not download attachments from unknown senders',
        'Check for spelling and grammar errors',
        'Look for urgent language (common in phishing)',
        'Verify requests for personal information'
    ];

    const recList = document.getElementById('recommendations');
    recList.innerHTML = recommendations
        .map(rec => `<li>${rec}</li>`)
        .join('');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}
