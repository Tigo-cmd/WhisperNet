"""
Project By Tigo
All lines Reserved
"""
from flask import Flask
from app.routes.keys import keys_bp
from app.routes.messages import messages_bp
from app.middleware.auth import auth_bp
from app.middleware.auth import metamask_auth_middleware
from app.database import init_db


def create_app():
    app = Flask(__name__)

    # Initialize database
    init_db(app)

    # Register the MetaMask auth middleware
    app.before_request(metamask_auth_middleware)
    # Register blueprints
    app.register_blueprint(keys_bp, url_prefix='/keys')
    app.register_blueprint(messages_bp, url_prefix='/messages')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    @app.route("/", methods=["GET"])
    def index():
        return {"message": "Encrypted Messaging API is running."}

    if __name__ == "__main__":
        app.run(debug=True, host="0.0.0.0", port=5000)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
