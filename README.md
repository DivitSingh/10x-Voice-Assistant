# Instructions for Installing Dependencies and Running the App
```bash
# Go to the script's directory (the project root)
cd "$(dirname "$0")"
cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install livekit-agents
pip install python-dotenv

cd ../frontend

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

# Install frontend dependencies
pnpm install

# Start frontend (web app)
pnpm dev

# In a new terminal, start backend (agent)
cd ../backend
source .venv/bin/activate
python agent.py start
```