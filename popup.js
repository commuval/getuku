let welcomeTasks = [];
let pollingInterval = null; // Speichert das Polling-Intervall

// Funktion zum Aktualisieren der Aufgabenliste im UI
async function updateTaskList(tasks) {
  const taskList = document.getElementById('taskList');
  const sendButton = document.getElementById('sendWelcomeMails');
  const sendSelectedButton = document.getElementById('sendSelectedMails');
  
  if (!taskList || !sendButton || !sendSelectedButton) {
    console.error('DOM-Elemente nicht gefunden');
    return;
  }
  
  console.log('Aktualisiere Task-Liste mit:', tasks);
  
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<div class="task-item">Keine Willkommensmail-Aufgaben gefunden</div>';
    sendButton.disabled = true;
    sendSelectedButton.disabled = true;
    return;
  }

  // Sortiere Aufgaben nach Fälligkeitsdatum
  tasks.sort((a, b) => {
    const dateA = parseDate(a.dueDate);
    const dateB = parseDate(b.dueDate);
    return dateA - dateB;
  });

  // Gruppiere Aufgaben nach Fälligkeitsdatum
  const groupedTasks = {};
  tasks.forEach(task => {
    if (!groupedTasks[task.dueDate]) {
      groupedTasks[task.dueDate] = [];
    }
    groupedTasks[task.dueDate].push(task);
  });

  // Erstelle HTML für die gruppierten Aufgaben
  let html = '';
  for (const dueDate in groupedTasks) {
    html += `<div class="due-date-group">
      <h3 class="due-date-header">Fälligkeitsdatum: ${dueDate}</h3>
    `;
    
    for (const task of groupedTasks[dueDate]) {
      console.log('Verarbeite Task:', task);
      let email;
      let emailDisplay;
      
      if (task.title.includes('Get Ready Mail')) {
        // Lade die gespeicherten Event-E-Mail-Adressen
        const storedData = await chrome.storage.local.get('eventEmails');
        const eventEmails = storedData.eventEmails || [];
        
        console.log('Gespeicherte Event-E-Mail-Adressen:', eventEmails);
        console.log('Suche nach E-Mail für:', task.assignee);
        
        // Teile den Namen in einzelne Wörter auf
        const nameWords = task.assignee.toLowerCase().split(' ');
        
        // Finde die E-Mail-Adresse für diese Person
        const matchingEmail = eventEmails.find(entry => {
          const email = entry.email.toLowerCase();
          // Überprüfe, ob eines der Wörter des Namens in der E-Mail-Adresse vorkommt
          return nameWords.some(word => email.includes(word));
        });
        
        if (matchingEmail) {
          email = matchingEmail.email;
          emailDisplay = `<div class="email-info">📧 Private E-Mail: ${email}</div>`;
          console.log('Gefundene private E-Mail:', email);
        } else {
          emailDisplay = '<div class="email-info error">⚠️ Private E-Mail nicht gefunden</div>';
          console.log('Keine private E-Mail gefunden für:', task.assignee);
        }
      } else {
        email = convertNameToEmail(task.assignee);
        emailDisplay = email ? 
          `<div class="email-info">📧 E-Mail: ${email}</div>` : 
          '<div class="email-info error">⚠️ Keine E-Mail-Adresse gefunden</div>';
      }
      
      html += `
        <div class="task-item">
          <div class="checkbox-container">
            <input type="checkbox" id="task-${tasks.indexOf(task)}" data-task-index="${tasks.indexOf(task)}">
          </div>
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-details">
              Zugewiesen an: ${task.assignee}
              ${emailDisplay}
            </div>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
  }

  taskList.innerHTML = html;
  sendButton.disabled = false;
  sendSelectedButton.disabled = false;
  
  // Event-Listener für Checkboxen
  const checkboxes = taskList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedButtonState);
  });
  
  console.log('Task-Liste aktualisiert');
}

// Hilfsfunktion zum Parsen des Datums
function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // Erwartetes Format: DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length !== 3) return new Date(0);
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Monate sind 0-basiert
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

// Funktion zum Konvertieren eines Namens in eine HR Factory E-Mail-Adresse
function convertNameToEmail(name) {
  if (!name) return null;
  
  // Teile den Namen in Vorname und Nachname
  const nameParts = name.split(' ');
  if (nameParts.length < 2) {
    console.warn(`Kein vollständiger Name gefunden: ${name}`);
    return null;
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts[1];
  
  // Konvertiere zu Kleinbuchstaben und ersetze Umlaute
  const normalizedFirstName = firstName.toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
    
  const normalizedLastName = lastName.toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
    
  return `${normalizedFirstName}.${normalizedLastName}@hrfactory.com`;
}

// Funktion zum Speichern der privaten E-Mail-Adresse
async function savePrivateEmail(email, name) {
  try {
    const timestamp = Date.now();
    // Lade die bestehenden E-Mail-Adressen
    const storedData = await chrome.storage.local.get('privateEmails');
    const privateEmails = storedData.privateEmails || [];
    
    // Überprüfe, ob die E-Mail-Adresse bereits für diese Person gespeichert ist
    const existingIndex = privateEmails.findIndex(entry => entry.name === name);
    if (existingIndex !== -1) {
      // Aktualisiere die bestehende E-Mail-Adresse
      privateEmails[existingIndex] = { email, name, timestamp };
    } else {
      // Füge eine neue E-Mail-Adresse hinzu
      privateEmails.push({ email, name, timestamp });
    }
    
    // Speichere die aktualisierten E-Mail-Adressen
    await chrome.storage.local.set({ 'privateEmails': privateEmails });
    console.log('Private E-Mail-Adresse gespeichert:', email, 'für', name);
  } catch (error) {
    console.error('Fehler beim Speichern der E-Mail-Adresse:', error);
  }
}

// Funktion zum Laden der privaten E-Mail-Adresse
async function loadPrivateEmail(name) {
  try {
    const storedData = await chrome.storage.local.get('privateEmails');
    const privateEmails = storedData.privateEmails || [];
    
    // Finde die E-Mail-Adresse für die spezifische Person
    const entry = privateEmails.find(entry => entry.name === name);
    if (!entry) {
      return null;
    }
    
    // Überprüfe, ob die E-Mail-Adresse älter als 30 Minuten ist
    const age = Date.now() - entry.timestamp;
    if (age > 30 * 60 * 1000) {
      // E-Mail-Adresse ist zu alt, entferne sie
      const updatedEmails = privateEmails.filter(e => e.name !== name);
      await chrome.storage.local.set({ 'privateEmails': updatedEmails });
      return null;
    }
    
    return entry.email;
  } catch (error) {
    console.error('Fehler beim Laden der E-Mail-Adresse:', error);
    return null;
  }
}

// Funktion zum Extrahieren der Event-Kontakt-E-Mail
async function extractEventContactEmail() {
  try {
    // Hole den aktiven Tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Führe das Skript aus, um die E-Mail-Adressen zu finden
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Suche nach allen E-Mail-Icons mit der spezifischen Klasse
        const emailIcons = document.querySelectorAll('.lucide-mail.v-icon--link');
        const emails = [];
        
        emailIcons.forEach(emailIcon => {
          // Gehe zum nächsten span-Element, das die E-Mail-Adresse enthält
          const emailContainer = emailIcon.closest('.sidebar-value');
          if (!emailContainer) return;
          
          const emailText = emailContainer.querySelector('.truncated-text');
          if (!emailText) return;
          
          const email = emailText.textContent.trim();
          
          // Suche nach dem Namen der Person
          const nameElement = emailContainer.previousElementSibling;
          const name = nameElement ? nameElement.textContent.trim() : 'E-Mail';
          
          if (email) {
            emails.push({ email, name });
          }
        });
        
        console.log('Gefundene E-Mail-Adressen:', emails);
        return emails;
      }
    });
    
    // Aktualisiere das UI mit den gefundenen E-Mail-Adressen
    const eventEmailElement = document.getElementById('eventEmail');
    if (result[0].result && result[0].result.length > 0) {
      const emails = result[0].result;
      let html = '';
      
      // Lade bestehende E-Mail-Adressen
      const storedData = await chrome.storage.local.get('eventEmails');
      const existingEmails = storedData.eventEmails || [];
      
      // Kombiniere neue und bestehende E-Mail-Adressen, vermeide Duplikate
      const allEmails = [...existingEmails];
      emails.forEach(newEmail => {
        const isDuplicate = allEmails.some(existingEmail => 
          existingEmail.email.toLowerCase() === newEmail.email.toLowerCase()
        );
        if (!isDuplicate) {
          allEmails.push(newEmail);
        }
      });
      
      // Speichere alle E-Mail-Adressen mit aktuellem Zeitstempel
      const timestamp = Date.now();
      await chrome.storage.local.set({ 
        'eventEmails': allEmails,
        'eventEmailsTimestamp': timestamp
      });
      
      // Setze einen Timer, um die E-Mail-Adressen nach 30 Minuten zu löschen
      setTimeout(async () => {
        const currentData = await chrome.storage.local.get('eventEmailsTimestamp');
        if (currentData.eventEmailsTimestamp === timestamp) {
          await chrome.storage.local.remove(['eventEmails', 'eventEmailsTimestamp']);
          console.log('E-Mail-Adressen nach 30 Minuten gelöscht');
        }
      }, 30 * 60 * 1000);
      
      // Zeige alle E-Mail-Adressen an
      allEmails.forEach(({ email, name }) => {
        html += `
          <div class="email-entry">
            <span>📧</span>
            <span>${name === 'Unbekannt' ? 'E-Mail' : name}: ${email}</span>
          </div>
        `;
      });
      
      eventEmailElement.innerHTML = `
        <div class="email-list" style="max-height: 200px; overflow-y: auto;">
          ${html}
        </div>
      `;
    } else {
      // Versuche, gespeicherte E-Mail-Adressen zu laden
      const storedData = await chrome.storage.local.get(['eventEmails', 'eventEmailsTimestamp']);
      if (storedData.eventEmails && storedData.eventEmailsTimestamp) {
        const age = Date.now() - storedData.eventEmailsTimestamp;
        if (age <= 30 * 60 * 1000) { // 30 Minuten
          let html = '';
          storedData.eventEmails.forEach(({ email, name }) => {
            html += `
              <div class="email-entry">
                <span>📧</span>
                <span>${name === 'Unbekannt' ? 'E-Mail' : name}: ${email}</span>
              </div>
            `;
          });
          eventEmailElement.innerHTML = `
            <div class="email-list" style="max-height: 200px; overflow-y: auto;">
              ${html}
            </div>
          `;
        } else {
          // E-Mail-Adressen sind zu alt
          await chrome.storage.local.remove(['eventEmails', 'eventEmailsTimestamp']);
          eventEmailElement.innerHTML = `
            <div class="email-list" style="max-height: 200px; overflow-y: auto;">
              <div class="email-entry">
                <span>📧</span>
                <span>Keine E-Mail-Adressen gefunden</span>
              </div>
            </div>
          `;
        }
      } else {
        eventEmailElement.innerHTML = `
          <div class="email-list" style="max-height: 200px; overflow-y: auto;">
            <div class="email-entry">
              <span>📧</span>
              <span>Keine E-Mail-Adressen gefunden</span>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Fehler beim Extrahieren der Event-Kontakt-E-Mail:', error);
    const eventEmailElement = document.getElementById('eventEmail');
    eventEmailElement.innerHTML = `
      <div class="email-list" style="max-height: 200px; overflow-y: auto;">
        <div class="email-entry">
          <span>📧</span>
          <span>Fehler beim Laden der E-Mail-Adressen</span>
        </div>
      </div>
    `;
  }
}

// Funktion zum Senden der Willkommensmails
async function sendWelcomeMails() {
  console.log('Starte sendWelcomeMails');
  try {
    for (const task of welcomeTasks) {
      console.log('Verarbeite Task:', task);
      
      // Rufe die Power Automate Funktion auf
      const result = await window.testURL(task.title, task.dueDate);
      if (!result.success) {
        console.error('Fehler beim Senden an Power Automate:', result.error);
        continue;
      }
      
      console.log('Power Automate Anfrage erfolgreich für:', task.title);
    }
    
    // Aktualisiere die UI
    document.getElementById('status').textContent = 'Mails wurden erfolgreich gesendet';
  } catch (error) {
    console.error('Fehler beim Senden der Mails:', error);
    document.getElementById('status').textContent = 'Fehler beim Senden der Mails';
  }
}

// Funktion zum Aktualisieren des Zustands des "Ausgewählte senden" Buttons
function updateSelectedButtonState() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const sendSelectedButton = document.getElementById('sendSelectedMails');
  const hasChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
  sendSelectedButton.disabled = !hasChecked;
}

// Funktion zum Senden ausgewählter Mails
async function sendSelectedMails() {
  const statusDiv = document.getElementById('status');
  const sendSelectedButton = document.getElementById('sendSelectedMails');
  
  if (!statusDiv || !sendSelectedButton) {
    console.error('DOM-Elemente nicht gefunden');
    return;
  }
  
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  const selectedTasks = Array.from(checkboxes).map(checkbox => {
    const taskIndex = parseInt(checkbox.dataset.taskIndex);
    return welcomeTasks[taskIndex];
  });
  
  if (selectedTasks.length === 0) {
    statusDiv.textContent = 'Bitte wählen Sie mindestens eine Aufgabe aus';
    statusDiv.className = 'error';
    return;
  }
  
  statusDiv.textContent = `Sende ${selectedTasks.length} ausgewählte Mails...`;
  statusDiv.className = 'loading';
  sendSelectedButton.disabled = true;

  try {
    const welcomeMailUrl = "https://prod-141.westeurope.logic.azure.com:443/workflows/7531daab38f24ec9adf8d51f8ddbd685/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rOB2FcQNH5AysWp2IQpd82BoCCa1yos1zM7vNI0Flik";
    const firstStepsMailUrl = "https://prod-168.westeurope.logic.azure.com:443/workflows/d35a0e1d115a43abaadc517b52ab5a60/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kBRy6kXzBzM7132IAlwodh1soFjgVnQSgpjM0knuVhQ";
    const appointmentsUrl = "https://prod-229.westeurope.logic.azure.com:443/workflows/6fa8322202c7479eb1c194ee0cfbe761/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WmaII8GRxRlRIElPBsqamFXUuyM17-f_BydKn0d-2SA";
    const surveyUrl = "https://prod-05.westeurope.logic.azure.com:443/workflows/7ffce32655d74f24add4cd587d0f10ee/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VQaZmw6uID0M-eX4YS9yoRrPh4x5soy_iLSEIRcnxT0";

    for (const task of selectedTasks) {
      let email;
      if (task.title.includes('Get Ready Mail')) {
        // Verwende die gespeicherte private E-Mail-Adresse für Get Ready Mails
        email = await loadPrivateEmail(task.assignee);
        if (!email) {
          console.warn('Keine private E-Mail-Adresse für Get Ready Mail gefunden');
          continue;
        }
      } else {
        // Verwende die normale E-Mail-Generierung für andere Mails
        email = convertNameToEmail(task.assignee);
      }

      if (!email) {
        console.warn(`Konnte keine E-Mail-Adresse für ${task.assignee} generieren`);
        continue;
      }

      let url, subject, body;
      if (task.title.includes('Onboarding Day: First-Steps Mail')) {
        url = firstStepsMailUrl;
        subject = 'Onboarding Day: First-Steps Mail';
        body = `Hallo ${task.assignee},\n\nhier sind Ihre ersten Schritte bei HR Factory.\n\nMit freundlichen Grüßen\nIhr HR Factory Team`;
      } else if (task.title.includes('Preboarding: Termine weiterleiten')) {
        url = appointmentsUrl;
        subject = 'Preboarding: Termine weiterleiten';
        body = `Hallo ${task.assignee},\n\nhier sind Ihre Termine für das Preboarding.\n\nMit freundlichen Grüßen\nIhr HR Factory Team`;
        
        console.log('Verarbeite Termine weiterleiten Task:', {
          taskTitle: task.title,
          assignee: task.assignee,
          email: email
        });

        try {
          const requestBody = {
            from: email,
            to: "jassy.qu@hrfactory.com"  // Feste E-Mail-Adresse für Termine weiterleiten
          };

          console.log('Sende Request an Power Automate:', {
            url: appointmentsUrl,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: requestBody
          });

          const response = await fetch(appointmentsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('Power Automate Response Status:', response.status);
          const responseText = await response.text();
          console.log('Power Automate Response:', responseText);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
          }

          // Überprüfe, ob die Antwort gültiges JSON ist
          try {
            const responseJson = JSON.parse(responseText);
            console.log('Power Automate Response JSON:', responseJson);
          } catch (e) {
            console.log('Power Automate Response ist kein JSON:', responseText);
          }
        } catch (error) {
          console.error('Fehler beim Senden der Termine:', error);
          throw error;
        }
      } else if (task.title.includes('Boarding: Onboarding Survey')) {
        url = surveyUrl;
        subject = 'Boarding: Onboarding Survey';
        body = `Hallo ${task.assignee},\n\nhier ist der Link zu Ihrer Onboarding Survey.\n\nMit freundlichen Grüßen\nIhr HR Factory Team`;
      } else {
        url = welcomeMailUrl;
        subject = 'Willkommen bei HR Factory!';
        body = `Hallo ${task.assignee},\n\nwir freuen uns, Sie bei HR Factory begrüßen zu dürfen!\n\nMit freundlichen Grüßen\nIhr HR Factory Team`;
      }

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "recipientName": task.assignee,
          "recipientEmail": email,
          "subject": subject,
          "body": body
        })
      });
    }

    statusDiv.textContent = `✅ ${selectedTasks.length} Mails erfolgreich gesendet!`;
    statusDiv.className = 'success';
  } catch (error) {
    statusDiv.textContent = `🚨 Fehler beim Senden der Mails: ${error.message}`;
    statusDiv.className = 'error';
  } finally {
    sendSelectedButton.disabled = false;
  }
}

// Funktion zum Aktualisieren des Zustands des "Ausgewählte Termine senden" Buttons
function updateAppointmentsButtonState() {
  const checkboxes = document.querySelectorAll('.appointment-checkbox');
  const sendAppointmentsButton = document.getElementById('sendSelectedAppointments');
  const hasChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
  if (sendAppointmentsButton) {
    sendAppointmentsButton.disabled = !hasChecked;
  }
}

// Funktion zum Anzeigen der Kalenderereignisse
function displayCalendarEvents(events) {
    const taskList = document.getElementById('taskList');
    if (!taskList) {
        console.error('Task-Liste nicht gefunden');
        return;
    }

    if (!events || events.length === 0) {
        taskList.innerHTML = '<div class="task-item">Keine Kalenderereignisse gefunden</div>';
        return;
    }

    let html = '<div class="calendar-events">';
    events.forEach(event => {
        html += `
            <div class="event-item">
                <div class="event-title">${event.subject || 'Kein Titel'}</div>
                <div class="event-details">
                    <div class="event-time">${formatDateTime(event.start)} - ${formatDateTime(event.end)}</div>
                    <div class="event-location">${event.location || 'Kein Ort angegeben'}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    taskList.innerHTML = html;
}

// Hilfsfunktion zum Formatieren von Datum und Uhrzeit
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'Keine Zeit angegeben';
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Event-Listener für Nachrichten vom Background-Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CALENDAR_EVENTS') {
        displayCalendarEvents(message.events);
    }
});

// Funktion zum Abrufen der Kalendertermine vom Server
async function fetchCalendarEvents() {
  try {
    const response = await fetch('https://getukuapp-pyd28.ondigitalocean.app/api/calendar-events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Empfangene Kalendertermine:', data);
    
    if (data.events && Array.isArray(data.events)) {
      displayCalendarEvents(data.events);
    } else {
      console.error('Keine gültigen Kalendertermine empfangen');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalendertermine:', error);
  }
}

// Funktion zum Anzeigen der Termine
function displayAppointments(events) {
  const appointmentsList = document.getElementById('appointmentsList');
  if (!appointmentsList) {
    console.error('Appointments-Liste nicht gefunden');
    return;
  }

  if (!events || events.length === 0) {
    appointmentsList.innerHTML = '<div class="appointment-item">Keine Termine gefunden</div>';
    return;
  }

  // Speichere die aktuelle Scroll-Position
  const scrollPosition = appointmentsList.scrollTop;

  // Speichere den Zustand der Checkboxen
  const checkedEvents = new Set();
  const checkboxes = appointmentsList.querySelectorAll('.appointment-checkbox');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      checkedEvents.add(checkbox.dataset.eventId);
    }
  });

  let html = '';
  events.forEach(event => {
    const isChecked = checkedEvents.has(event.id);

    html += `
      <div class="appointment-item">
        <div class="checkbox-container">
          <input type="checkbox" class="appointment-checkbox" data-event-id="${event.id}" ${isChecked ? 'checked' : ''}>
        </div>
        <div class="appointment-info">
          <div class="appointment-title">${event.subject || 'Kein Titel'}</div>
          <div class="appointment-details">
            <div class="appointment-assignee">
              <div class="assignee-header">Zugewiesene Personen:</div>
              ${event.assignedPeople.map(person => `
                <div class="assignee-person">
                  <div class="assignee-name">
                    <span>👤</span>
                    ${person.name}
                  </div>
                  ${person.email ? `
                    <div class="assignee-email">
                      <span>📧</span>
                      ${person.email}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            <div class="appointment-time">
              <span>📅</span>
              ${formatDateTime(event.start)} - ${formatDateTime(event.end)}
            </div>
            ${event.location ? `
              <div class="appointment-location">
                <span>📍</span>
                ${event.location}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  });

  appointmentsList.innerHTML = html;

  // Stelle die Scroll-Position wieder her
  appointmentsList.scrollTop = scrollPosition;

  // Event-Listener für Checkboxen
  const newCheckboxes = appointmentsList.querySelectorAll('.appointment-checkbox');
  newCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSelectedButtonState();
      updateAppointmentsButtonState();
    });
  });
}

// Funktion zum Abrufen der Termine vom Server
async function fetchAppointments() {
  try {
    console.log('Starte Abruf der Termine...');
    const response = await fetch('https://getukuapp-pyd28.ondigitalocean.app/getuku2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Empfangene Termine:', data);
    
    if (data.events && Array.isArray(data.events)) {
      // Finde alle Tasks mit "Termine weiterleiten"
      const appointmentTasks = welcomeTasks.filter(task => 
        task.title.includes('Preboarding: Termine weiterleiten')
      );
      
      console.log('Gefundene Termine-weiterleiten Tasks:', appointmentTasks);
      
      // Füge die zugewiesenen Personen zu den Terminen hinzu
      const eventsWithAssignee = data.events.map(event => {
        // Erstelle ein Array mit allen zugewiesenen Personen
        const assignedPeople = appointmentTasks.map(task => ({
          name: task.assignee,
          email: convertNameToEmail(task.assignee)
        }));
        
        return {
          ...event,
          assignedPeople: assignedPeople // Speichere alle zugewiesenen Personen
        };
      });
      
      console.log('Termine mit zugewiesenen Personen:', eventsWithAssignee);
      displayAppointments(eventsWithAssignee);
    } else {
      console.error('Keine gültigen Termine empfangen');
      document.getElementById('appointmentsList').innerHTML = 
        '<div class="appointment-item">Keine Termine verfügbar</div>';
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    document.getElementById('appointmentsList').innerHTML = 
      '<div class="appointment-item error">Fehler beim Laden der Termine</div>';
  }
}

// Funktion zum Löschen der Termine
async function clearAppointments() {
  try {
    console.log('Lösche Termine...');
    const response = await fetch('https://getukuapp-pyd28.ondigitalocean.app/getuku2', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Termine gelöscht:', data);
    
    // Lösche auch die Anzeige im UI
    const appointmentsList = document.getElementById('appointmentsList');
    if (appointmentsList) {
      appointmentsList.innerHTML = '<div class="appointment-item">Keine Termine verfügbar</div>';
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Termine:', error);
  }
}

// Funktion zum Starten des Pollings
function startPolling() {
  // Stoppe existierendes Polling, falls vorhanden
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Starte neues Polling alle 5 Sekunden
  pollingInterval = setInterval(async () => {
    console.log('Prüfe auf neue Termine...');
    await fetchAppointments();
  }, 5000); // 5000ms = 5 Sekunden
}

// Funktion zum Stoppen des Pollings
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Event-Listener für das Schließen des Plugins
window.addEventListener('unload', function() {
  console.log('Plugin wird geschlossen, stoppe Polling und lösche Termine...');
  stopPolling();
  clearAppointments();
});

// Füge die Funktion zum Initialisieren hinzu
async function initialize() {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) {
    console.error('Status-Div nicht gefunden');
    return;
  }
  
  try {
    statusDiv.textContent = 'Suche nach Aufgaben...';
    
    // Lösche zuerst alle vorhandenen Termine
    await clearAppointments();
    
    // Hole den aktiven Tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('Kein aktiver Tab gefunden');
    }
    
    const tab = tabs[0];
    
    // Überprüfe, ob wir auf der richtigen Seite sind
    if (!tab.url || !tab.url.includes('getuku.com')) {
      statusDiv.textContent = '🚨 Bitte öffnen Sie die Getuku-Webseite und laden Sie die Seite neu';
      statusDiv.className = 'error';
      return;
    }
    
    // Warte länger, bis die Seite vollständig geladen ist
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Stelle sicher, dass das Content Script geladen ist
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content Script wurde erfolgreich injiziert');
    } catch (error) {
      console.error('Fehler beim Injizieren des Content Scripts:', error);
      statusDiv.textContent = '🚨 Fehler beim Laden des Content Scripts. Bitte laden Sie die Seite neu.';
      statusDiv.className = 'error';
      return;
    }
    
    let response;
    try {
      console.log('Sende Nachricht an Content Script...');
      response = await chrome.tabs.sendMessage(tab.id, { action: 'getTodos' });
      console.log('Antwort vom Content Script erhalten:', response);
      
      // Debug-Ausgabe
      if (response && response.todos) {
        console.log('Gefundene Aufgaben:', response.todos);
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      if (error.message.includes('Could not establish connection')) {
        statusDiv.textContent = '🚨 Content Script nicht gefunden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.';
      } else {
        statusDiv.textContent = `🚨 Fehler bei der Kommunikation: ${error.message}`;
      }
      statusDiv.className = 'error';
      return;
    }
    
    if (!response) {
      statusDiv.textContent = '🚨 Keine Antwort vom Content Script erhalten. Bitte laden Sie die Seite neu.';
      statusDiv.className = 'error';
      return;
    }
    
    if (response.error) {
      statusDiv.textContent = `🚨 Fehler beim Extrahieren der Aufgaben: ${response.error}`;
      statusDiv.className = 'error';
      return;
    }
    
    if (!Array.isArray(response.todos)) {
      console.error('Ungültiges Format der Antwort:', response);
      statusDiv.textContent = '🚨 Ungültiges Format der Antwort. Bitte laden Sie die Seite neu.';
      statusDiv.className = 'error';
      return;
    }
    
    // Filtere Willkommensmail-Aufgaben
    console.log('Alle gefundenen Tasks:', response.todos);
    welcomeTasks = response.todos.filter(todo => {
      console.log('Prüfe Task:', todo.title);
      // Suche nach verschiedenen möglichen Varianten des Titels
      const searchTerms = [
        'Preboarding: Welcome Mail',
        'Welcome Mail',
        'Willkommensmail',
        'Onboarding Day: First-Steps Mail',
        'First-Steps Mail',
        'Preboarding: Get Ready Mail',
        'Get Ready Mail',
        'Boarding: Onboarding Survey',
        'Onboarding Survey',
        'Preboarding: Termine weiterleiten'
      ];
      const isMatch = todo && todo.title && searchTerms.some(term => {
        const match = todo.title.includes(term);
        console.log(`Prüfe "${term}" in "${todo.title}": ${match}`);
        return match;
      });
      console.log('Ist Match?', isMatch);
      return isMatch;
    });
    
    console.log('Gefilterte Willkommensmail-Aufgaben:', welcomeTasks);
    
    if (welcomeTasks.length === 0) {
      statusDiv.textContent = 'Keine Willkommensmail-Aufgaben gefunden';
      statusDiv.className = 'info';
    } else {
      statusDiv.textContent = `Gefunden: ${welcomeTasks.length} Willkommensmail-Aufgaben`;
      statusDiv.className = 'success';
    }
    
    await updateTaskList(welcomeTasks);
    
    // Rufe die Kalendertermine ab
    await fetchCalendarEvents();
    
    // Rufe die Termine ab und starte Polling
    await fetchAppointments();
    startPolling();
  } catch (error) {
    console.error('Fehler:', error);
    statusDiv.textContent = `🚨 Fehler beim Laden der Aufgaben: ${error.message}`;
    statusDiv.className = 'error';
  }
}

// Funktion zum Senden der ausgewählten Termine an Power Automate
async function sendSelectedAppointments() {
  const appointmentsList = document.getElementById('appointmentsList');
  const selectedCheckboxes = appointmentsList.querySelectorAll('.appointment-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    alert('Bitte wählen Sie mindestens einen Termin aus.');
    return;
  }

  const selectedEvents = [];
  selectedCheckboxes.forEach(checkbox => {
    const appointmentItem = checkbox.closest('.appointment-item');
    const eventId = checkbox.dataset.eventId;
    const subject = appointmentItem.querySelector('.appointment-title').textContent;
    const timeText = appointmentItem.querySelector('.appointment-time').textContent;
    const location = appointmentItem.querySelector('.appointment-location')?.textContent.replace('📍', '').trim() || '';
    
    // Extrahiere Start- und Endzeit aus dem Zeittext
    const [startTime, endTime] = timeText.replace('📅', '').split('-').map(t => t.trim());
    
    // Finde die zugewiesene Person und ihre E-Mail
    const assigneeEmail = appointmentItem.querySelector('.assignee-email')?.textContent.replace('📧', '').trim() || '';
    
    selectedEvents.push({
      id: eventId,
      subject: subject,
      start: startTime,
      end: endTime,
      location: location,
      email: assigneeEmail
    });
  });

  try {
    const response = await fetch('https://prod-36.westeurope.logic.azure.com:443/workflows/925fbd31ad5243138bee2da607bb1b42/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xirikNMkRpR8x0IFc5-7WFF2d1JkH6W0L41J1wA7It0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: selectedEvents
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Ausgewählte Termine wurden erfolgreich gesendet!');
    
    // Optional: Entferne die Checkbox-Markierungen nach erfolgreichem Senden
    selectedCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    updateSelectedButtonState();
    
  } catch (error) {
    console.error('Fehler beim Senden der Termine:', error);
    alert('Fehler beim Senden der Termine: ' + error.message);
  }
}

// Initialisiere die Erweiterung
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM geladen, initialisiere Erweiterung...');
  
  const sendButton = document.getElementById('sendWelcomeMails');
  const sendSelectedButton = document.getElementById('sendSelectedMails');
  const sendAppointmentsButton = document.getElementById('sendSelectedAppointments');
  
  if (!sendButton || !sendSelectedButton || !sendAppointmentsButton) {
    console.error('Buttons nicht gefunden');
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
      statusDiv.textContent = '🚨 Fehler: Buttons nicht gefunden';
      statusDiv.className = 'error';
    }
    return;
  }
  
  console.log('Buttons gefunden, füge Event-Listener hinzu...');
  sendButton.addEventListener('click', sendWelcomeMails);
  sendSelectedButton.addEventListener('click', sendSelectedMails);
  sendAppointmentsButton.addEventListener('click', sendSelectedAppointments);
  
  console.log('Starte Initialisierung...');
  initialize();
  
  // Extrahiere die Event-Kontakt-E-Mail
  extractEventContactEmail();
}); 