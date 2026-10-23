#!/bin/sh
set -eu

SOURCE_ROOT=/opt/erg-dist
TARGET_ROOT=/usr/share/nginx/html

promote_file() {
    file_name=$1
    source_path="$SOURCE_ROOT/$file_name"
    target_path="$TARGET_ROOT/$file_name"
    temporary_path="$TARGET_ROOT/.$file_name.$$.tmp"

    [ -f "$source_path" ] || return 0
    cp "$source_path" "$temporary_path"
    mv -f "$temporary_path" "$target_path"
}

mkdir -p "$TARGET_ROOT/assets"
cp -R "$SOURCE_ROOT/assets/." "$TARGET_ROOT/assets/"

# Copy fixed-name metadata and hashed Workbox helpers before either release
# pointer changes. Old hashed assets are intentionally retained for open tabs.
for source_path in "$SOURCE_ROOT"/*; do
    file_name=${source_path##*/}
    case "$file_name" in
        assets|index.html|sw.js) continue ;;
    esac

    if [ -d "$source_path" ]; then
        mkdir -p "$TARGET_ROOT/$file_name"
        cp -R "$source_path/." "$TARGET_ROOT/$file_name/"
    else
        promote_file "$file_name"
    fi
done

# The HTML pointer becomes visible only after every referenced asset exists.
# sw.js is promoted last so its precache resolves the matching new index.
promote_file "index.html"
promote_file "sw.js"
