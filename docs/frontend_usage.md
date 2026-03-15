# Frontend Project

## Overzicht

Dit project is gebouwd met React en maakt gebruik van React Router in framework mode met file based routing.

## Projectstructuur

```
frontend/app/
├── assets/         ← Statische bestanden
├── features/       ← Feature-based modules
│   ├── search/         ← Alle files gerelateerd aan zoeken in het archief
│   │   ├── components/         ← React components
│   │   ├── hooks/              ← Custom React hooks
│   │   ├── services/           ← Communicatie met de API
│   │   │   ├── search.api.ts           ← Functies voor API requests
│   │   │   └── search.api.test.ts      ← Tests voor API functies
│   │   ├── index.ts            ← Public exports van de feature
│   │   ├── search.const.ts     ← Constanten
│   │   └── search.types.ts     ← Types
│   └── auth/
│       ├── components/
│       └── ...
├── shared/         ← Gedeelde code die door meerdere features gebruikt wordt
│   ├── components/     ← Hebruikbare React components
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── constants/      ← Globale constanten
│   │   ├── api.const.ts
│   │   └── routes.const.ts
│   ├── hooks/          ← Algemene custom React hooks
│   ├── services/       ← Algemene services
│   ├── types/          ← Globale types
│   └── utils/          ← Utility functions
├── routes/     ← React Router route components
│   ├── _index.tsx      ← Homepagina route
│   ├── search.tsx      ← Search pagina
│   └── item.$id.tsx    ← Voorbeeld van een route "/item/{id}"
├── styles/     ← Globale CSS
├── root.tsx    ← Root component / Entrypoint van de React app
└── routes.ts   ← React router route config
```


### Testen
Testbestanden worden geplaatst in directories genaamd `__tests__` die zich in dezelfde directory bevinden als de bestanden die worden getest, of alternatief staan testbestanden naast hun corresponderende bestanden met de extensie `*.test.ts` / `*.spec.ts`.

De integratie testen bevinden zich in een tests/ folder buiten app/

## Scripts

Installeren van packages:
`npm ci`

Package toevoegen:
`npm install [package naam]`

Uitvoeren van ESLint: 
`npm run lint`

Formatteren van alle files:
`npm run format`

Uitvoeren van testen:
`npm run test`

### Applicatie Starten

De frontend kan lokaal gestart worden met:
`npm run start`

De frontend zal dan beschikbaar komen op:
`http://localhost:5173`


## Routing

Voor routing wordt gebruik gemaakt van file-based routing, hierbij worden routes gedefiniëerd aan de hand van de namen van de bestanden in `frontend/app/routes/`
Een route voor een specifieke production wordt dan bijvoorbeeld gedefiniëerd als `frontend/app/routes/archive.productions.$id.tsx`.

Voor specifieke details zie de documentatie [file-route-conventions](https://reactrouter.com/how-to/file-route-conventions)

