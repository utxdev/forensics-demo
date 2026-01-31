from src.parsers.sqlite_parser import SQLiteParser
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ContactsParser(SQLiteParser):
    """
    Parses Android Contacts and Call Logs.
    Target DB: contacts2.db or calllog.db
    """

    def get_call_logs(self) -> List[Dict[str, Any]]:
        """
        Extracts call logs from the database.
        """
        # Common table name for call logs is 'calls'
        query = """
        SELECT 
            number, 
            date, 
            duration, 
            type, 
            name, 
            geocoded_location 
        FROM calls
        """
        
        # Call types map (standard Android)
        # 1: Incoming, 2: Outgoing, 3: Missed, 4: Voicemail, 5: Rejected, 6: Blocked
        type_map = {
            1: "Incoming",
            2: "Outgoing",
            3: "Missed",
            4: "Voicemail",
            5: "Rejected",
            6: "Blocked"
        }

        raw_logs = self.query(query)
        processed_logs = []
        
        for log in raw_logs:
            # Map the integer type to string
            t = log.get('type')
            if isinstance(t, int) and t in type_map:
                log['type_label'] = type_map[t]
            
            # Timestamp conversion could happen here (Ms to ISO)
            processed_logs.append(log)
            
        return processed_logs
