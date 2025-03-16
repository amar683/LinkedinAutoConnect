document.getElementById('startButton').addEventListener('click', async () => {
  const searchQuery = document.getElementById('searchQuery').value;
  const maxPages = document.getElementById('maxPages').value;
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });

    chrome.tabs.sendMessage(tab.id, {
      action: "startAutomation",
      searchQuery: searchQuery,
      maxPages: parseInt(maxPages)
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
});