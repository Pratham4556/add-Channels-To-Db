// Use dynamic import to load `node-fetch`
(async () => {
    const fetch = (await import('node-fetch')).default;
  
    // Define the webhook endpoint URL
    const webhookUrl = 'https://automation.famekeeda.com/webhook-test/ytchecker';
  
    // Define the data you want to send in the POST request
    const postData = {
      key1: 'value1',
      key2: 'value2'
    };
  
    // Send the POST request
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Adjust if your endpoint expects a different content type
        },
        body: JSON.stringify(postData)
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }
      const data = await response.json(); // or response.text() if you expect a text response
      console.log('Success:', data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  })();
  