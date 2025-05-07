from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # CORS für alle Routen

# Speichert die Termine im Speicher (in einer Produktionsumgebung sollten Sie eine Datenbank verwenden)
stored_events = []

# Speichert die ausgewählten Termine
selected_appointments = []

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

@app.route('/getuku2', methods=['GET', 'POST', 'DELETE'])
def getuku2():
    global stored_events
    if request.method == 'GET':
        # Gebe alle gespeicherten Termine zurück
        return jsonify({
            "status": "success",
            "events": stored_events
        })
    elif request.method == 'POST':
        try:
            data = request.get_json()
            print("POST-Anfrage erhalten:", data)
            
            # Speichere die neuen Termine
            if 'events' in data and isinstance(data['events'], list):
                stored_events = data['events']
                print("Termine gespeichert:", stored_events)
                return jsonify({
                    "status": "success",
                    "message": f"{len(stored_events)} Termine erfolgreich gespeichert",
                    "events": stored_events
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": "Ungültiges Datenformat. 'events' Array erwartet."
                }), 400
                
        except Exception as e:
            print("Fehler beim Verarbeiten der POST-Anfrage:", str(e))
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
    elif request.method == 'DELETE':
        # Lösche alle gespeicherten Termine
        stored_events = []
        print("Alle Termine wurden gelöscht")
        return jsonify({
            "status": "success",
            "message": "Alle Termine wurden gelöscht"
        })

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

@app.route('/selected-appointments', methods=['POST'])
def handle_selected_appointments():
    try:
        data = request.json
        if not data or 'appointments' not in data:
            return jsonify({'error': 'Keine Termine im Request'}), 400

        # Speichere die ausgewählten Termine
        global selected_appointments
        selected_appointments = data['appointments']

        # Hier kann Power Automate die Termine abrufen
        return jsonify({
            'message': 'Termine erfolgreich gespeichert',
            'count': len(selected_appointments)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-selected-appointments', methods=['GET'])
def get_selected_appointments():
    """Endpunkt für Power Automate, um die ausgewählten Termine abzurufen"""
    try:
        global selected_appointments
        return jsonify({
            'appointments': selected_appointments
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)   # Achte darauf, dass der Host korrekt auf 0.0.0.0 gesetzt ist
