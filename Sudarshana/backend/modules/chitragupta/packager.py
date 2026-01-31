import os
import zipfile
import shutil
from pathlib import Path

class ForensicPackager:
    def __init__(self, base_extraction_path="/tmp/forensics_extraction"):
        self.base_path = Path(base_extraction_path)
        # For demo, ensure the path exists
        self.base_path.mkdir(parents=True, exist_ok=True)
        self._setup_mock_evidence()

    def _setup_mock_evidence(self):
        """Creates dummy files if they don't exist for the demo."""
        (self.base_path / "Calls").mkdir(exist_ok=True)
        (self.base_path / "Images").mkdir(exist_ok=True)
        (self.base_path / "Chat").mkdir(exist_ok=True)

        # Dummy files
        (self.base_path / "Calls" / "call_log.csv").write_text("timestamp,number,duration,type\n1706700000,+123456789,120,incoming")
        (self.base_path / "Chat" / "whatsapp_export.pdf").write_text("%PDF-1.4 mock content")
        (self.base_path / "Images" / "evidence_01.jpg").write_text("FF D8 ... mock jpeg")

    def create_package(self, case_id):
        desktop_path = Path.home() / "Desktop"
        zip_filename = f"{case_id}_Evidence_Package.zip"
        zip_path = desktop_path / zip_filename

        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(self.base_path):
                    for file in files:
                        file_path = Path(root) / file
                        # Preserve relative structure: /Calls/..., /Images/...
                        arcname = file_path.relative_to(self.base_path)
                        zipf.write(file_path, arcname)
            
            return str(zip_path)
        except Exception as e:
            print(f"Packaging error: {e}")
            return None

packager = ForensicPackager()
