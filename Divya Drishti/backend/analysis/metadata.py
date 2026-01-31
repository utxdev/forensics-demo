import os
import mimetypes
import hashlib

try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

def calculate_hashes(file_path: str) -> dict:
    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
                md5_hash.update(byte_block)
                
        return {
            "sha256": sha256_hash.hexdigest(),
            "md5": md5_hash.hexdigest()
        }
    except Exception as e:
        return {"error": str(e)}


def extract_metadata(file_path: str) -> dict:
    metadata = {
        "basic": {},
        "exif": {},
        "gps": {},
        "file_info": {},
        "digital_dna": {},
        "timeline": []
    }
    
    try:
        # File Info & Stats
        file_stat = os.stat(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        
        # Magic Byte Analysis (Digital DNA)
        mime_type = "application/octet-stream"
        detected_ext = "unknown"
        
        if HAS_MAGIC:
            try:
                mime = magic.Magic(mime=True)
                mime_type = mime.from_file(file_path)
                # Simple mapping for checking
                detected_ext = mimetypes.guess_extension(mime_type) or "unknown"
            except Exception:
                mime_type, _ = mimetypes.guess_type(file_path)
        else:
            mime_type, _ = mimetypes.guess_type(file_path)
            
        # Robust Integrity Check
        is_authentic = False
        
        # 1. Exact Registry Match
        valid_exts = mimetypes.guess_all_extensions(mime_type)
        if ext in valid_exts:
            is_authentic = True
            
        # 2. Heuristic Match (e.g. "png" in "image/png")
        if not is_authentic and ext.replace('.', '') in mime_type:
            is_authentic = True
            
        # 3. Known Aliases (JPEG specific)
        if ext in ['.jpg', '.jpeg', '.jpe'] and 'jpeg' in mime_type:
            is_authentic = True

        metadata["digital_dna"] = {
            "declared_extension": ext,
            "detected_mime": mime_type,
            "integrity_check": "MATCH" if is_authentic else "SUSPICIOUS_MISMATCH"
        }

        metadata["file_info"] = {
            "size_bytes": file_stat.st_size,
            "mime_type": mime_type,
            "extension": ext
        }
        
        # Timeline Construction
        metadata["timeline"].append({"event": "File Created (FS)", "timestamp": str(datetime.fromtimestamp(file_stat.st_ctime))})
        metadata["timeline"].append({"event": "File Modified (FS)", "timestamp": str(datetime.fromtimestamp(file_stat.st_mtime))})

        # EXIF Extraction
        with open(file_path, 'rb') as f:
            tags = exifread.process_file(f)
            for tag in tags.keys():
                if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
                    val = str(tags[tag])
                    metadata["exif"][tag] = val
                    
                    # Extract timestamp for timeline
                    if "DateTime" in tag:
                        metadata["timeline"].append({"event": f"EXIF {tag}", "timestamp": val})
                    
            if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
                metadata["gps"]["latitude"] = str(tags['GPS GPSLatitude'])
                metadata["gps"]["longitude"] = str(tags['GPS GPSLongitude'])

    except Exception as e:
        metadata["error"] = str(e)
        
    return metadata
