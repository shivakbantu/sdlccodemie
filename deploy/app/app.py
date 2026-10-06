from flask import Flask, jsonify, request
import os

app = Flask(__name__)


app.get("/")
def root():
    return jsonify({
        "name": "sdlccododemie",
        "status": "ok",
        "port": int(os.environ.get("PORT", "5000")),
        "method": request.method,
    })


if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "5000")),
        debug=True,
    )
