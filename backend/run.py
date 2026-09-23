"""
nena-man · backend/run.py
Local development entry point for the Flask REST API.
Run:  python run.py
"""

import os
from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # host='0.0.0.0' allows physical mobile devices on the same Wi-Fi network and Android emulators to connect
    print(f"🚀 Nena Man API running at http://localhost:{port}/api/v1")
    print(f"💓 Health check: http://localhost:{port}/api/v1/health")
    app.run(host="0.0.0.0", port=port, debug=True)
