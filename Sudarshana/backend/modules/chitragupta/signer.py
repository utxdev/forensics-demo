from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import base64
import os

class Signer:
    def __init__(self):
        self.private_key = None
        self.public_key = None
        self._generate_keys()

    def _generate_keys(self):
        # Generate generic keys for demo session
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096,
        )
        self.public_key = self.private_key.public_key()

    def sign_data(self, data_string):
        """Signs string data (e.g., hash) and returns base64 signature."""
        if not self.private_key: return None
        
        signature = self.private_key.sign(
            data_string.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode('utf-8')

    def get_public_key_pem(self):
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode('utf-8')

signer = Signer()
