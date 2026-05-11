# Documentation du Panneau d'Administration LEO&Go

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Connexion](#connexion)
3. [Tableau de bord](#tableau-de-bord)
4. [Gestion des véhicules](#gestion-des-véhicules)
5. [Gestion des tarifs](#gestion-des-tarifs)
6. [Paramètres](#paramètres)
7. [Demandes de contact](#demandes-de-contact)
8. [Cas particuliers](#cas-particuliers)

---

## Vue d'ensemble

Le panneau d'administration LEO&Go permet de gérer l'ensemble du simulateur de tarification de location de véhicules. Il comprend :

- **Gestion des véhicules** : Ajout, modification, suppression des véhicules disponibles
- **Gestion des tarifs** : Configuration des grilles tarifaires avec import/export CSV
- **Paramètres globaux** : Frais, options, couleurs des badges et liens de redirection
- **Demandes de contact** : Suivi des demandes clients avec workflow de statut

### Navigation

La barre latérale donne accès aux différentes sections :

| Icône | Section | Description |
|-------|---------|-------------|
| 🏠 | Tableau de bord | Vue d'ensemble et statistiques |
| 🚗 | Véhicules | Gestion du parc automobile |
| 💰 | Tarification | Grilles de prix |
| ⚙️ | Paramètres | Configuration globale |
| 📧 | Demandes | Demandes de contact clients |

**Fonctionnalités de la barre latérale :**
- Réductible sur grands écrans (cliquer sur l'icône ✕ pour réduire, ☰ pour agrandir)
- Menu hamburger sur mobile
- Affichage de l'email utilisateur connecté
- Bouton de déconnexion

---

## Connexion

### Accès

URL : `/admin/login`

### Champs requis

| Champ | Type | Description |
|-------|------|-------------|
| Email | Email | Adresse email de l'administrateur |
| Mot de passe | Texte | Mot de passe du compte |

### Comportement

- Redirection automatique vers `/admin` après connexion réussie
- Message d'erreur "Email ou mot de passe incorrect" en cas d'échec
- Session persistante jusqu'à déconnexion manuelle

---

## Tableau de bord

### Statistiques affichées

Quatre cartes cliquables donnant accès rapide aux sections :

| Statistique | Description | Lien vers |
|-------------|-------------|-----------|
| Véhicules actifs | Nombre de véhicules visibles pour les clients | /admin/vehicles |
| Demandes en attente | Demandes avec statut "pending" | /admin/contacts |
| Total demandes | Toutes les demandes de contact | /admin/contacts |
| Grilles tarifaires | Nombre de grilles configurées | /admin/pricing |

### Dernières demandes

Tableau des 5 dernières demandes de contact avec :
- Email du demandeur
- Véhicule sélectionné
- Prix estimé
- Date de création
- Statut (badge coloré)

---

## Gestion des véhicules

### Liste des véhicules

Tableau affichant tous les véhicules avec :

| Colonne | Description |
|---------|-------------|
| Ordre | Position d'affichage dans le simulateur |
| Image | Aperçu du véhicule |
| Modèle | Nom du véhicule |
| Catégorie | Badge de taille (S, M, L, XL) |
| Grille | Grille tarifaire associée |
| Statut | Actif ou Inactif |
| Actions | Modifier / Supprimer |

### Ajouter ou modifier un véhicule

#### Champs du formulaire

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Clé unique | Texte | Oui | Identifiant système (ex: toyota_aygo_x) |
| Nom du modèle | Texte | Oui | Nom affiché (ex: Toyota Aygo X) |
| Catégorie | Sélection | Oui | S, M, L ou XL |
| Grille tarifaire | Sélection | Oui* | Grille de prix associée |
| Ordre d'affichage | Nombre | Oui | Position dans la liste (min: 1) |
| Véhicule actif | Case | Oui | Visibilité pour les clients |

*Obligatoire si le véhicule est actif

#### Upload d'image

- **Formats acceptés** : PNG, JPEG, WebP, SVG
- **Taille maximale** : 5 Mo
- **Stockage** : Supabase Storage

**Procédure :**
1. Cliquer sur la zone d'upload ou glisser-déposer une image
2. L'aperçu s'affiche dans le cadre
3. Cliquer sur "Enregistrer" pour valider

### Supprimer un véhicule

1. Cliquer sur l'icône poubelle 🗑️
2. Confirmer dans la fenêtre modale
3. Le véhicule est supprimé définitivement

### Véhicules orphelins

Un véhicule est "orphelin" s'il n'a pas de grille tarifaire assignée.

**Comportement :**
- Ligne surlignée en jaune dans le tableau
- Affichage "⚠ Non assignée" dans la colonne Grille
- **Impossible d'activer** un véhicule orphelin
- Message d'erreur : "Impossible d'activer un véhicule sans grille tarifaire assignée"

**Pour réactiver un véhicule orphelin :**
1. Cliquer sur Modifier
2. Sélectionner une grille tarifaire
3. Cocher "Véhicule actif"
4. Enregistrer

---

## Gestion des tarifs

### Structure

L'écran est divisé en deux zones :
- **Gauche** : Liste des grilles tarifaires
- **Droite** : Tableau des prix de la grille sélectionnée

### Grilles tarifaires

#### Créer une grille

1. Cliquer sur "Nouvelle grille"
2. Renseigner le nom (ex: "Grid S - Toyota Aygo X")
3. Ajouter une description optionnelle
4. Cliquer sur "Créer"

#### Modifier une grille

1. Survoler la grille dans la liste
2. Cliquer sur l'icône crayon ✏️
3. Modifier les informations
4. Cliquer sur "Mettre à jour"

#### Supprimer une grille

⚠️ **Attention** : La suppression d'une grille a des conséquences importantes.

**Si des véhicules utilisent cette grille :**
- Une fenêtre d'avertissement liste les véhicules concernés
- Ces véhicules seront **automatiquement désactivés**
- Ils ne seront plus visibles pour les clients
- Leur grille tarifaire sera mise à null

**Procédure :**
1. Cliquer sur l'icône poubelle 🗑️
2. Lire attentivement le message d'avertissement
3. Confirmer la suppression
4. Réassigner les véhicules orphelins à de nouvelles grilles

### Tableau des prix

| Colonne | Description |
|---------|-------------|
| Durée | Durée formatée (ex: "1j 2h", "30 min") |
| Minutes | Durée brute en minutes |
| Prix TTC | Prix en euros |
| Km inclus | Kilomètres inclus dans le tarif |
| Prix/min | Tarif calculé à la minute |

#### Pagination

- Sélecteur de taille de page : 50, 100, 250, 500, 1000
- Navigation : Première, Précédente, Suivante, Dernière page
- Saisie directe du numéro de page

### Import CSV

**Format attendu :**
```csv
duration_minutes,price_ttc,km_included
15,4.99,100
30,7.99,100
60,12.99,100
1440,129.99,100
```

**Séparateurs acceptés :** virgule, point-virgule, tabulation

**Procédure :**
1. Sélectionner une grille
2. Cliquer sur "Importer CSV"
3. Sélectionner le fichier
4. Validation automatique

⚠️ **Attention** : L'import **remplace tous les prix existants** de la grille.

**Validation :**
- Les lignes avec des valeurs invalides sont ignorées
- Si km_included est absent, calcul automatique : `ceil(duration_minutes / 1440) × 100`
- Toast de confirmation avec le nombre de prix importés

### Export CSV

1. Sélectionner une grille
2. Cliquer sur "Exporter"
3. Le fichier `tarifs_{nom_grille}.csv` est téléchargé

**Note** : L'export récupère **tous les prix** même au-delà de 1000 lignes.

---

## Paramètres

### Section 1 : Tarification

Configuration des frais et options de location.

| Paramètre | Unité | Description |
|-----------|-------|-------------|
| Frais de déverrouillage | € | Frais appliqués à chaque location |
| Prix km supplémentaire | €/km | Prix au km au-delà du forfait inclus |
| Km inclus par jour | km | Kilomètres inclus par jour de location |
| Option aéroport | € | Supplément pour prise en charge aéroport |
| Option pré-livraison | € | Supplément pour livraison du véhicule |

### Section 2 : Couleurs des badges

Personnalisation des couleurs des badges de catégorie véhicule.

| Badge | Catégorie | Description |
|-------|-----------|-------------|
| S | Petits véhicules | Ex: Toyota Aygo X |
| M | Véhicules moyens | Ex: Toyota Yaris |
| L | Grands véhicules | Ex: Toyota Corolla |
| XL | Utilitaires | Ex: Toyota Proace |

**Pour modifier une couleur :**
1. Utiliser le sélecteur de couleur (clic sur le carré coloré)
2. Ou saisir directement le code hexadécimal (ex: #653A8E)
3. L'aperçu du badge se met à jour en temps réel

### Section 3 : Liens de redirection

| Paramètre | Description |
|-----------|-------------|
| URL location mensuelle | Redirection pour les demandes de +30 jours |

**Utilisation :** Quand un client sélectionne une durée supérieure à 30 jours dans le simulateur, il est redirigé vers cette URL pour une demande de location longue durée.

### Sauvegarder

1. Cliquer sur "Enregistrer les modifications"
2. Seuls les paramètres modifiés sont envoyés
3. Toast de confirmation : "Paramètres sauvegardés avec succès"

### Actualiser

Cliquer sur "Actualiser" pour recharger les valeurs depuis la base de données.

---

## Demandes de contact

### Vue d'ensemble

Gestion des demandes de contact envoyées depuis le simulateur.

### Statistiques

Quatre compteurs cliquables pour filtrer :

| Statistique | Couleur | Description |
|-------------|---------|-------------|
| Total | Violet | Toutes les demandes |
| En attente | Jaune | Statut "pending" |
| Contactés | Bleu | Statut "contacted" |
| Fermés | Vert | Statut "closed" |

### Workflow de statut

```
En attente → Contacté → Fermé
     ↑______________________|
           (Rouvrir)
```

**Actions disponibles selon le statut :**

| Statut actuel | Action | Nouveau statut |
|---------------|--------|----------------|
| En attente | "Contacté" | contacted |
| Contacté | "Fermer" | closed |
| Fermé | "Rouvrir" | pending |

### Fiche de demande

Chaque demande affiche :

**En-tête :**
- Avatar avec initiale de l'email
- Adresse email
- Date et heure de création
- Badge de statut

**Détails :**
- Véhicule sélectionné
- Durée de location
- Distance estimée
- Prix estimé

**Options (si sélectionnées) :**
- Badge "Aéroport" si option aéroport cochée
- Badge "Pré-livraison" si option pré-livraison cochée
- Dates de départ et retour

### Filtrer les demandes

Cliquer sur les badges de filtre :
- **Toutes** : Afficher toutes les demandes
- **En attente** : Uniquement les demandes non traitées
- **Contactés** : Demandes où le client a été contacté
- **Fermés** : Demandes clôturées

---

## Cas particuliers

### Durée supérieure à 30 jours

Quand un client sélectionne une durée > 30 jours dans le simulateur :
1. Les sections Distance, Options et Estimation sont masquées
2. Un message s'affiche avec un bouton de redirection
3. Le bouton pointe vers l'URL configurée dans les paramètres

### Véhicules orphelins après suppression de grille

Quand une grille tarifaire est supprimée :
1. Tous les véhicules associés sont désactivés
2. Leur `pricing_grid_id` devient null
3. Ils apparaissent en jaune dans la liste des véhicules
4. Ils sont invisibles pour les clients jusqu'à réassignation

### Export de grandes grilles tarifaires

Le système gère les grilles avec des milliers de prix :
- Export par lots de 1000 entrées
- Génération d'un fichier CSV complet
- Pas de limite de taille

### Notifications (Toasts)

Le système affiche des notifications pour confirmer les actions :

**Succès (vert) :**
- "Véhicule sauvegardé avec succès"
- "X prix importés avec succès"
- "Paramètres sauvegardés avec succès"

**Erreur (rouge) :**
- "Type de fichier non supporté"
- "Le fichier est trop volumineux (max 5MB)"
- "Impossible d'activer un véhicule sans grille tarifaire"

**Information (bleu) :**
- Messages d'information générale

---

## Support technique

En cas de problème technique :
1. Vérifier la connexion internet
2. Rafraîchir la page
3. Se déconnecter et reconnecter
4. Contacter le support technique si le problème persiste

---

*Documentation générée pour LEO&Go - Simulateur de tarification*
