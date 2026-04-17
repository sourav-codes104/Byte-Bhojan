from flask import Flask
from flask_cors import CORS
from app.database import init_db
from app.routes.auth_routes import auth
from app.routes.upload import upload_bp
from app.routes.members import members   # ✅ ADD THIS

app = Flask(__name__, static_folder="static")

# register routes
app.register_blueprint(auth)
app.register_blueprint(upload_bp)
app.register_blueprint(members)  # ✅ ADD THIS


@app.route("/")
def home():
    return app.send_static_file("landing/index.html")


@app.route("/static/<path:filename>")
def static_files(filename):
    return app.send_static_file(filename)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)