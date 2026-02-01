#!/usr/bin/env python3
"""
Forensic Scanner - Special Find Utility for Android Devices
Recursively scans device storage, calculates hashes, and generates forensic catalogs.
"""

import subprocess
import json
import hashlib
import os
import re
from typing import List, Dict, Optional
from datetime import datetime


class ForensicScanner:
    """Advanced forensic file scanner for Android devices via ADB."""
    
    # File type categories for filtering
    FILE_TYPES = {
        'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'],
        'videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.3gp', '.webm'],
        'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'],
        'documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'],
        'databases': ['.db', '.sqlite', '.sqlite3', '.realm'],
        'archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
        'apks': ['.apk'],
        'all': []  # Empty list means all files
    }
    
    def __init__(self):
        self.device_connected = False
        self.scan_results = []
        self.total_files = 0
        self.total_size = 0
        
    def check_connection(self) -> bool:
        """Check if ADB device is connected."""
        try:
            result = subprocess.run(
                ["adb", "devices"], 
                capture_output=True, 
                text=True, 
                timeout=2
            )
            lines = result.stdout.strip().split('\n')
            for line in lines[1:]:
                if line.strip() and "device" in line:
                    self.device_connected = True
                    return True
            self.device_connected = False
            return False
        except (FileNotFoundError, subprocess.TimeoutExpired):
            self.device_connected = False
            return False
    
    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename."""
        if '.' in filename:
            return '.' + filename.rsplit('.', 1)[1].lower()
        return ''
    
    def _matches_filter(self, filename: str, file_types: List[str]) -> bool:
        """Check if file matches the specified type filters."""
        if not file_types or 'all' in file_types:
            return True
        
        ext = self._get_file_extension(filename)
        for file_type in file_types:
            if file_type in self.FILE_TYPES:
                if not self.FILE_TYPES[file_type]:  # 'all' category
                    return True
                if ext in self.FILE_TYPES[file_type]:
                    return True
        return False
    
    def _parse_ls_output(self, ls_output: str, base_path: str) -> List[Dict]:
        """Parse 'ls -la' output to extract file information."""
        files = []
        lines = ls_output.strip().split('\n')
        
        for line in lines:
            # Skip empty lines and header
            if not line.strip() or line.startswith('total'):
                continue
            
            # Parse ls -la format: permissions links owner group size date time filename
            parts = line.split()
            if len(parts) < 8:
                continue
            
            permissions = parts[0]
            size = parts[4] if parts[4].isdigit() else '0'
            
            # Filename is everything after the time (handles spaces in names)
            # Find the time part (HH:MM format)
            time_idx = -1
            for i, part in enumerate(parts):
                if ':' in part and len(part) == 5:  # HH:MM format
                    time_idx = i
                    break
            
            if time_idx == -1:
                continue
            
            filename = ' '.join(parts[time_idx + 1:])
            
            # Skip . and .. entries
            if filename in ['.', '..']:
                continue
            
            is_dir = permissions.startswith('d')
            is_link = permissions.startswith('l')
            
            # Handle symlinks (format: name -> target)
            if is_link and '->' in filename:
                filename = filename.split('->')[0].strip()
            
            file_path = f"{base_path.rstrip('/')}/{filename}"
            
            files.append({
                'name': filename,
                'path': file_path,
                'size': int(size),
                'is_dir': is_dir,
                'is_link': is_link,
                'permissions': permissions
            })
        
        return files
    
    def _scan_directory_recursive(
        self, 
        path: str, 
        file_types: List[str],
        max_depth: int = 10,
        current_depth: int = 0,
        exclude_patterns: Optional[List[str]] = None
    ) -> List[Dict]:
        """Recursively scan directory on device."""
        if current_depth >= max_depth:
            return []
        
        if exclude_patterns is None:
            exclude_patterns = ['/proc', '/sys', '/dev', '/acct', '/config']
        
        # Check if path should be excluded
        for pattern in exclude_patterns:
            if path.startswith(pattern):
                return []
        
        results = []
        
        try:
            # Get directory listing with details
            result = subprocess.run(
                ["adb", "shell", "ls", "-la", path],
                capture_output=True,
                text=True,
                timeout=10,
                errors='replace'
            )
            
            if result.returncode != 0:
                return []
            
            files = self._parse_ls_output(result.stdout, path)
            
            for file_info in files:
                # Skip if it's a directory
                if file_info['is_dir']:
                    # Recursively scan subdirectories
                    subdir_results = self._scan_directory_recursive(
                        file_info['path'],
                        file_types,
                        max_depth,
                        current_depth + 1,
                        exclude_patterns
                    )
                    results.extend(subdir_results)
                else:
                    # Check if file matches filter
                    if self._matches_filter(file_info['name'], file_types):
                        results.append(file_info)
                        self.total_files += 1
                        self.total_size += file_info['size']
        
        except (subprocess.TimeoutExpired, Exception) as e:
            print(f"Error scanning {path}: {e}")
        
        return results
    
    def scan_device(
        self,
        start_path: str = '/sdcard',
        file_types: Optional[List[str]] = None,
        max_depth: int = 10,
        calculate_hashes: bool = False,
        exclude_patterns: Optional[List[str]] = None
    ) -> Dict:
        """
        Perform comprehensive forensic scan of device storage.
        
        Args:
            start_path: Starting directory for scan
            file_types: List of file type categories to include (e.g., ['images', 'videos'])
            max_depth: Maximum directory depth to scan
            calculate_hashes: Whether to pull files and calculate SHA-256 hashes
            exclude_patterns: Directory patterns to exclude from scan
            
        Returns:
            Dictionary containing scan results and metadata
        """
        if not self.check_connection():
            return {
                'success': False,
                'error': 'No device connected'
            }
        
        if file_types is None:
            file_types = ['all']
        
        print(f"Starting forensic scan of {start_path}...")
        print(f"File types: {', '.join(file_types)}")
        print(f"Max depth: {max_depth}")
        
        self.scan_results = []
        self.total_files = 0
        self.total_size = 0
        
        start_time = datetime.now()
        
        # Perform recursive scan
        files = self._scan_directory_recursive(
            start_path,
            file_types,
            max_depth,
            0,
            exclude_patterns
        )
        
        # Optionally calculate hashes (WARNING: This pulls files, can be slow!)
        if calculate_hashes:
            print(f"Calculating hashes for {len(files)} files...")
            for i, file_info in enumerate(files):
                if i % 10 == 0:
                    print(f"Progress: {i}/{len(files)}")
                
                # For hash calculation, we'd need to pull the file
                # This is optional and can be very slow for many files
                try:
                    hash_val = self._calculate_remote_hash(file_info['path'])
                    file_info['sha256'] = hash_val
                except Exception as e:
                    file_info['sha256'] = f"Error: {str(e)}"
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        scan_metadata = {
            'success': True,
            'scan_path': start_path,
            'file_types': file_types,
            'total_files_found': len(files),
            'total_size_bytes': self.total_size,
            'total_size_mb': round(self.total_size / (1024 * 1024), 2),
            'scan_duration_seconds': round(duration, 2),
            'timestamp': start_time.isoformat(),
            'hashes_calculated': calculate_hashes,
            'files': files
        }
        
        self.scan_results = files
        
        print(f"Scan complete! Found {len(files)} files ({scan_metadata['total_size_mb']} MB)")
        
        return scan_metadata
    
    def _calculate_remote_hash(self, remote_path: str) -> str:
        """
        Calculate SHA-256 hash of a file on the device without pulling it.
        Uses 'sha256sum' command on device if available.
        """
        try:
            # Try using sha256sum on device (faster, doesn't require pull)
            result = subprocess.run(
                ["adb", "shell", "sha256sum", f'"{remote_path}"'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and result.stdout:
                # Output format: "hash  filename"
                hash_val = result.stdout.split()[0]
                return hash_val
            else:
                # Fallback: pull file and hash locally (slower)
                return self._pull_and_hash(remote_path)
        
        except Exception as e:
            raise Exception(f"Hash calculation failed: {e}")
    
    def _pull_and_hash(self, remote_path: str) -> str:
        """Pull file temporarily and calculate hash."""
        import tempfile
        
        with tempfile.NamedTemporaryFile(delete=True) as tmp:
            result = subprocess.run(
                ["adb", "pull", remote_path, tmp.name],
                capture_output=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise Exception("Failed to pull file")
            
            # Calculate hash
            sha256_hash = hashlib.sha256()
            with open(tmp.name, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            
            return sha256_hash.hexdigest()
    
    def export_to_json(self, output_file: str) -> bool:
        """Export scan results to JSON file."""
        try:
            with open(output_file, 'w') as f:
                json.dump({
                    'total_files': self.total_files,
                    'total_size_bytes': self.total_size,
                    'files': self.scan_results
                }, f, indent=2)
            return True
        except Exception as e:
            print(f"Export error: {e}")
            return False
    
    def export_to_csv(self, output_file: str) -> bool:
        """Export scan results to CSV file."""
        try:
            import csv
            
            with open(output_file, 'w', newline='') as f:
                if not self.scan_results:
                    return False
                
                fieldnames = ['name', 'path', 'size', 'permissions']
                if 'sha256' in self.scan_results[0]:
                    fieldnames.append('sha256')
                
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for file_info in self.scan_results:
                    row = {k: file_info.get(k, '') for k in fieldnames}
                    writer.writerow(row)
            
            return True
        except Exception as e:
            print(f"CSV export error: {e}")
            return False


# Standalone test/CLI interface
if __name__ == "__main__":
    import sys
    
    scanner = ForensicScanner()
    
    if not scanner.check_connection():
        print("ERROR: No ADB device connected!")
        sys.exit(1)
    
    # Example usage
    print("=== Forensic Scanner Demo ===")
    
    # Scan for images and videos in /sdcard/DCIM
    results = scanner.scan_device(
        start_path='/sdcard/DCIM',
        file_types=['images', 'videos'],
        max_depth=5,
        calculate_hashes=False  # Set to True to calculate hashes (slower)
    )
    
    if results['success']:
        print(f"\nFound {results['total_files_found']} files")
        print(f"Total size: {results['total_size_mb']} MB")
        print(f"Scan duration: {results['scan_duration_seconds']} seconds")
        
        # Show first 10 files
        print("\nFirst 10 files:")
        for file_info in results['files'][:10]:
            print(f"  - {file_info['name']} ({file_info['size']} bytes)")
        
        # Export to JSON
        scanner.export_to_json('/tmp/forensic_scan_results.json')
        print("\nResults exported to /tmp/forensic_scan_results.json")
    else:
        print(f"Scan failed: {results.get('error', 'Unknown error')}")
