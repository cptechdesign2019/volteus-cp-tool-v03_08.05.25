#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# rename-screenshots.sh  —  Interactive renamer for reference screenshots
# -----------------------------------------------------------------------------
# • Opens each PNG file inside design/reference-screens/<set>/
# • Lets you type a clearer name (without .png) or press <Enter> to skip
# • Saves the renamed file in-place
# -----------------------------------------------------------------------------
# Usage (from project root):
#   bash scripts/rename-screenshots.sh design/reference-screens/2025-07-22_v2-firebase
# -----------------------------------------------------------------------------
set -euo pipefail

DIR="${1:-design/reference-screens/2025-07-22_v2-firebase}"
if [[ ! -d "$DIR" ]]; then
  echo "❌ Directory not found: $DIR"
  exit 1
fi

echo "🔎 Renaming screenshots in $DIR"
shopt -s nullglob
FILES=("$DIR"/*.png)
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "⚠️  No PNG files found."; exit 0; fi

for f in "${FILES[@]}"; do
  echo "\n────────────────────────────────────────"
  echo "📷 Opening $f ..."
  (xdg-open "$f" >/dev/null 2>&1 &)
  read -p "New name (without .png, blank = skip): " NEW
  pkill -f "$(basename "$f")" 2>/dev/null || true
  if [[ -n "$NEW" ]]; then
    mv "$f" "$DIR/${NEW}.png"
    echo "✅ Renamed to ${NEW}.png"
  else
    echo "↩️  Kept original filename"
  fi
done

echo "\n🎉 All done!"