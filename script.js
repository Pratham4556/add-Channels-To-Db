// Function to get the current tab's URL
function getCurrentTabUrl(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError) {
            console.error("Error getting the active tab:", chrome.runtime.lastError);
            return;
        }
        if (tabs.length === 0) {
            console.error("No active tab found");
            return;
        }
        const tab = tabs[0];
        callback(tab.url);
    });
}

// Function to send the URL to the webhook
async function sendUrlToWebhook(url) {
    const webhookUrl = 'https://automation.famekeeda.com/webhook/ytchecker';

    // Define the data you want to send in the POST request
    const postData = {
        url: url // Send the current tab URL here
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData), // Convert postData to JSON string
            mode: 'cors' // Change to 'cors' for handling cross-origin requests
        });

        // Since `mode: 'cors'` allows cross-origin responses, you should receive the response
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // If response is JSON, handle it accordingly
        const data = await response.json(); // Parse JSON response
        console.log('Success:', data);
    } catch (error) {
        console.error('Error sending URL to webhook:', error.message);
    }
}

// Wait for the DOM to load before accessing elements
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("myButton");

    let currentTabUrl = "";

    // Get the current tab URL as soon as the popup is loaded
    getCurrentTabUrl(function(url) {
        currentTabUrl = url;
        console.log("Current tab URL:", url); // Log the URL for debugging purposes
    });

    // Add click event listener to the button
    button.addEventListener("click", () => {
        if (currentTabUrl) {
            console.log("Button clicked. Sending URL:", currentTabUrl);
            sendUrlToWebhook(currentTabUrl); // Send the URL when button is clicked
        } else {
            console.error("No URL available to send.");
        }
    });
});
