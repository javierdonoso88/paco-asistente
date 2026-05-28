#!/bin/bash
# Elimina la restricción de seguridad de macOS para Mayormono
APP="/Applications/Mayormono.app"
if [ -d "$APP" ]; then
  xattr -cr "$APP"
  echo "✓ Restricción eliminada. Puedes abrir Mayormono normalmente."
  open "$APP"
else
  echo "⚠️  No se encontró Mayormono en /Applications"
  echo "   Arrastra primero Mayormono a la carpeta Aplicaciones y vuelve a ejecutar este script."
fi
