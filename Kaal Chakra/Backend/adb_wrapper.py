import subprocess
import re
import shlex
import datetime

class ADBWrapper:
    @staticmethod
    def run_command(command: str):
        """Runs an ADB shell command and returns the output."""
        full_command = f"adb shell {command}"
        try:
            result = subprocess.run(
                shlex.split(full_command),
                capture_output=True,
                text=True,
                timeout=30 # Safety timeout
            )
            if result.returncode != 0:
                print(f"Error running command: {full_command}")
                print(result.stderr)
                return ""
            return result.stdout
        except Exception as e:
            print(f"Exception execution command: {e}")
            return ""

    @staticmethod
    def filter_and_paginate(data: list, limit: int = 200, offset: int = 0):
        """Helper to filter and paginate results."""
        # Sort by timestamp desc
        data.sort(key=lambda x: x['timestamp'], reverse=True)
        return data[offset : offset + limit]

    @staticmethod
    def parse_logcat(log_type: str = "all", limit: int = 200, offset: int = 0):
        """
        Parses logcat output.
        Usage: 
        - log_type='L' -> logcat -L
        - log_type='d' -> logcat -d
        - log_type='all' -> logcat -b all -d
        """
        cmd_map = {
            "L": "logcat -L -d", # Last logcat
            "d": "logcat -d",
            "all": "logcat -b all -d"
        }
        
        cmd = cmd_map.get(log_type, "logcat -d")
        raw_output = ADBWrapper.run_command(cmd)
        
        logs = []
        # Pattern for standard logcat: 
        # 02-01 01:23:45.678  1234  5678 D Tag: Message
        # Regex needs to be robust. 
        # But user just asked for "logs file" so maybe just raw lines or minimal parsing?
        # User said: "event logged at -> line of that log file"
        # Let's try to parse timestamp, tag, message
        
        lines = raw_output.split('\n')
        
        # Simple parser for standard Android Logcat format
        # Format: date time pid tid level tag: message
        # Example: 10-18 13:42:07.123 1894 1894 D SurfaceFlinger: ...
        
        # Since we don't know the exact year, we usually assume current or logic around it. 
        # But for 'Kaal Chakra', getting the exact timestamp is nice.
        # Logcat usually doesn't have Year. We might default to current year.
        
        current_year = datetime.datetime.now().year
        
        for i, line in enumerate(lines):
            if not line.strip(): 
                continue
            
            # Very naive regex
            # (MM-DD) (HH:MM:SS.mmm) ...
            match = re.match(r"(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([A-Z])\s+([^:]+):\s+(.*)", line)
            if match:
                date_str, time_str, pid, tid, level, tag, msg = match.groups()
                
                try:
                    dt_str = f"{current_year}-{date_str} {time_str}"
                    dt = datetime.datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S.%f")
                    timestamp = int(dt.timestamp() * 1000)
                    
                    logs.append({
                        "id": f"log-{timestamp}-{pid}-{tid}-{i}",
                        "timestamp": timestamp,
                        "eventType": "log",
                        "contentPreview": f"[{level}] {tag}: {msg[:50]}...",
                        "sourceArtifact": "logcat",
                        "metadata": {
                           "full_line": line,
                           "pid": pid,
                           "tid": tid,
                           "level": level,
                           "tag": tag,
                           "message": msg
                        }
                    })
                except ValueError:
                     # Fallback for parsing errors
                     continue
            
        return ADBWrapper.filter_and_paginate(logs, limit, offset)

    @staticmethod
    def parse_call_log(limit: int = 200, offset: int = 0):
        """
        Parses: content query --uri content://call_log/calls
        Format: Row: 123 date=..., number=..., ...
        """
        raw_output = ADBWrapper.run_command("content query --uri content://call_log/calls")
        calls = []
        
        for i, line in enumerate(raw_output.split('\n')):
            if "Row:" in line:
                # Naive parsing: split by ", " but keep in mind some fields might have commas? 
                # The user example shows comma separated key=value.
                # "Row: 1999 date=1760704767988, phone_account_hidden=0, ..."
                
                # Extract KV pairs
                # Since values can contain spaces or commas, this is tricky.
                # However, looking at the user sample: "geocoded_location=India, presentation=1"
                # It seems comma is the delimiter. 
                # Let's try splitting by ", " first.
                
                data = {}
                # Remove "Row: <id> " prefix
                clean_line = re.sub(r"^Row: \d+ ", "", line)
                
                # Split by ", " might be dangerous if text has it. 
                # The example: "body=Dear Customer, your recent..." 
                # Shows that comma CAN be in value. 
                # But usually 'content query' output separates fields strictly.
                # Wait, the example for SMS shows: "body=..., service_center=..."
                # The delimiter is likely ", " followed by a key? 
                # Actually, standard `content query` output is notoriously hard to parse perfectly if values contain delimiters.
                # We will use a regex designed to capture key=value.
                
                # Regex approach: find ` key=` and split? No.
                # Let's try to match key=value pairs.
                
                # Given the complexity/ambiguity of the output format and the hackathon nature,
                # we will try a best-effort split.
                
                # Split by ", " looks mostly correct except for body text.
                # Let's assume standard format `key=value, `
                
                # Better approach: 
                # Since we want to display it in "Advanced View", we can just dump the whole raw line into metadata
                # and extract ONLY specific fields we need for the timeline (date, number, type).
                
                # Extract date
                date_match = re.search(r"date=(\d+)", line)
                number_match = re.search(r"number=([^,]+)", line)
                type_match = re.search(r" type=(\d+)", line)
                name_match = re.search(r" name=([^,]+)", line)

                if date_match:
                    timestamp = int(date_match.group(1))
                    number = number_match.group(1) if number_match else "Unknown"
                    call_type = type_match.group(1) if type_match else "0"
                    name = name_match.group(1) if name_match else "Unknown"
                    
                    # Call Types: 1=Incoming, 2=Outgoing, 3=Missed (Android standard)
                    type_map = {'1': 'Incoming', '2': 'Outgoing', '3': 'Missed'}
                    c_type_str = type_map.get(call_type, 'Unknown')

                    calls.append({
                        "id": f"call-{timestamp}-{i}",
                        "timestamp": timestamp,
                        "eventType": "call",
                        "contentPreview": f"{c_type_str} call {number} ({name})",
                        "sourceArtifact": "call_log",
                        "metadata": {
                            "raw_record": line,
                            "number": number,
                            "type": c_type_str,
                            "name": name,
                            "duration": re.search(r"duration=(\d+)", line).group(1) if re.search(r"duration=(\d+)", line) else "0"
                        }
                    })

        return ADBWrapper.filter_and_paginate(calls, limit, offset)

    @staticmethod
    def parse_sms_log(limit: int = 200, offset: int = 0):
        """
        Parses: content query --uri content://sms/
        """
        raw_output = ADBWrapper.run_command("content query --uri content://sms/")
        sms_list = []
        
        for i, line in enumerate(raw_output.split('\n')):
            if "Row:" in line:
                # Same strategy: Extract essential timeline data, dump rest to metadata.
                
                date_match = re.search(r"date=(\d+)", line)
                address_match = re.search(r"address=([^,]+)", line)
                body_match = re.search(r"body=(.*?), service_center", line) # Try to capture body until next field
                # Fallback body match if service_center is missing or different order
                if not body_match:
                     body_match = re.search(r"body=(.*)", line)
                
                if date_match:
                    timestamp = int(date_match.group(1))
                    address = address_match.group(1) if address_match else "Unknown"
                    body = body_match.group(1) if body_match else ""
                    
                    # Clean up body if it captured too much (greedy match issue)
                    # But since we anchor to ", service_center", it should be reasonably safe for checking user example.
                    
                    sms_list.append({
                        "id": f"sms-{timestamp}-{i}",
                        "timestamp": timestamp,
                        "eventType": "sms",
                        "contentPreview": f"SMS from {address}: {body[:30]}...",
                        "sourceArtifact": "sms_db",
                        "metadata": {
                            "raw_record": line,
                            "address": address,
                            "body": body
                        }
                    })
        return ADBWrapper.filter_and_paginate(sms_list, limit, offset)

    @staticmethod
    def parse_file_system(limit: int = 500, offset: int = 0):
        """
        Parses: adb shell ls -aulR /sdcard
        Format: -rw-rw----  1 root sdcard_rw 1234 2024-01-01 12:00 filename
        Wait, `ls -l` on Android (Toybox) formatting can vary. 
        User output not fully provided, but mentioned `ls -aulR`.
        -a: all, -u: access time?, -l: long, -R: recursive.
        Standard ls -l output:
        mode links owner group size date time name
        """
        raw_output = ADBWrapper.run_command("ls -aulR /sdcard")
        files = []
        current_dir = "/sdcard"
        
        current_year = datetime.datetime.now().year

        for line in raw_output.split('\n'):
            line = line.strip()
            if not line: continue
            
            if line.endswith(':'):
                current_dir = line[:-1]
                continue
                
            parts = line.split()
            if len(parts) >= 8:
                # Heuristic check for ls -l line
                # parts[0] is permissions (drwx...)
                if parts[0].startswith('-') or parts[0].startswith('d'):
                    try:
                        # Date/Time parsing is tricky without year usually. 
                        # Android ls often gives: YYYY-MM-DD HH:MM
                        # verify if parts contain date. 
                        # Example: -rw-rw---- 1 root sdcard_rw 653995 2024-10-18 19:22 screenshot.png
                        # Index: 0=perm, 1=link, 2=own, 3=grp, 4=size, 5=date, 6=time, 7+=name
                        
                        date_str = parts[5]
                        time_str = parts[6]
                        name = " ".join(parts[7:])
                        
                        full_dt_str = f"{date_str} {time_str}"
                        # Try parsing YYYY-MM-DD HH:MM
                        try:
                            dt = datetime.datetime.strptime(full_dt_str, "%Y-%m-%d %H:%M")
                            timestamp = int(dt.timestamp() * 1000)
                            
                            full_path = f"{current_dir}/{name}"
                            
                            files.append({
                                "id": f"file-{timestamp}-{hash(full_path)}",
                                "timestamp": timestamp,
                                "eventType": "file_event", # Changed to generic file_event as requested in types
                                "contentPreview": f"File Modified: {name}",
                                "sourceArtifact": full_path,
                                "metadata": {
                                    "path": full_path,
                                    "size": parts[4],
                                    "permissions": parts[0],
                                    "raw_line": line
                                }
                            })
                            
                        except ValueError:
                            pass # Not a date line or different format
                    except Exception:
                        pass
                        
        return ADBWrapper.filter_and_paginate(files, limit, offset)
