import os
import json
import openai
import requests
from flask import Flask, request, jsonify, send_from_directory
from google.oauth2 import service_account
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask("review_analysis_app")
CORS(app)

# Load the credentials from the credentials.json file
credentials_path = "./credentials.json"

llm = openai.ChatCompletion.create(model="gpt-3.5-turbo")
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["ALLOWED_EXTENSIONS"] = {"json"}

openai.api_key = "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"


def allowed_file(filename):
    """
    Check if the file extension is allowed based on the allowed extensions set in the app configuration.
    """
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]
    )


def download_file_from_drive(file_id):
    """
    Download a file from Google Drive using the provided file ID and the credentials stored in credentials_path.
    """
    # Load the credentials from the service account file
    credentials = service_account.Credentials.from_service_account_file(
        credentials_path, scopes=["https://www.googleapis.com/auth/drive"]
    )

    headers = {
        "Authorization": f"Bearer {credentials.token}",
    }
    params = {
        "alt": "media",
    }
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}"
    response = requests.get(url, headers=headers, params=params)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], "drive_file.json")
    with open(file_path, "wb") as file:
        file.write(response.content)
    return file_path


@app.route("/")
def index():
    """
    Route handler for the root endpoint.
    """
    return "Welcome to the API!"


@app.route("/uploads/<filename>")
def serve_uploaded_file(filename):
    """
    Route handler for serving uploaded files.
    """
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/analyze-reviews", methods=["POST"])
def analyze_reviews():
    """
    Route handler for analyzing reviews.
    """
    try:
        if "file" in request.files:
            file = request.files["file"]
            if file and allowed_file(file.filename):
                # Handle uploaded file
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                reviews = []
                with open(file_path, "r") as json_file:
                    reviews = json.load(json_file)

            else:
                return (
                    jsonify(
                        {"error": "Invalid file. Please upload a valid JSON file."}
                    ),
                    400,
                )
        else:
            data = request.get_json()
            drive_link = data.get("driveLink")
            if drive_link:
                # Handle file from Google Drive
                file_id = drive_link.split("/")[-2]
                file_path = download_file_from_drive(file_id)
                with open(file_path, "r") as json_file:
                    reviews = json.load(json_file)
            else:
                return jsonify({"error": "No file uploaded."}), 400

        # Perform sentiment analysis
        sentiment_count = {"positive": 0, "negative": 0, "neutral": 0}
        total_reviews = len(reviews)

        text = (
            "for a given set of product review, analyze the reviews. In the output, I want to know the percentage of good, bad, and neutral reviews. Provided array of reviews: "
            + str(reviews)
        )
        response = llm.create(
            prompt=text,
            max_tokens=100,
            temperature=0.7,
            n=1,
            stop=None,
            log_level="info",
            logprobs=None,
            echo=None,
            engine="text-davinci-003",
            stream=None,
            user=None,
        )
        output = response.choices[0].text.strip()
        output = output.split("\n")

        for line in output:
            if line.startswith("Positive:"):
                sentiment_count["positive"] += float(
                    line.split(":")[1].strip().strip("%")
                )
            elif line.startswith("Negative:"):
                sentiment_count["negative"] += float(
                    line.split(":")[1].strip().strip("%")
                )
            elif line.startswith("Neutral:"):
                sentiment_count["neutral"] += float(
                    line.split(":")[1].strip().strip("%")
                )

        percent_positive = (sentiment_count["positive"] / total_reviews) * 100
        percent_negative = (sentiment_count["negative"] / total_reviews) * 100
        percent_neutral = (sentiment_count["neutral"] / total_reviews) * 100

        results = {
            "total_reviews": total_reviews,
            "positive_reviews": sentiment_count["positive"],
            "percent_positive": percent_positive,
            "negative_reviews": sentiment_count["negative"],
            "percent_negative": percent_negative,
            "neutral_reviews": sentiment_count["neutral"],
            "percent_neutral": percent_neutral,
        }

        results_file_path = os.path.join(app.config["UPLOAD_FOLDER"], "results.json")
        with open(results_file_path, "w") as results_file:
            json.dump(results, results_file)

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run()
