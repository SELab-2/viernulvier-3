# Contributing to VIERNULVIER Archive

Om de samenwerking soepel te laten verlopen, hanteren we de volgende richtlijnen en workflow.


## Branching Model

We gebruiken een gestroomlijnde **GitFlow** methodiek. Nieuwe code komt nooit direct in `main` of `dev` terecht, maar altijd via een Pull Request.

![GitFlow Workflow](https://dam-cdn.atl.orangelogic.com/AssetLink/le16ot34d0e862mba18e7j7i502585eb.svg)

### Branch Definities
* **`main`**: Bevat de stabiele versie van de applicatie. Deze branch wordt gebruikt voor deployments.
* **`dev`**: De primaire integratie-branch. Hier komt alle dagelijkse code van het team samen.
* **`release/X.X.X`**: Een tijdelijke 'buffer' tussen `dev` en `main`. Gebruikt voor de laatste bugfixes en validaties voor (tussentijdse) releases.

### Versiebeheer (SemVer)
We volgen **Semantic Versioning** (`X.Y.Z`) voor onze releases:
* **X (Major)**: Grote milestones of brekende veranderingen (bijv. Milestone 1 -> `1.0.0`).
* **Y (Minor)**: Nieuwe features of functionele uitbreidingen (bijv. `0.1.0`).
* **Z (Patch)**: Kleine bugfixes of onderhoud zonder nieuwe functies (bijv. `0.1.1`).


## Branch Naamgeving

**Format:** `type/issue-nr-short-description` (Engels, kleine letters, koppeltekens).

*Voorbeeld:* `feat/04-authentication-logic` of `fix/12-db-connection-retry`

| Type | Gebruik |
| :--- | :--- |
| `feat/` | Nieuwe features of infrastructuur + testen. |
| `fix/` | Herstellen van bugs of fouten. |
| `docs/` | Updates aan documentatie. |
| `infra/` | Aanpassingen aan Docker, CI/CD of server config. |
| `refactor/` | Code opschonen zonder functionele wijziging. |
| `misc/` | Kleine tweaks zoals `.gitignore` of workflow tools. |


## Workflow

1. **Issue Selection**: Kies een issue op het Kanban-bord en wijs jezelf toe als *Assignee*.
2. **Branching**: Maak een nieuwe branch aan vanuit `dev` volgens bovenstaand format.
3. **Development**: Commit regelmatig. Schrijf duidelijke commit-messages in het Engels (zie richtlijnen onderaan).
4. **Pull Request (PR)**:
    * Push je branch en open een PR naar `dev`.
    * Zorg dat de automatische CI-checks (GitHub Actions) "groen" zijn.
    * Zet je PR op **Draft** als je tussentijds feedback wilt maar nog niet klaar bent.
5. **Code Review**:
    * Elke PR vereist minimaal **2 approvals** van teamgenoten.
    * Los alle opmerkingen (conversations) op voordat je merget.
6. **Merge**: Gebruik altijd de **Squash and Merge** optie op GitHub. Verwijder je branch na de merge.


## Definition of Done (DoD)

Voordat je een Pull Request ter review aanbiedt, moet je aan de volgende punten voldoen:

1. **Code Quality**: De code is zelf-verklarend. Waar de logica complex is, zijn **comments** toegevoegd (Nederlands of Engels).
2. **Testing**: Voor elke `feat/` zijn relevante unit- of integratietests toegevoegd en geslaagd.
3. **Documentation**: Publieke interfaces (zoals nieuwe API endpoints) zijn gedocumenteerd. Interne logica wordt toegelicht via code comments.
4. **CI Ready**: De GitHub Actions pipeline is succesvol.
5. **No Conflicts**: De branch is up-to-date met de laatste versie van `dev`.


## Richtlijnen voor Kwaliteit

### 1. Naming & Language
* **Branches & Code**: Variabelen, functies en filenamen zijn altijd in het **Engels**.
* **Comments**: Comments bij de code mogen in het **Nederlands** om complexe logica snel uit te leggen aan teamgenoten.
* **Documentatie**: Officiële documentatie (README's, ADR's) is in het **Nederlands**.

### 2. Commits
Schrijf je commits in het **Engels** en gebruik de gebiedende wijs (alsof je een commando geeft).
* **Goede voorbeelden:**
    * `Add` - *Add user authentication endpoint*
    * `Fix` - *Fix broken database connection on startup*
    * `Update` - *Update Dockerfile to use Python 3.11*
    * `Refactor` - *Refactor login controller for better readability*
    * `Remove` - *Remove unused helper functions*
* **Liefst niet**: `fixed bug`, `weer een test`, `update`.

### 3. Review Etiquette
* Review openstaande PR's van teamgenoten zo snel mogelijk om blokkades te voorkomen.
