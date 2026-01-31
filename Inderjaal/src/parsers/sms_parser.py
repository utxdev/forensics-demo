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
