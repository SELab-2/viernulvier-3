## Workflow

1. **Issue aanmaken of kiezen** en desnoods bespreken
2. **Nieuwe branch** voor elke issue/stuk werk dat je afhandelt
3. **Genoeg commits** → niet alles bundelen in een enkele commit
4. **PR voor elke verandering** → nooit rechtstreeks naar main pushen!
5. **Minstens 2 reviewers** per PR (liefst de verantwoordelijke betrekken)
6. **Merge** 
7. (Verwijder branch)

### Pull Request richtlijnen
Gelieve:

- 1 PR per 1 issue
- Voeg tests toe als je logica wijzigt
- Update documentatie als gedrag verandert
- Zorg dat automatische (CI) testen passen
- 2 reviewers per PR

### Branch naamgeving

- `main` → productie versie
- `feature/naam`  → functionaliteit
- `test/naam`  → testen
- `fix/naam`  → bugfix
- `docs/naam` → documentatie
- `misc/naam` → resterend (workflow, CI, README, etc.)

### Commit naamgeving

Kort en omschrijvend.
- Liefst niet: 'opgelost', 'fix', 'test', ...
- Wel: 'Login tests', 'Zoek functionaliteit toegevoegd', ...

