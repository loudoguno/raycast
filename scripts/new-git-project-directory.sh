#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title New Git Project
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖
# @raycast.argument1 { "type": "text", "placeholder": "Placeholder" }
# @raycast.packageName Vibe Coding

# Documentation:
# @raycast.description create a new directory in ~/projects and initialize as a git directory
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog

echo "H ello World! Argument1 value: "$1""
# Check if project name was provided
if [ -z "$1" ]; then
  echo "Please provide a project name."
  echo "Usage: ./new-project.sh project_name"
  exit 1
fi

# Set project name and directory
PROJECT_NAME=$1
PROJECT_DIR=~/projects/$PROJECT_NAME

# Create project directory
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Initialize git repository
git init

# Create basic project structure
# mkdir -p src
# mkdir -p docs
touch README.md

# Add initial content to README
echo "# $PROJECT_NAME" > README.md
echo "" >> README.md
echo "Project created on $(date +"%Y-%m-%d")" >> README.md

# Create .gitignore file
cat > .gitignore << 'EOL'
# IDE and editor files
.idea/
.vscode/
*.swp
*.swo
.DS_Store
EOL

# Initial git commit
git add .
git commit -m "Initial commit"

# Open project in Cursor
cursor $PROJECT_DIR

echo "Project $PROJECT_NAME initialized at $PROJECT_DIR and opened in Cursor!"