from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Aktiviere CORS für alle Routen

@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'message': 'Willkommen bei der Getuku API'
    })

@app.route('/api/status')
def status():
    print("Power Automate Anfrage erhalten!")
    return jsonify({
        'status': 'online',
        'message': 'Server läuft erfolgreich'
    })

@app.route('/getuku2', methods=['GET', 'POST'])
def getuku2():
    if request.method == 'GET':
        return jsonify({"message": "GET-Anfrage erfolgreich"})
    elif request.method == 'POST':
        data = request.get_json()
        print("POST-Anfrage erhalten:", data)
        return jsonify({"status": "received", "data": data})

@app.route('/api/calendar-events', methods=['POST'])
def receive_calendar_events():
    try:
        events = request.json
        print("Empfangene Kalendertermine:", events)
        
        # Hier können Sie die Termine in einer Datenbank speichern, wenn nötig
        
        return jsonify({
            'status': 'success',
            'message': 'Kalendertermine erfolgreich empfangen',
            'events': events
        })
    except Exception as e:
        print("Fehler beim Empfangen der Kalendertermine:", str(e))
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port) 
