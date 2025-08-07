#!/bin/bash

# Clearpoint CSS Audit Script
# Finds legacy colors that need replacement

echo "🔍 Clearpoint CSS Audit - Finding Legacy Colors"
echo "=================================================="
echo ""

# Function to search and report
search_and_report() {
    local pattern="$1"
    local description="$2"
    local results
    
    results=$(grep -r "$pattern" src/components/ --include="*.tsx" --include="*.ts" --include="*.css" -n 2>/dev/null || true)
    
    if [ -n "$results" ]; then
        echo "⚠️  $description:"
        echo "$results" | head -10  # Limit to first 10 results
        if [ $(echo "$results" | wc -l) -gt 10 ]; then
            echo "   ... and $(( $(echo "$results" | wc -l) - 10 )) more"
        fi
        echo ""
    fi
}

# Yellow/Amber colors
search_and_report "yellow\|amber" "Yellow/Amber colors found"

# Purple colors  
search_and_report "purple" "Purple colors found"

# Orange colors
search_and_report "orange" "Orange colors found"

# Generic gray that might need Clearpoint equivalents
search_and_report "text-gray-[45]00\|bg-gray-[15]0\|border-gray-[23]00" "Generic gray colors that should use Clearpoint neutrals"

# Semantic tokens that might resolve incorrectly
search_and_report "border-input\|text-muted-foreground\|bg-muted" "Semantic tokens that might need hardening"

# Old amber references
search_and_report "border-amber-[234]00\|bg-amber-[234]00" "Old amber classes found"

echo "✅ Audit complete!"
echo ""
echo "🎯 Recommended actions:"
echo "  1. Run: ./.agent-os/scripts/replace-legacy-colors.sh [file]"
echo "  2. Review all reported instances manually"
echo "  3. Test components after changes"
echo "  4. Update global CSS if needed"