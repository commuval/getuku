// Sofortige Debug-Ausgabe beim Laden des Scripts
console.log('Content Script wurde geladen!');

// Benachrichtige den Background Service Worker, dass das Content Script geladen ist
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Element gefunden: ${selector}`);
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        console.log(`Timeout beim Warten auf Element: ${selector}`);
        reject(new Error(`Timeout: Element ${selector} nicht gefunden`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

async function extractTodos() {
  const todos = [];
  
  try {
    console.log('Warte auf Aufgaben-Container...');
    
    // Warte auf den Container mit längerer Timeout-Zeit
    const tasksContainer = await waitForElement('[test-id="tasks-list"]', 15000);
    console.log('Container gefunden:', tasksContainer);
    
    // Warte länger, bis die Aufgaben geladen sind
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Suche nach allen Aufgaben-Elementen
    const taskElements = tasksContainer.querySelectorAll('.tasklist-row');
    console.log('Gefundene Aufgaben:', taskElements.length);
    
    taskElements.forEach((element, index) => {
      console.log(`Verarbeite Aufgabe ${index + 1}`);
      
      // Angepasste Selektoren für die neue Struktur
      const titleElement = element.querySelector('.subtitle-2');
      // Neuer Selektor für den Namen aus dem span-Element
      const nameElement = element.querySelector('.caption.ml-1.g5--text');
      const dateElement = element.querySelector('.body-2 span');
      
      console.log('Gefundene Elemente für Aufgabe', index + 1, ':', {
        title: titleElement?.textContent?.trim(),
        name: nameElement?.textContent?.trim(),
        date: dateElement?.textContent?.trim()
      });
      
      const title = titleElement?.textContent?.trim() || '';
      const name = nameElement?.textContent?.trim() || '';
      const date = dateElement?.textContent?.trim() || '';
      
      console.log('Extrahiert für Aufgabe', index + 1, ':', { title, name, date });
      
      if (title.includes('Preboarding: Welcome Mail aus Outlook verschicken') || 
          title.includes('Onboarding Day: First-Steps Mail versenden') ||
          title.includes('Preboarding: Get Ready Mail aus Outlook verschicken') ||
          title.includes('Boarding: Onboarding Survey verschicken') ||
          title.includes('Preboarding: Termine weiterleiten')) {
        console.log('Erkannte Aufgabe gefunden:', { title, name, date });
        const todo = {
          title: title,
          assignee: name, // Verwende den Namen aus dem span-Element
          dueDate: date
        };
        todos.push(todo);
      }
    });

    console.log('Gefundene Willkommensmail-Aufgaben:', todos);
    return todos;
  } catch (error) {
    console.error('Fehler beim Extrahieren der Aufgaben:', error);
    chrome.runtime.sendMessage({
      action: 'extractionError',
      error: error.message,
      url: window.location.href
    });
    return todos;
  }
}

// Listener für Nachrichten vom Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Nachricht empfangen:', request);
  
  if (request.action === 'getTodos') {
    console.log('Starte Extraktion der Aufgaben...');
    // Verwende Promise, um die asynchrone Funktion zu handhaben
    extractTodos()
      .then(todos => {
        console.log('Sende Antwort:', { todos });
        sendResponse({ todos });
      })
      .catch(error => {
        console.error('Fehler bei der Extraktion:', error);
        sendResponse({ error: error.message });
      });
    return true; // Wichtig: true zurückgeben, um asynchrone Antwort zu ermöglichen
  }
});

// Debug: Teste die Extraktion sofort
console.log('Starte automatische Extraktion...');
extractTodos().then(todos => {
  console.log('Automatische Extraktion abgeschlossen:', todos);
}).catch(error => {
  console.error('Fehler bei automatischer Extraktion:', error);
}); 