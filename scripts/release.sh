#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    print_error "Not in a git repository!"
    exit 1
fi

# Get current version from package.json
PACKAGE_VERSION=$(node -p "require('./package.json').version")
TAG_NAME="v${PACKAGE_VERSION}"

print_status "Current package.json version: ${PACKAGE_VERSION}"
print_status "Will create tag: ${TAG_NAME}"

# Check if tag already exists
if git tag -l | grep -q "^${TAG_NAME}$"; then
    print_error "Tag ${TAG_NAME} already exists!"
    echo "Either:"
    echo "  1. Update version in package.json"
    echo "  2. Delete existing tag: git tag -d ${TAG_NAME} && git push origin --delete ${TAG_NAME}"
    exit 1
fi

# Ensure we're on master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "Currently on branch: ${CURRENT_BRANCH}"
    read -p "Switch to master branch? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Switching to master branch..."
        git checkout master
    else
        print_error "Must be on master branch to create release"
        exit 1
    fi
fi

# Pull latest changes
print_status "Pulling latest changes from origin/master..."
git pull origin master

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    print_error "Working directory is not clean. Please commit or stash changes."
    git status --porcelain
    exit 1
fi

# Show recent commits
print_status "Recent commits:"
git log --oneline -5

echo
read -p "Create release ${TAG_NAME}? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Release creation cancelled"
    exit 0
fi

# Create and push tag
print_status "Creating tag ${TAG_NAME}..."
git tag -a "${TAG_NAME}" -m "Release ${TAG_NAME}"

print_status "Pushing tag to origin..."
git push origin "${TAG_NAME}"

print_success "Tag ${TAG_NAME} created and pushed!"
print_status "GitHub Actions will now build and create the release automatically."

# Open GitHub releases page
if command -v gh &> /dev/null; then
    print_status "Opening GitHub releases page..."
    gh repo view --web --branch releases
else
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github\.com:/https:\/\/github.com\//')
    print_status "GitHub releases page: ${REPO_URL}/releases"
fi

print_success "Release process initiated successfully!"
echo
echo "Next steps:"
echo "  1. Wait for GitHub Actions to complete the build"
echo "  2. Check the release page for generated artifacts"
echo "  3. Edit release notes if needed"