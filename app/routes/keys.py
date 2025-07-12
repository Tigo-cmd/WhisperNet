# app/routes/keys.py

from flask import Blueprint, request, jsonify, abort, g
from app.database import get_db

keys_bp = Blueprint('keys', __name__)


# Public key registration (no auth required)
@keys_bp.route('/register', methods=['POST'])
def register_key():
    data = request.get_json() or {}
    address = data.get('address')
    public_key = data.get('public_key')
    if not address or not public_key:
        abort(400, 'Missing address or public_key')
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO users (address, public_key)
            VALUES (?, ?)
            """,
            (address.lower(), public_key)
        )
        db.commit()
        print(data)
        return jsonify({'message': 'Public key registered'}), 200
    except Exception as e:
        abort(500, str(e))


# Public key retrieval (open GET)
@keys_bp.route('/<address>', methods=['GET'])
def get_key(address):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT public_key FROM users WHERE address = ?",
        (address.lower(),)
    )
    row = cursor.fetchone()
    if not row or not row[0]:
        abort(404, 'Public key not found')
    return jsonify({'address': address.lower(), 'public_key': row[0]})
