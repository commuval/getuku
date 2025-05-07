async function testURL(title, dueDate) {
    console.log('Starte Power Automate Anfrage mit:', { title, dueDate });
    try {
      const response = await fetch("https://prod-141.westeurope.logic.azure.com:443/workflows/7531daab38f24ec9adf8d51f8ddbd685/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rOB2FcQNH5AysWp2IQpd82BoCCa1yos1zM7vNI0Flik", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title,
          dueDate: dueDate,
          message: "Erkennter Titel und Fälligkeitsdatum"
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("✅ Request erfolgreich:", text);
      return { success: true, response: text };
    } catch (error) {
      console.error("🚨 Fetch-Fehler:", error);
      return { success: false, error: error.message };
    }
}

// Exportiere die Funktion für die Verwendung in anderen Dateien
window.testURL = testURL;

// Funktion zum Extrahieren von Titel und Fälligkeitsdatum aus einem Text
function extractTitleAndDueDate(text) {
  // Beispiel für die Extraktion von Titel und Fälligkeitsdatum
  // Dies müsste an Ihre tatsächliche Datenstruktur angepasst werden
  const titleMatch = text.match(/Preboarding: Welcome Mail aus Outlook verschicken/);
  const dueDateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
  
  if (titleMatch && dueDateMatch) {
    return {
      title: titleMatch[0],
      dueDate: dueDateMatch[1]
    };
  }
  
  return null;
}

// Beispiel für die Verwendung der Extraktionsfunktion
function processData() {
  // Beispieltext, der Titel und Fälligkeitsdatum enthält
  const sampleText = "Preboarding: Welcome Mail aus Outlook verschicken 15.06.2023";
  
  const extractedData = extractTitleAndDueDate(sampleText);
  if (extractedData) {
    console.log("Erkannter Titel:", extractedData.title);
    console.log("Erkanntes Fälligkeitsdatum:", extractedData.dueDate);
    
    // Hier könnte der testURL-Aufruf mit den extrahierten Daten erfolgen
    // testURL(extractedData.title, extractedData.dueDate);
  } else {
    console.log("Titel oder Fälligkeitsdatum konnte nicht erkannt werden.");
  }
}

// Ausführen der Verarbeitung
processData();

// Ursprünglicher Testaufruf
testURL("Preboarding: Welcome Mail aus Outlook verschicken", "15.06.2023");
  
  