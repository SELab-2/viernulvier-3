# CD pipeline manueel triggeren

## GitHub CLI installeren
**Ubuntu/Debian**
```bash
sudo apt install gh
```

**Arch Linux**
```bash
sudo pacman -S github-cli
```

**Windows**
```powershell
winget install GitHub.cli
```
Of via [cli.github.com](https://cli.github.com) de installer downloaden.

## Authenticeren
Maak een personal access token aan met `workflow` scope:
Github → Settings (van account) → Developer settings (helemaal onderaan) → Personal access tokens → Tokens (classic) → genereer met `workflow` scope aangevinkt.

Authenticeer dan:
```bash
gh auth login
# Kies: GitHub.com → HTTPS → plak je token
```

## Deploy triggeren op `dev`
```bash
gh workflow run cd.yaml --repo SELab-2/viernulvier-3 --ref dev
```

## Run bekijken
```bash
gh run watch --repo SELab-2/viernulvier-3
```
