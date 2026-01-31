Inderjaal folder as requested:

Inderjaal/backend/: Contains the Python server (src/, main.py).
Inderjaal/frontend/: Contains the React Web App.
Inderjaal/mobile/: Contains the Android App source code.
This structure is much cleaner and separates concerns perfectly.

Updated Run Instructions:
------------------------

1. Backend
bash
cd Inderjaal/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/api/server.py




------------------------
3. Frontend
bash
cd Inderjaal/frontend
npm install
npm run dev
