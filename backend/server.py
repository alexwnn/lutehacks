from flask import Flask
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GOOGLE_MAPS_API_KEY')

app = Flask(__name__)

@app.route('/get-places/lat/<lat>/lng/<lng>', methods=['GET'])
def get_places(lat, lng):
    return f'Places near {lat}, {lng}'

if __name__ == '__main__':
    app.run()