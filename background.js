chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Öffne das Plugin-Fenster
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.includes('getuku.com')) {
    // Überprüfe, ob das Fenster bereits existiert
    const windows = await chrome.windows.getAll();
    const existingWindow = windows.find(w => w.type === 'popup' && w.title === 'Uku To-Do Exporter');
    
    if (existingWindow) {
      // Wenn das Fenster existiert, aktiviere es
      await chrome.windows.update(existingWindow.id, { focused: true });
    } else {
      // Erstelle ein neues Fenster
      await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 500,
        height: 600,
        left: 100,
        top: 100,
        focused: true
      });
    }
    
    // Aktiviere das Content-Script für die aktuelle Tab
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content Script erfolgreich injiziert');
    } catch (error) {
      console.error('Fehler beim Injizieren des Content Scripts:', error);
    }
  }
}); 