import hashlib

class Hasher:
    def calculate_file_hash(self, filepath):
        """Calculates SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                # Read key and update hash in chunks
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except FileNotFoundError:
            return None

    def build_merkle_tree(self, hashes):
        """Simple Merkle Tree implementation."""
        if not hashes:
            return None
        
        current_layer = hashes
        while len(current_layer) > 1:
            next_layer = []
            for i in range(0, len(current_layer), 2):
                left = current_layer[i]
                right = current_layer[i+1] if i+1 < len(current_layer) else left
                combined = left + right
                next_layer.append(hashlib.sha256(combined.encode()).hexdigest())
            current_layer = next_layer
        
        return current_layer[0]

hasher = Hasher()
