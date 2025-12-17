from flask import Flask, Response  # Import Flask and Response to create the web server and send image responses
import pymongo  # For connecting to MongoDB
from bson.binary import Binary  # To handle binary image data in MongoDB
from PIL import Image  # To process and convert image formats
import io  # To handle byte streams

app = Flask(__name__)  # Initialize the Flask app

# Connect to the MongoDB server and select the database and collection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["Restphoto"]
collection = db["Profpics"]

# Route for the home page – lists all image filenames with clickable links
@app.route('/')
def home():
    return '''
        <h1>Available Images</h1>
        <ul>
            ''' + ''.join(
                f'<li><a href="/image/{doc["filename"]}">{doc["filename"]}</a></li>'
                for doc in collection.find()) + '''
        </ul>
    '''

# Route to display an image by its filename in the browser
@app.route('/image/<filename>')
def show_image(filename):
    try:
        # Find the image document by filename
        doc = collection.find_one({"filename": filename})
        if not doc:
            return f"No image found with filename: {filename}", 404

        # Read the image binary data and open it using PIL
        image_binary = doc['file']
        image = Image.open(io.BytesIO(image_binary))

        # Convert to RGB if image is not in JPEG-compatible format
        if image.mode in ("RGBA", "P", "L"):
            image = image.convert("RGB")

        # Save image to a byte stream and send it in the response
        img_io = io.BytesIO()
        image.save(img_io, 'JPEG')
        img_io.seek(0)

        return Response(img_io, mimetype='image/jpeg')
    except Exception as e:
        return f"Error displaying image: {e}", 500

# Start the Flask development server
if __name__ == '__main__':
    app.run(debug=True)
