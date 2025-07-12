# app/middleware/auth.py
from flask import request, g, abort, Blueprint, jsonify

from eth_account.messages import encode_defunct
from eth_account import Account

auth_bp = Blueprint('auth', __name__)

# Static login message (must match frontend)
LOGIN_MESSAGE = "Login to WhisperNet"


# Middleware to run before each request
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    address = data.get('address')
    signature = data.get('signature')
    message = data.get('message')

    if not all([address, signature, message]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Verify the signature
        message_hash = encode_defunct(text=LOGIN_MESSAGE)
        recovered_address = Account.recover_message(message_hash, signature=signature)
        # print(recovered_address, signature, address, message_hash)

        if recovered_address.lower() != address.lower():
            return jsonify({'error': 'Invalid signature'}), 401

        return jsonify({
            'success': True,
            'address': address.lower()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
# Skips auth for login and key registration endpoints


def metamask_auth_middleware():
    # Paths that do not require auth
    open_paths = [
         '/auth/login',
        '/keys/register'
    ]
    # Allow GET on public key retrieval
    if request.path.startswith('/keys/') and request.method == 'GET':
        return

    if request.path in open_paths:
        return

    # Extract MetaMask auth headers
    address = request.headers.get('X-Wallet-Address')
    signature = request.headers.get('X-Wallet-Auth')
    print(signature, address)

    if not signature or not address:
        abort(401, 'Authentication required. Please connect your wallet.')
        
    # Reconstruct the signed message
    message = encode_defunct(text=LOGIN_MESSAGE)
    try:
        recovered = Account.recover_message(message, signature=signature)
    except Exception as e:
        abort(401, f'Invalid signature format: {str(e)}')

    # Verify that the recovered address matches header
    if recovered.lower() != address.lower():
        abort(401, 'Signature does not match address')

    # Store the authenticated address for route handlers
    g.current_user = address.lower()
