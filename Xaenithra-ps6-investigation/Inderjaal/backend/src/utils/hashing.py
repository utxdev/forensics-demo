import hashlib
import logging

logger = logging.getLogger(__name__)

def calculate_file_hash(filepath: str, algorithm: str = "sha256") -> str:
    """
    Calculates the hash of a file.
    """
    try:
        if algorithm == "sha256":
            hasher = hashlib.sha256()
        else:
            hasher = hashlib.md5()

        with open(filepath, 'rb') as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                hasher.update(chunk)
        
        return hasher.hexdigest()
    except Exception as e:
        logger.error(f"Failed to hash {filepath}: {e}")
        return ""

def log_integrity(filepath: str, manifest_path: str = "integrity_manifest.txt"):
    """
    Appends the file hash to a manifest file.
    """
    file_hash = calculate_file_hash(filepath)
    if file_hash:
        with open(manifest_path, 'a') as f:
            f.write(f"{file_hash}  {filepath}\n")
        logger.info(f"Integrity verified: {file_hash} -> {filepath}")
