#!/bin/bash

# Clearpoint Legacy Color Replacement Script
# Usage: ./replace-legacy-colors.sh [file-path]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file-path>"
    echo "Example: $0 src/components/new-component.tsx"
    exit 1
fi

FILE_PATH="$1"

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found."
    exit 1
fi

echo "🎨 Replacing legacy colors in: $FILE_PATH"

# Create backup
cp "$FILE_PATH" "${FILE_PATH}.backup"

# Purple → Clearpoint Cyan
sed -i 's/bg-purple-100/bg-clearpoint-cyan\/10/g' "$FILE_PATH"
sed -i 's/bg-purple-200/bg-clearpoint-cyan\/20/g' "$FILE_PATH"
sed -i 's/text-purple-800/text-clearpoint-cyan/g' "$FILE_PATH"
sed -i 's/text-purple-700/text-clearpoint-cyan/g' "$FILE_PATH"
sed -i 's/border-purple-100/border-clearpoint-cyan\/30/g' "$FILE_PATH"
sed -i 's/border-purple-200/border-clearpoint-cyan\/30/g' "$FILE_PATH"

# Yellow/Amber → Clearpoint Colors
sed -i 's/bg-yellow-50/bg-clearpoint-alabaster/g' "$FILE_PATH"
sed -i 's/bg-yellow-100/bg-clearpoint-platinum/g' "$FILE_PATH"
sed -i 's/bg-yellow-200/bg-clearpoint-silver/g' "$FILE_PATH"
sed -i 's/border-yellow-200/border-clearpoint-silver/g' "$FILE_PATH"
sed -i 's/border-yellow-300/border-clearpoint-silver/g' "$FILE_PATH"
sed -i 's/text-yellow-600/text-clearpoint-navy/g' "$FILE_PATH"
sed -i 's/text-yellow-700/text-clearpoint-navy/g' "$FILE_PATH"

# Orange → Clearpoint Coral
sed -i 's/bg-orange-100/bg-clearpoint-coral\/10/g' "$FILE_PATH"
sed -i 's/text-orange-600/text-clearpoint-coral/g' "$FILE_PATH"
sed -i 's/text-orange-700/text-clearpoint-coral/g' "$FILE_PATH"

# Gray → Clearpoint Neutrals
sed -i 's/text-gray-400/text-clearpoint-slateGray/g' "$FILE_PATH"
sed -i 's/text-gray-500/text-clearpoint-slateGray/g' "$FILE_PATH"
sed -i 's/text-gray-600/text-clearpoint-charcoal/g' "$FILE_PATH"
sed -i 's/bg-gray-50/bg-clearpoint-alabaster/g' "$FILE_PATH"
sed -i 's/bg-gray-100/bg-clearpoint-platinum/g' "$FILE_PATH"
sed -i 's/border-gray-200/border-clearpoint-platinum/g' "$FILE_PATH"
sed -i 's/border-gray-300/border-clearpoint-silver/g' "$FILE_PATH"

# Common semantic tokens → Clearpoint equivalent
sed -i 's/border-input/border-clearpoint-silver/g' "$FILE_PATH"
sed -i 's/text-muted-foreground/text-clearpoint-slateGray/g' "$FILE_PATH"
sed -i 's/bg-muted/bg-clearpoint-platinum/g' "$FILE_PATH"

echo "✅ Color replacement complete!"
echo "📝 Original backed up as: ${FILE_PATH}.backup"
echo ""
echo "🔍 Manual review needed for:"
echo "  • Hover states and interactions"
echo "  • Focus ring colors"
echo "  • Custom CSS classes"
echo "  • Component-specific styling"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the changes visually"
echo "  2. Test all interactive states"
echo "  3. Check integration with existing pages"
echo "  4. Remove backup file when satisfied"