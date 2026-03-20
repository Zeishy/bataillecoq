#!/bin/bash

# Script pour synchroniser le ladder avec les tournois existants
# Usage: npm run sync-ladder (depuis le dossier backend)

echo "🔄 Synchronisation du Ladder avec les tournois existants..."
echo ""

# Vérifier si le serveur est en cours d'exécution
echo "Tentative de connexion au serveur..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "✅ Serveur accessible"
  echo ""
  
  # Obtenir un token admin (à adapter selon votre auth)
  echo "📝 Pour synchroniser, vous avez besoin d'un token admin."
  echo "Exécutez la commande suivante dans votre terminal:"
  echo ""
  echo "curl -X POST http://localhost:5000/api/ladder/sync \\"
  echo "  -H 'Authorization: Bearer {YOUR_ADMIN_TOKEN}' \\"
  echo "  -H 'Content-Type: application/json'"
  echo ""
  echo "Remplacez {YOUR_ADMIN_TOKEN} par votre vrai token d'admin."
  echo ""
else
  echo "❌ Serveur non accessible sur http://localhost:5000"
  echo ""
  echo "Assurez-vous que le serveur backend est en cours d'exécution:"
  echo "  1. cd backend"
  echo "  2. npm run dev"
  echo ""
fi
