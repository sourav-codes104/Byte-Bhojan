from flask import Flask
from app.database import init_db
from app.routes.auth_routes import auth
from app.routes.upload import upload_bp

# ✅ create app FIRST
app = Flask(__name__, static_folder="static")

# ✅ register routes AFTER app creation
app.register_blueprint(auth)
app.register_blueprint(upload_bp)


@app.route("/")
def home():
    return app.send_static_file("auth/login.html")


@app.route("/static/<path:filename>")
def static_files(filename):
    return app.send_static_file(filename)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)