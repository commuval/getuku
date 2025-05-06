from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'online',
        'message': 'Server läuft erfolgreich'
    })
    
@app.route('/getuku2')
def getuku2():
    try:
        return jsonify({
            'status': 'success',
            'message': 'Getuku2 Endpunkt funktioniert'
        })
    except Exception as e:
        print(f"Fehler in getuku2: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port) 
