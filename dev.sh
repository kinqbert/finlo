#!/usr/bin/env bash

set -euo pipefail

readonly SESSION_NAME="finlo-dev"
readonly PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly API_COMMAND="$(command -v air >/dev/null 2>&1 && echo air || echo 'go run ./cmd/api')"
readonly WINDOW_COLUMNS="${FINLO_DEV_COLUMNS:-240}"
readonly WINDOW_ROWS="${FINLO_DEV_ROWS:-70}"

for command_name in tmux go npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
done

if [[ "${1:-}" == "--restart" ]] && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Stopping the existing Finlo development session..."
  tmux kill-session -t "$SESSION_NAME"
fi

open_dev_window() {
  if command -v ghostty >/dev/null 2>&1; then
    ghostty \
      --window-width="$WINDOW_COLUMNS" \
      --window-height="$WINDOW_ROWS" \
      -e tmux attach-session -t "$SESSION_NAME" >/dev/null 2>&1 &
  elif command -v konsole >/dev/null 2>&1; then
    konsole --geometry "${WINDOW_COLUMNS}x${WINDOW_ROWS}" \
      -e tmux attach-session -t "$SESSION_NAME" >/dev/null 2>&1 &
  elif command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --geometry="${WINDOW_COLUMNS}x${WINDOW_ROWS}" \
      -- tmux attach-session -t "$SESSION_NAME" >/dev/null 2>&1 &
  else
    echo "No supported terminal emulator was found; attaching here instead." >&2
    exec tmux attach-session -t "$SESSION_NAME"
  fi
}

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux set-hook -t "$SESSION_NAME" client-detached "kill-session -t $SESSION_NAME"
  echo "Finlo is already running. Opening it in a new terminal window..."
  open_dev_window
  exit 0
fi

tmux new-session \
  -d \
  -s "$SESSION_NAME" \
  -n dev \
  -c "$PROJECT_ROOT/apps/web" \
  "npm run dev"

tmux split-window \
  -h \
  -t "$SESSION_NAME:dev" \
  -c "$PROJECT_ROOT/server" \
  "$API_COMMAND"

tmux split-window \
  -v \
  -t "$SESSION_NAME:dev.0" \
  -c "$PROJECT_ROOT/apps/mobile" \
  "npm run start"

tmux set-hook -t "$SESSION_NAME" client-detached "kill-session -t $SESSION_NAME"
tmux select-pane -t "$SESSION_NAME:dev.0"

echo "Finlo started. Opening the development window..."
open_dev_window
