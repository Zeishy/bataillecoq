/**
 * Test du système de Ladder par Joueur
 * Commandes à exécuter dans la console du backend
 */

// 1. Test de lecture du ladder (vide au départ)
console.log('=== Test 1: Vérifier le ladder vide ===');
// GET http://localhost:5000/api/ladder

// 2. Créer un tournoi de test
console.log('=== Test 2: Créer un tournoi ===');
// POST http://localhost:5000/api/tournaments
// Body: {
//   "name": "Tournament Test",
//   "game": "valorant",
//   "description": "Test tournament",
//   "prizePool": "$100",
//   "startDate": "2026-03-20T10:00:00Z",
//   "endDate": "2026-03-21T18:00:00Z",
//   "maxTeams": 2,
//   "format": "single-elimination"
// }

// 3. Créer des équipes et ajouter des joueurs
console.log('=== Test 3: Créer équipes et ajouter joueurs ===');
// POST http://localhost:5000/api/teams
// Body pour équipe 1:
// {
//   "name": "Test Team 1",
//   "game": "valorant",
//   "description": "Test team"
// }

// 4. Ajouter des joueurs à l'équipe
console.log('=== Test 4: Ajouter des joueurs ===');
// POST http://localhost:5000/api/teams/{teamId}/add-player
// Body: {
//   "userId": "{userId de joueur 1}",
//   "role": "Player"
// }

// 5. Enregistrer les équipes au tournoi
console.log('=== Test 5: Enregistrer équipes au tournoi ===');
// POST http://localhost:5000/api/tournaments/{tournamentId}/register
// Body: {
//   "teamId": "{teamId}"
// }

// 6. Démarrer le tournoi
console.log('=== Test 6: Démarrer le tournoi ===');
// PATCH http://localhost:5000/api/tournaments/{tournamentId}/start

// 7. Marquer l'équipe 1 comme gagnante et terminer le tournoi
console.log('=== Test 7: Terminer le tournoi ===');
// D'abord, mettre à jour le winner du tournoi avant de terminer
// PATCH http://localhost:5000/api/tournaments/{tournamentId}
// Body: {
//   "winner": "{teamId de l'équipe gagnante}"
// }
// Ensuite:
// PATCH http://localhost:5000/api/tournaments/{tournamentId}/end

// 8. Vérifier le ladder mis à jour
console.log('=== Test 8: Vérifier le ladder ===');
// GET http://localhost:5000/api/ladder
// Tous les joueurs de l'équipe gagnante devraient avoir 10 points

// 9. Récupérer les infos d'un joueur spécifique
console.log('=== Test 9: Détails d\'un joueur ===');
// GET http://localhost:5000/api/ladder/{userId}

// 10. Rechercher dans le ladder
console.log('=== Test 10: Rechercher dans le ladder ===');
// GET http://localhost:5000/api/ladder/search?page=1&limit=10&search=username

// Vérification du frontend
console.log('=== Vérification Frontend ===');
console.log('1. Aller à http://localhost:5173/rankings');
console.log('2. Cliquer sur l\'onglet "Joueurs"');
console.log('3. Vérifier que le classement s\'affiche avec les joueurs du tournoi remporté');
console.log('4. Les points devraient être 10 pour chaque joueur de l\'équipe gagnante');
