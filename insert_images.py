import os
import pymongo
from bson import Binary
from PIL import Image
import io

# Connecting  to the database:
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["Restphoto"]
collection = db["Profpics"]

# Folder where the images are stored
image_folder = "/home/abdalla/Desktop/"

# Loop through the images to store: (pic1.jpg to pic10.jpg)
for i in range(1, 11):
    image_path = os.path.join(image_folder, f"pic{i}.jpg")
    
    # Open each image and convert it to binary data:
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
        
        # Inserting the image data into the database:
        collection.insert_one({
            "filename": f"pic{i}.jpg",
            "file": Binary(image_data)
        })

print("Images inserted successfully.")
