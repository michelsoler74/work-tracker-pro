# Script para mover archivos a la nueva estructura
Copy-Item -Path "firebase.js" -Destination "src\js\"
Copy-Item -Path "voice.js" -Destination "src\js\"
Copy-Item -Path "style.css" -Destination "src\css\"
Copy-Item -Path "index.html" -Destination "src\"

# Eliminar los archivos originales después de copiarlos
Remove-Item -Path "firebase.js"
Remove-Item -Path "voice.js"
Remove-Item -Path "style.css"
Remove-Item -Path "index.html" 