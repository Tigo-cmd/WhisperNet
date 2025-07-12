import sqlite3
from flask import g, current_app
from pymongo import MongoClient
import os

DATABASE = "data/app.db"
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

def get_db():
    if 'sqlite_db' not in g:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        g.sqlite_db = sqlite3.connect(DATABASE, check_same_thread=False)
        g.sqlite_db.row_factory = sqlite3.Row
    return g.sqlite_db

def get_mongo():
    if 'mongo_db' not in g:
        g.mongo_client = MongoClient(MONGO_URI)
        g.mongo_db = g.mongo_client.icp_messaging
    return g.mongo_db

def close_db(e=None):
    sqlite_db = g.pop('sqlite_db', None)
    if sqlite_db is not None:
        sqlite_db.close()
    
    mongo_client = g.pop('mongo_client', None)
    if mongo_client is not None:
        mongo_client.close()


def init_db(app):
    app.teardown_appcontext(close_db)
    
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                address TEXT PRIMARY KEY,
                public_key TEXT,
                private_key TEXT
            )
        """)

        # Messages table with content
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT,
                recipient TEXT,
                encrypted_body TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender) REFERENCES users(address),
                FOREIGN KEY (recipient) REFERENCES users(address)
            )
        """)

        db.commit()