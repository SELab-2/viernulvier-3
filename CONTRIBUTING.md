# Contributing to VIERNULVIER Archive

Om de samenwerking soepel te laten verlopen, hanteren we de volgende richtlijnen en workflow.


## Branching Model

We gebruiken een gestroomlijnde **GitFlow** methodiek. Nieuwe code komt nooit direct in `main` of `dev` terecht, maar altijd via een Pull Request.

![GitFlow Workflow](https://dam-cdn.atl.orangelogic.com/AssetLink/le16ot34d0e862mba18e7j7i502585eb.svg)

### Branch Definities
* **`main`**: Bevat de stabiele versie van de applicatie. Deze branch wordt gebruikt voor deployments.
* **`dev`**: De primaire integratie-branch. Hier komt alle code van het team samen.
* **`release/milestone-X`**: Een tijdelijke 'buffer' tussen `dev` en `main`. Gebruikt voor de laatste bugfixes en validaties voor releases.

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
3. **Development**: Commit regelmatig. Richtlijnen voor commits zijn vooral van belang voor de history van `main` en `dev`.
4. **Pull Request (PR)**:
    * Open een PR naar `dev`. Gebruik **Draft** als je nog bezig bent.
    * **Reviewers**: Wijs zelf actief **2 teamgenoten** aan als reviewer. Bij grote architecturale wijzigingen is het verstandig de technisch verantwoordelijke als 3e reviewer toe te voegen.
5. **Code Review**: Elke PR vereist minimaal **2 approvals**. Los opmerkingen op voordat je merget.
6. **Merge**: Gebruik **Rebase and merge**. Verwijder je branch na de merge.

## Definition of Done (DoD)

Check deze punten voordat je de PR ter review aanbiedt:

1. **Code Quality**: De code is zelf-verklarend. Waar de logica complex is, zijn **comments** toegevoegd.
2. **Testing**: Voor elke `feat/` zijn relevante unit- of integratietests toegevoegd en geslaagd.
3. **Coverage**: Voor elke `feat/` is de coverage volgens de package `coverage` minstens 80%.
4. **Documentation**: Relevante documentatie (zoals API-docs, architectuur of handleidingen) is bijgewerkt.
5. **CI Ready**: De GitHub Actions pipeline is succesvol.
6. **No Conflicts**: De branch is up-to-date met de laatste versie van `dev`.


## Richtlijnen voor Kwaliteit

### 1. Naming & Language
* **Code**: Variabelen en functies zijn in het **Engels**.
* **Documentatie**: README's en ADR's zijn in het **Nederlands**.

### 2. Commits
Probeer duidelijke commit-messages in de gebiedende wijs (bijv. `Add user endpoint`, `Fix db connection`) te gebruiken.
*Voorkom vage teksten als "test1", "update" of "..." in de finale merge.*

### 3. Review Etiquette
* Review openstaande PR's van teamgenoten zo snel mogelijk om blokkades te voorkomen.
