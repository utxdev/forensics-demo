import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ReportGenerator:
    """
    Generates HTML forensic reports from extracted JSON artifacts.
    """

    def __init__(self, output_dir: str = "."):
        self.output_dir = output_dir

    def load_json(self, filename: str):
        path = os.path.join(self.output_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading {filename}: {e}")
                return []
        return []

    def generate_html_report(self, report_filename: str = "GANDIVA_REPORT.html"):
        """
        Aggregates calls, sms, location, and media info into an HTML file.
        """
        calls = self.load_json("call_logs.json")
        sms = self.load_json("sms_messages.json")
        locations = self.load_json("location_history.json")
        
        # Basic HTML Template
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gandiva Forensic Report</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f4f9; color: #333; margin: 0; padding: 20px; }}
                header {{ background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 8px 8px 0 0; }}
                h1 {{ margin: 0; }}
                .meta {{ font-size: 0.9em; opacity: 0.8; margin-top: 5px; }}
                .section {{ background: #fff; padding: 20px; margin-bottom: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }}
                h2 {{ border-bottom: 2px solid #3498db; padding-bottom: 10px; color: #2c3e50; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9em; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f8f9fa; color: #2c3e50; }}
                tr:hover {{ background-color: #f1f1f1; }}
                .badge {{ padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }}
                .badge-incoming {{ background: #daebf5; color: #2980b9; }}
                .badge-outgoing {{ background: #d5f5e3; color: #27ae60; }}
                .badge-missed {{ background: #fadbd8; color: #c0392b; }}
            </style>
        </head>
        <body>
            <header>
                <h1>🏹 Gandiva Extraction Report</h1>
                <div class="meta">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </header>

            <div class="section">
                <h2>Summary</h2>
                <p><strong>Call Logs Found:</strong> {len(calls)}</p>
                <p><strong>SMS Messages Found:</strong> {len(sms)}</p>
                <p><strong>Location Points Found:</strong> {len(locations)}</p>
            </div>
        """

        # Call Logs Section
        if calls:
             html_content += """
            <div class="section">
                <h2>📞 Call Logs</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Number</th>
                            <th>Name</th>
                            <th>Date (Raw)</th>
                            <th>Duration (s)</th>
                        </tr>
                    </thead>
                    <tbody>
            """
             for call in calls[:100]: # Limit to 100 for preview
                 type_cls = "badge-incoming"
                 if "Missed" in str(call.get('type_label', '')): type_cls = "badge-missed"
                 if "Outgoing" in str(call.get('type_label', '')): type_cls = "badge-outgoing"
                 
                 html_content += f"""
                        <tr>
                            <td><span class="badge {type_cls}">{call.get('type_label', call.get('type'))}</span></td>
                            <td>{call.get('number')}</td>
                            <td>{call.get('name') if call.get('name') else '-'}</td>
                            <td>{call.get('date')}</td>
                            <td>{call.get('duration')}</td>
                        </tr>
                 """
             html_content += "</tbody></table></div>"

        # SMS Section
        if sms:
             html_content += """
            <div class="section">
                <h2>💬 SMS Messages</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Direction</th>
                            <th>Address</th>
                            <th>Date (Raw)</th>
                            <th>Body</th>
                        </tr>
                    </thead>
                    <tbody>
            """
             for msg in sms[:100]:
                 html_content += f"""
                        <tr>
                            <td>{msg.get('type_label', msg.get('type'))}</td>
                            <td>{msg.get('address')}</td>
                            <td>{msg.get('date')}</td>
                            <td style="max-width: 400px; word-wrap: break-word;">{msg.get('body')}</td>
                        </tr>
                 """
             html_content += "</tbody></table></div>"

        # Location Section
        if locations:
             html_content += """
            <div class="section">
                <h2>📍 Location History (Recent)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Coordinates</th>
                            <th>Title / Address</th>
                        </tr>
                    </thead>
                    <tbody>
            """
             for loc in locations[:50]:
                 lat = loc.get('lat_decimal', loc.get('dest_lat'))
                 lng = loc.get('lng_decimal', loc.get('dest_lng'))
                 title = loc.get('dest_title', '')
                 addr = loc.get('dest_address', '')
                 full_label = f"<strong>{title}</strong><br>{addr}" if title else addr
                 
                 html_content += f"""
                        <tr>
                            <td>{loc.get('time')}</td>
                            <td>{lat}, {lng}</td>
                            <td>{full_label}</td>
                        </tr>
                 """
             html_content += "</tbody></table></div>"

        # Media Section
        media_dir = os.path.join(self.output_dir, "extracted_media")
        media_files = []
        if os.path.exists(media_dir):
            for root, dirs, files in os.walk(media_dir):
                for file in files:
                    # Relpath for display
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.output_dir)
                    size_kb = os.path.getsize(full_path) / 1024
                    media_files.append({"path": rel_path, "size": f"{size_kb:.1f} KB", "name": file})
        
        if media_files:
             html_content += f"""
            <div class="section">
                <h2>📸 Extracted Media ({len(media_files)})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Path</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
            """
             for m in media_files:
                 html_content += f"""
                        <tr>
                            <td>{m['name']}</td>
                            <td>{m['path']}</td>
                            <td>{m['size']}</td>
                        </tr>
                 """
             html_content += "</tbody></table></div>"

        html_content += """
            <div class="section">
                <p style="text-align: center; color: #7f8c8d;">End of Report</p>
            </div>
        </body>
        </html>
        """
        
        output_path = os.path.join(self.output_dir, report_filename)
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Report generated: {output_path}")
        return output_path
