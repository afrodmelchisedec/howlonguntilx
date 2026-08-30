#!/bin/bash
# Removes the now-redundant ProgrammaticEntity model that was appended to
# prisma/schema.prisma earlier in this project, before we knew about the
# existing Event model. Safe to run from repo root; no-ops if already removed.
set -e
if grep -q "SEO_PROGRAMMATIC_ENTITY_MODEL" prisma/schema.prisma; then
  # Delete from the marker comment through the closing brace of the model block
  sed -i '/SEO_PROGRAMMATIC_ENTITY_MODEL/,/^}/d' prisma/schema.prisma
  echo "Removed ProgrammaticEntity model block from prisma/schema.prisma"
  echo "Run: npx prisma migrate dev --name remove_programmatic_entity"
else
  echo "Nothing to remove — ProgrammaticEntity block not found (already clean)."
fi
