from src.parsers.sqlite_parser import SQLiteParser
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SMSParser(SQLiteParser):
    """
    Parses Android SMS and MMS messages.
    Target DB: mmssms.db
    """

    def get_messages(self) -> List[Dict[str, Any]]:
        """
        Extracts SMS messages.
        """
        # 'sms' is the standard table for text messages
        query = """
        SELECT 
            _id,
            address, 
            person, 
            date, 
            date_sent, 
            protocol, 
            read, 
            status, 
            type, 
            body, 
            service_center 
        FROM sms
        """
        
        # Type: 1=Inbox, 2=Sent
        type_map = {
            1: "Inbox",
            2: "Sent",
            3: "Draft",
            4: "Outbox",
            5: "Failed", 
            6: "Queued"
        }

        raw_msgs = self.query(query)
        processed_msgs = []

        for msg in raw_msgs:
            t = msg.get('type')
            if isinstance(t, int) and t in type_map:
                msg['type_label'] = type_map[t]
            processed_msgs.append(msg)
            
        return processed_msgs

    @staticmethod
    def parse_adb_output(output: str) -> List[Dict[str, Any]]:
        """
        Parses the text output from 'adb shell content query --uri content://sms/'
        Example Row: Row: 732 _id=33, thread_id=16, ...
        """
        processed_msgs = []
        lines = output.strip().split('\n')
        
        type_map = {
            1: "Inbox",
            2: "Sent",
            3: "Draft",
            4: "Outbox",
            5: "Failed", 
            6: "Queued"
        }

        import re
        
        for line in lines:
            line = line.strip()
            if not line.startswith("Row:"):
                continue
                
            # Remove "Row: <index> " prefix
            # The format is "Row: <index> key=value, key=value, ..."
            # We can just look for key=value pairs
            
            # Simple parsing strategy: split by ", " but be careful about commas in body
            # A more robust regex approach for key=value pairs:
            # ([\w_]+)=((?:[^,]|,(?=\s*[\w_]+=))*)
            # This regex looks for a key, an equals sign, and then a value that continues until a comma that is followed by another key=assignment
            
            # However, the body might contain anything.
            # Let's try a split/partition approach or just simple regex for known integer fields and fallback for strings.
            
            msg_data = {}
            
            # Extract common integer fields first to be safe
            int_fields = ['_id', 'thread_id', 'person', 'date', 'date_sent', 'protocol', 'read', 'status', 'type', 'locked', 'sub_id']
            
            for field in int_fields:
                match = re.search(rf"{field}=(-?\d+)", line)
                if match:
                    msg_data[field] = int(match.group(1))
            
            # Extract text fields: address, body, service_center
            # Address usually comes early
            match_addr = re.search(r"address=([^,]+)", line)
            if match_addr:
                msg_data['address'] = match_addr.group(1)
                
            match_body = re.search(r"body=(.*?), \w+=", line)
            if match_body:
                msg_data['body'] = match_body.group(1)
            else:
                # Body might be the last thing or parsing failed, try greedy match if it's near the end
                # Or look for body= and take everything until the next known key
                # Given the sample: ..., body=..., service_center=...
                # Let's try a more robust split on keys.
                pass
                
            # Alternative: simpler split if we assume ", " delimiter is mostly consistent
            # But body text can have ", ".
            
            # Let's implement the specific parser for the provided format
            # Row: 732 _id=33, thread_id=16, address=JD-UNIONB, ..., body=..., service_center=...
            
            parts = line.split(", ")
            current_msg = {}
            
            # This naive split fails if body has ", ".
            # Re-approach: Dictionary comprehension with regex finding all key=value pairs
            
            # Regex to match key=value. 
            # keys are generally \w+. Values can be anything.
            # We rely on the fact that the next key is preceded by ", "
            
            pairs = re.finditer(r" (\w+)=(.*?)(?=, \w+=|$)", line)
            for p in pairs:
                k, v = p.groups()
                # Clean up value if needed
                if v == "NULL":
                    v = None
                elif v.isdigit() or (v.startswith('-') and v[1:].isdigit()):
                    v = int(v)
                
                current_msg[k] = v
                
            if 'type' in current_msg and current_msg['type'] in type_map:
                current_msg['type_label'] = type_map[current_msg['type']]
                
            processed_msgs.append(current_msg)
            
        return processed_msgs
