# app/routes/messages.py

from flask import Blueprint, request, jsonify, abort, g
from datetime import datetime
from app.database import get_db

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/send', methods=['POST'])
def send_message():
    db = get_db()
    cursor = db.cursor()

    # Authenticated sender is set by middleware
    sender = g.get('current_user')
    data = request.get_json() or {}
    recipient = data.get('to')
    encrypted_body = data.get('encrypted_body')

    if not recipient or not encrypted_body:
        abort(400, 'Missing "to" or "encrypted_body"')
    print(recipient, encrypted_body)
    try:
        # Insert message directly into SQLite
        cursor.execute(
            """
            INSERT INTO messages (sender, recipient, encrypted_body, timestamp)
            VALUES (?, ?, ?, ?)
            """,
            (sender, recipient.lower(), encrypted_body, datetime.utcnow()),
        )
        db.commit()
        print(data)
        return jsonify({'message': 'Message sent', 'id': cursor.lastrowid}), 201
    except Exception as e:
        db.rollback()
        abort(500, f"Failed to send message: {str(e)}")


@messages_bp.route('/inbox', methods=['GET'])
def get_inbox():
    db = get_db()
    cursor = db.cursor()
    user = g.get('current_user')
    print(user)

    cursor.execute(
        """
        SELECT id, sender, encrypted_body, timestamp
        FROM messages
        WHERE recipient = ?
        ORDER BY timestamp DESC
        """,
        (user,),
    )

    messages = [
        {
            'id': row['id'],
            'from': row['sender'],
            'encrypted_body': row['encrypted_body'],
            'timestamp': row['timestamp'],
        }
        for row in cursor.fetchall()
    ]
    print(messages)
    return jsonify(messages), 200


@messages_bp.route('/sent', methods=['GET'])
def get_sent():
    db = get_db()
    cursor = db.cursor()
    user = g.get('current_user')

    cursor.execute(
        """
        SELECT id, recipient, encrypted_body, timestamp
        FROM messages
        WHERE sender = ?
        ORDER BY timestamp DESC
        """,
        (user,),
    )

    messages = [
        {
            'id': row['id'],
            'to': row['recipient'],
            'encrypted_body': row['encrypted_body'],
            'timestamp': row['timestamp'],
        }
        for row in cursor.fetchall()
    ]
    print(messages)
    return jsonify(messages), 200
