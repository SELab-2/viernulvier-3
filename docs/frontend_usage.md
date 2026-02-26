# Frontend Project

## Overzicht

Dit project is gebouwd met React en maakt gebruik van React Router in framework mode met manueel geconfigureerde routing.

## Projectstructuur

```
frontend/app
├── assets/         ← Afbeeldingen, videos, ...
├── components/     ← React components
│   └── __tests__/      ← Tests voor components
├── hooks/          ← Hook functies
├── root.tsx        ← Entrypoint voor react router
├── routes/         ← React pagina's 
│   └── home.tsx        ← Homepagina
├── routes.ts       ← Endpoints worden hier gedefinieërd
├── services/       ← API calls
│   └── __tests__/      ← Tests voor services
├── contexts/       ← State Management
├── styles/         ← CSS files
│   └── app.css         ← styles die overal in de webapp voorkomen
├── util/           ← Overige functies
└── types/          ← Type definities
```

### Testen
Testbestanden worden geplaatst in directories genaamd `__tests__` die zich in dezelfde directory bevinden als de bestanden die worden getest, of alternatief staan testbestanden naast hun corresponderende bestanden met de extensie `*.test.ts` / `*.spec.ts`.

## Scripts

Installeren van packages:
`npm ci`

Package toevoegen:
`npm install [package naam]`

Uitvoeren van ESLint: 
`npm run lint`

Formatteren van alle files:
`npm run format`

### Applicatie Starten

De frontend kan lokaal gestart worden met:
`npm run start`

De frontend zal dan beschikbaar komen op:
`http://localhost:5173`


## Routing

Voor routing wordt gebruik gemaakt van manueel geconfigureerd routen tegenover file-based routing.

Dit wil zeggen dat routes gespecifieërd worden in `routes.ts` door een lijn toe te voegen aan de RouteConfig lijst van de volgende vorm:
```tsx
export default [
    ...
    route("some/path", "./some/file.tsx") // <= Route "/some/path" geeft nu component in "./some/file.tsx" weer
] satisfies RouteConfig;
```


