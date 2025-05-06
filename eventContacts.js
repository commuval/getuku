// Funktion zum Erkennen und Anzeigen von E-Mail-Adressen auf der Event-Kontaktseite
function detectAndDisplayEventEmails() {
  // Suche nach dem Event-Kontakt-Bereich
  const eventContactsSection = document.querySelector('.event-contacts');
  if (!eventContactsSection) {
    console.log('Event-Kontakt-Bereich nicht gefunden');
    return;
  }

  // Suche nach E-Mail-Adressen im Text
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const textContent = eventContactsSection.textContent;
  const emails = textContent.match(emailRegex);

  if (!emails || emails.length === 0) {
    console.log('Keine E-Mail-Adressen gefunden');
    return;
  }

  // Erstelle einen Container für die gefundenen E-Mail-Adressen
  const emailContainer = document.createElement('div');
  emailContainer.className = 'email-container';
  emailContainer.style.cssText = `
    margin-top: 16px;
    padding: 12px;
    background-color: #f0f7ff;
    border-radius: 4px;
    border: 1px solid #ddd;
  `;

  // Füge eine Überschrift hinzu
  const heading = document.createElement('h3');
  heading.textContent = 'Gefundene E-Mail-Adressen';
  heading.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #0066cc;
  `;
  emailContainer.appendChild(heading);

  // Füge jede gefundene E-Mail-Adresse hinzu
  emails.forEach(email => {
    const emailElement = document.createElement('div');
    emailElement.className = 'email-item';
    emailElement.style.cssText = `
      margin: 4px 0;
      padding: 4px 8px;
      background-color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
    `;

    const emailIcon = document.createElement('span');
    emailIcon.textContent = '📧';
    emailIcon.style.marginRight = '8px';

    const emailText = document.createElement('span');
    emailText.textContent = email;

    emailElement.appendChild(emailIcon);
    emailElement.appendChild(emailText);
    emailContainer.appendChild(emailElement);
  });

  // Füge den Container zum Event-Kontakt-Bereich hinzu
  eventContactsSection.appendChild(emailContainer);
}

// Initialisiere die E-Mail-Erkennung, wenn die Seite geladen ist
document.addEventListener('DOMContentLoaded', detectAndDisplayEventEmails); 