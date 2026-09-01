#!/bin/sh
export AI_MEMORY_HOOK_URL="${AI_MEMORY_HOOK_URL:-http://127.0.0.1:49375}"
exec /usr/share/ai-memory/hooks/cursor/stop.sh
