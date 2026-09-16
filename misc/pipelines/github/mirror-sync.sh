#!/bin/bash
set -e

# Usage: ./mirror-sync.sh [check|push]
MODE=$1
REMOTE_URL=$GITHUB_REPO_URL
BRANCH=$BITBUCKET_BRANCH

if [ "$MODE" == "check" ]; then
    echo "Checking mirror state for $BRANCH..."
    git remote add target "$REMOTE_URL" || git remote set-url target "$REMOTE_URL"
    git fetch target "$BRANCH" --depth 1 || true
    
    LOCAL_TREE=$(git rev-parse HEAD^{tree})
    REMOTE_TREE=$(git rev-parse FETCH_HEAD^{tree} 2>/dev/null || echo "none")
    
    COMMIT_MSG=$(git log -1 --pretty=%B)
    if [[ "$COMMIT_MSG" == *"[skip-ci]"* ]] || [[ "$COMMIT_MSG" == *"[skip ci]"* ]] || [[ "$COMMIT_MSG" == *"[ci skip]"* ]]; then
        echo "SKIP_SYNC=true" > sync.env
        echo "Skip tag detected in commit message. Skipping sync."
        exit 0
    fi

    if [ "$LOCAL_TREE" = "$REMOTE_TREE" ]; then
        echo "SKIP_SYNC=true" > sync.env
        echo "Trees match. Skip sync step."
    else
        echo "SKIP_SYNC=false" > sync.env
        echo "Trees diverge. Proceeding with sync."
    fi

elif [ "$MODE" == "push" ]; then
    if [ -f sync.env ]; then
        source sync.env
    fi

    if [ "$SKIP_SYNC" = "true" ]; then
        echo "Skipping sync."
        exit 0
    fi

    echo "Syncing $BRANCH to GitHub..."
    git config --global user.name "Bitbucket Pipelines"
    git config --global user.email "pipelines@bitbucket.org"
    
    git remote add target "$REMOTE_URL" || git remote set-url target "$REMOTE_URL"
    git checkout "$BRANCH"
    
    git fetch target "$BRANCH" || true
    git pull --rebase target "$BRANCH" || {
        echo "Rebase failed, attempting to abort..."
        git rebase --abort 2>/dev/null || true
    }
    
    git push target "$BRANCH"
else
    echo "Unknown mode: $MODE. Use 'check' or 'push'."
    exit 1
fi
