import json
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv('../.env')

client = MongoClient(os.getenv("MONGO_URI"))
db = client["neatcode"]
# 1. Configuration
CONNECTION_STRING = "mongodb+srv://<username>:<password>@neatcode.abcde.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "neatcode"
COLLECTION_NAME = "problems"
JSON_FILE_PATH = "generated_problems.json"

# 2. Database connection
client = MongoClient(CONNECTION_STRING)
db = client[DB_NAME]
problems_col = db[COLLECTION_NAME]

# 3. Load and parse the JSON file
with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Ensure the data is a list of documents
if isinstance(data, dict):
    # Handles wrapper objects if present (e.g., {"problems": [...]})
    problems_list = data.get("problems", [data])
elif isinstance(data, list):
    problems_list = data
else:
    raise ValueError("JSON file root must be an array or an object.")

# 4. Prepare bulk upsert operations
operations = []
current_time = datetime.utcnow()

for item in problems_list:
    doc = dict(item)

    # Cast problemCreator hex string to BSON ObjectId
    if "problemCreator" in doc and isinstance(doc["problemCreator"], str):
        doc["problemCreator"] = ObjectId(doc["problemCreator"])

    # Set timestamps and version according to Mongoose schema conventions
    doc.setdefault("createdAt", current_time)
    doc["updatedAt"] = current_time
    doc.setdefault("__v", 0)

    # Upsert by title to prevent duplicate key errors
    operations.append(
        UpdateOne(
            {"title": doc["title"]},
            {"$set": doc},
            upsert=True
        )
    )

# 5. Execute in MongoDB
if operations:
    result = problems_col.bulk_write(operations)
    print("Database sync completed:")
    print(f" - Upserted (new): {result.upserted_count}")
    print(f" - Modified (updated): {result.modified_count}")
    print(f" - Matched (unchanged): {result.matched_count}")
else:
    print("No problems found in the JSON file to process.")