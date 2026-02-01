import sqlite3
import logging
import os
import shutil
import json
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SQLiteParser:
    """
    Base class for parsing SQLite databases extracted from Android.
    """
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self.cursor = None

    def connect(self):
        """
        Connects to the SQLite database.
        Creates a temporary copy to avoid locking issues if needed.
        """
        if not os.path.exists(self.db_path):
            logger.error(f"Database file not found: {self.db_path}")
            return False
            
        try:
            # Determine if we should copy it to a temp file? 
            # For now, open read-only mode using URI
            # uri_path = f"file:{os.path.abspath(self.db_path)}?mode=ro"
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row # Access columns by name
            self.cursor = self.conn.cursor()
            return True
        except sqlite3.Error as e:
            logger.error(f"SQLite Connection Error: {e}")
            return False

    def query(self, query_str: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """
        Executes a safe query and returns a list of dictionaries.
        """
        if not self.conn:
            if not self.connect():
                return []
        
        try:
            self.cursor.execute(query_str, params)
            rows = self.cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Query Failed: {e} | Query: {query_str}")
            return []

    def close(self):
        if self.conn:
            self.conn.close()

    def get_tables(self) -> List[str]:
        """List all tables in the DB"""
        results = self.query("SELECT name FROM sqlite_master WHERE type='table';")
        return [r['name'] for r in results]

    def dump_table_to_json(self, table_name: str, output_file: str):
        """
        Dumps an entire table to a JSON file.
        """
        data = self.query(f"SELECT * FROM {table_name}")
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=4, default=str)
        logger.info(f"Dumped table {table_name} to {output_file}")
