# Laverie résidence

Site de réservation de créneaux pour la machine à laver de l'appart. Tarifs : 2 € sans
lessive, 2,50 € avec lessive fournie (contre 3,60 € à la laverie de la résidence).
Paiement à la main (pas de paiement en ligne). Créneaux de 1h30, de 7h à 22h, sur les
14 prochains jours.

Stack : Next.js + Tailwind + Supabase (base de données + temps réel). 100 % gratuit
sur les paliers gratuits de Supabase et Vercel.

## 1. Créer le projet Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com), crée un compte et un nouveau projet
   (choisis une région proche, ex. Paris/Frankfurt).
2. Dans **SQL Editor > New query**, colle tout le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) et clique sur **Run**.
3. Dans **Project Settings > API**, récupère :
   - **Project URL**
   - **anon public key**

## 2. Configurer le site en local

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec l'URL et la clé récupérées à l'étape 1. Le champ
`NEXT_PUBLIC_ACCESS_CODE` est le code que tu communiqueras dans la résidence (par
affiche, groupe WhatsApp, etc.) pour éviter que des inconnus sur internet réservent —
laisse-le vide si tu ne veux pas de ce filtre.

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## 3. Déployer gratuitement sur Vercel

1. Pousse le projet sur un repo GitHub.
2. Sur [vercel.com](https://vercel.com), importe le repo (compte gratuit).
3. Dans les réglages du projet Vercel, ajoute les mêmes variables d'environnement que
   dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_ACCESS_CODE`).
4. Déploie. Le site est accessible sur une URL `https://....vercel.app` gratuite.

## Fonctionnement

- Personne n'a besoin de créer de compte : on réserve avec juste un prénom et un
  numéro de chambre/appart.
- Annulation possible en cliquant sur un créneau réservé et en confirmant le même
  prénom + chambre.
- Le planning se met à jour en temps réel pour tout le monde (Supabase Realtime).
- Pour changer les tarifs, les horaires ou la durée des créneaux : voir
  [`app/lib/slots.ts`](app/lib/slots.ts).
