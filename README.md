# GE Ride

Itinéraires moto pour découvrir le réseau TPG et le canton de Genève.
App web installable (PWA), gratuite, sans compte ni serveur.

## Mettre en ligne (GitHub Pages, gratuit)

1. Crée un compte sur github.com, puis un dépôt public nommé `geride`.
2. Dans le dépôt : **Add file › Upload files**, puis envoie **les 12 fichiers** de ce dossier en une fois. Valide avec **Commit changes**.
3. **Settings › Pages** : Source = « Deploy from a branch », branche `main`, dossier `/ (root)`, puis **Save**.
4. Après une minute, l’app est sur `https://<ton-pseudo>.github.io/geride/`.
5. Ouvre ce lien sur ton téléphone, puis **Ajouter à l’écran d’accueil** (Safari : bouton Partager ; Chrome : menu ⋮).

## Premier lancement

1. **Carte › Charger le réseau TPG** : télécharge une fois les lignes, les arrêts et la limite exacte du canton depuis OpenStreetMap (30 s à 2 min).
2. **Réglages › Clé OpenRouteService** : crée un compte gratuit sur openrouteservice.org, copie ta clé « Standard » et colle-la.
3. **Réglages › Départ par défaut** : place ton domicile sur la carte.

## Sécurité frontière (permis d’élève)

- Option « Ne jamais traverser la frontière » activée par défaut.
- Le calculateur évite les frontières, et GE Ride revérifie ensuite chaque trajet tous les 20 m contre la limite exacte du canton, avec une marge réglable.
- Un trajet qui sort du canton est refusé (affiché en rouge, export bloqué).
- Le GPX contient la trace vérifiée : ouvre-le dans OsmAnd ou Organic Maps et choisis « suivre la trace ». Google Maps et Waze recalculent leur propre trajet sans ces restrictions.
- L’app aide à préparer la balade. Sur la route, ce sont la signalisation et ta vigilance qui comptent.

## Sources

Données © contributeurs OpenStreetMap (ODbL) · itinéraires openrouteservice · fond de carte OpenStreetMap · Leaflet.
Outil personnel, pas une application officielle des TPG.
