# ChatVault VPS Setup — Exact Steps (root)

Follow these commands **in order** on your VPS. You are logged in as **root**:

```text
root@vmi3356488:~#
```

**Goal:** Open ChatVault at `http://YOUR_VPS_IP:8080` and keep port 80 free for other apps later.

---

## What you will run

| Step | What |
|------|------|
| 1 | Install Docker |
| 2 | Create `/opt/apps/chatvault` |
| 3 | Put the full project there |
| 4 | Get VPS public IP |
| 5 | Create `.env` (database credentials — **no manual SQL needed**) |
| 6 | Open firewall port 8080 |
| 7 | `docker compose up -d --build` (MySQL + tables created automatically) |
| 8 | Verify database and API health |
| 9 | Test in browser |

---

## Step 1 — Install Docker

Copy and run each line. Your prompt stays `root@vmi3356488:~#` until you `cd` later.

```bash
curl -fsSL https://get.docker.com | sh
```

Verify (no logout needed — you are root):

```bash
docker --version
docker compose version
```

Expected: Docker 24+ and `Docker Compose version v2.x`.

- [ ] Docker works

---

## Step 2 — Create the app folder

```bash
mkdir -p /opt/apps/chatvault
cd /opt/apps/chatvault
```

Your prompt should now be:

```text
root@vmi3356488:/opt/apps/chatvault#
```

All remaining commands assume you are in this directory unless stated otherwise.

- [ ] Prompt shows `/opt/apps/chatvault`

---

## Step 3 — Put the project files here

You need the **full project** in `/opt/apps/chatvault` (not only `docker-compose.yml`).

### Option A — Git clone (if the repo is on GitHub/GitLab)

```bash
cd /opt/apps/chatvault
git clone https://github.com/YOUR_USER/YOUR_REPO.git .
```

The `.` at the end is important — files go directly into `/opt/apps/chatvault`.

### Option B — Upload from your Windows PC (if no Git remote)

On **your PC** (PowerShell), from the project folder:

```powershell
scp -r "d:\DevMaestro\Work\Whatsapp portal\Whatsappfinel-main\*" root@YOUR_VPS_IP:/opt/apps/chatvault/
```

Replace `YOUR_VPS_IP` with the server IP.

### Verify required files exist

On the VPS:

```bash
cd /opt/apps/chatvault
ls -la
```

You should see at least:

```text
docker-compose.yml
Dockerfile
Dockerfile.web
package.json
server/
src/
docker/
.env.docker.example
```

- [ ] All required files are present

---

## Step 4 — Get your VPS public IP (save it)

```bash
curl -4 -s ifconfig.me && echo
```

Example output: `123.45.67.89`

You will open: **`http://123.45.67.89:8080`** (use your real IP).

- [ ] Public IP noted

---

## Step 5 — Database configuration (`.env` file)

You **do not** install MySQL on the host or run `CREATE DATABASE` by hand. ChatVault uses a **MySQL Docker container** that reads your `.env` and creates everything on first start.

### How the database is created (automatic)

| When | What happens |
|------|----------------|
| First `docker compose up` | MySQL container starts and creates database `chatvault` |
| Same first start | MySQL creates user `chatvault` with your `DB_PASSWORD` |
| App container starts | Node.js connects and runs `server/config/schema.sql` (tables) |

Your `docker-compose.yml` passes these variables to the MySQL service:

- `MYSQL_DATABASE` ← `DB_NAME`
- `MYSQL_USER` ← `DB_USER`
- `MYSQL_PASSWORD` ← `DB_PASSWORD`
- `MYSQL_ROOT_PASSWORD` ← `MYSQL_ROOT_PASSWORD`

The app connects using `DB_HOST=mysql` (the Docker service name, **not** `localhost`).

### Create the `.env` file

```bash
cd /opt/apps/chatvault
cp .env.docker.example .env
openssl rand -base64 48
nano .env
```

Paste and adjust this **complete** `.env` (use your real passwords; generate a new `JWT_SECRET`):

```env
NODE_ENV=production
PORT=3001

DB_HOST=mysql
DB_USER=chatvault
DB_PASSWORD="YOUR_DB_PASSWORD"
DB_NAME=chatvault
MYSQL_ROOT_PASSWORD="YOUR_ROOT_PASSWORD"

JWT_SECRET=paste-output-from-openssl-rand-command-above

HTTP_PORT=8080
```

### Important — passwords with `#` or `$`

If your password contains **`#`** or **`$`**, wrap the value in **double quotes** in `.env`.

Without quotes, `#` is treated as a comment and the rest of the password is cut off.

**Wrong (broken):**

```env
MYSQL_ROOT_PASSWORD=^5W2W2Vbzzwizgyw#$
```

**Correct:**

```env
DB_PASSWORD="ctvltp$"
MYSQL_ROOT_PASSWORD="^5W2W2Vbzzwizgyw#$"
```

### Values you should use

| Variable | Value | Notes |
|----------|-------|-------|
| `DB_HOST` | `mysql` | Do not change |
| `DB_USER` | `chatvault` | Do not change |
| `DB_PASSWORD` | your DB password | Use quotes if it has `#` or `$` |
| `DB_NAME` | `chatvault` | Do not change |
| `MYSQL_ROOT_PASSWORD` | your root password | Use quotes if it has `#` or `$` |
| `JWT_SECRET` | from `openssl rand -base64 48` | Required |
| `HTTP_PORT` | `8080` | Public web port |

Save in nano: `Ctrl+O`, Enter, then exit: `Ctrl+X`.

Verify `.env` was written correctly:

```bash
grep -E '^DB_|^MYSQL_|^HTTP_PORT|^JWT_' .env
```

- [ ] `.env` exists in `/opt/apps/chatvault`
- [ ] Database variables match your chosen passwords (quoted if needed)
- [ ] `DB_HOST=mysql` and `DB_NAME=chatvault`
- [ ] `HTTP_PORT=8080`
- [ ] `JWT_SECRET` is set

> **Never commit `.env` to Git** — it contains secrets. Only edit it on the VPS.

---

## Step 6 — Open firewall port 8080

```bash
ufw allow OpenSSH
ufw allow 8080/tcp
ufw enable
ufw status
```

If `ufw` asks to continue, type `y` and Enter.

**Also:** In your VPS provider panel (Contabo, Hetzner, etc.), allow inbound **TCP 8080** if there is a separate cloud firewall.

- [ ] Port 8080 allowed on the server

---

## Step 7 — Build and start ChatVault (database + tables created here)

```bash
cd /opt/apps/chatvault
docker compose up -d --build
```

On **first run**, Docker will:

1. Download the MySQL 8.4 image
2. Create the `chatvault` database and `chatvault` MySQL user from your `.env`
3. Build the API and web images
4. Run `schema.sql` inside the app (creates `users`, `chats`, `messages`, etc.)

First run takes **5–15 minutes** (npm install + frontend build).

Watch MySQL and app startup (optional):

```bash
docker compose logs -f mysql app
```

Look for:

```text
mysql  | ... ready for connections
app    | ✅ Database connected successfully
app    | ✅ Database schema initialized
app    | ✅ Database initialized successfully
```

Press `Ctrl+C` to stop watching logs (containers keep running).

Check status:

```bash
docker compose ps
```

Expected:

| NAME | STATUS |
|------|--------|
| chatvault-mysql-1 | Up (healthy) |
| chatvault-app-1 | Up |
| chatvault-web-1 | Up |

Exact container names may vary; all three must be **Up**.

- [ ] All 3 containers running
- [ ] MySQL is **healthy**

---

## Step 8 — Verify database and API

### 8a — API health

```bash
curl http://localhost:8080/api/health
```

Expected:

```json
{"status":"OK","timestamp":"2026-..."}
```

### 8b — Confirm MySQL database exists

```bash
cd /opt/apps/chatvault
docker compose exec mysql mysql -u chatvault -p'YOUR_DB_PASSWORD' -e "SHOW DATABASES LIKE 'chatvault';"
```

Replace `YOUR_DB_PASSWORD` with your real `DB_PASSWORD` (keep the single quotes around it in the shell).

Expected output includes a row: `chatvault`.

### 8c — Confirm tables were created

```bash
docker compose exec mysql mysql -u chatvault -p'YOUR_DB_PASSWORD' chatvault -e "SHOW TABLES;"
```

Expected tables include: `users`, `chats`, `messages` (exact names from `server/config/schema.sql`).

### If database setup fails

```bash
docker compose logs mysql
docker compose logs app
```

| Error | Fix |
|-------|-----|
| `Access denied for user 'chatvault'` | Passwords in `.env` do not match; fix quotes for `#` / `$`; then see reset note below |
| `Database initialization failed` | Wait 60s for MySQL; re-check `.env` |
| Wrong password after first failed start | MySQL volume may have old passwords — reset volume (see below) |

**Reset database and start fresh** (deletes all ChatVault data):

```bash
cd /opt/apps/chatvault
docker compose down -v
docker compose up -d --build
```

The `-v` flag removes `mysql_data` and `uploads_data` volumes. Only use this on a new setup or when you accept data loss.

- [ ] Health check returns `"status":"OK"`
- [ ] Database `chatvault` exists
- [ ] Tables exist

---

## Step 9 — Test from your browser

Replace `YOUR_VPS_IP` with the IP from Step 4.

**Website:**

```text
http://YOUR_VPS_IP:8080
```

**Health API:**

```text
http://YOUR_VPS_IP:8080/api/health
```

- [ ] Site loads in browser
- [ ] Register / login works

---

## Step 10 — What is public vs internal

| Service | Port | Public? |
|---------|------|---------|
| **web** (site + API proxy) | **8080** on host | **Yes** — users open this |
| **app** (Node API) | 3001 | **No** — Docker internal only |
| **mysql** | 3306 | **No** — Docker internal only |

Do **not** expose 3001 or 3306 to the internet.

---

## Multi-app layout (same server, later)

```text
/opt/apps/
├── chatvault/     ← you are here (port 8080)
├── other-app/     ← later (port 8081, 8082, …)
└── proxy/         ← optional later (port 80/443 + domains)
```

| Port | Use |
|------|-----|
| 22 | SSH |
| 80 | Reserved for future reverse proxy |
| 443 | Reserved for future HTTPS |
| **8080** | **ChatVault (now)** |
| 8081+ | Other apps later |

---

## Commands you will use again

Always start from the app folder:

```bash
cd /opt/apps/chatvault
```

| Task | Command |
|------|---------|
| Status | `docker compose ps` |
| Logs (API) | `docker compose logs -f app` |
| Logs (all) | `docker compose logs -f` |
| Restart API | `docker compose restart app` |
| Stop | `docker compose down` |
| Start | `docker compose up -d` |
| Update after code change | `docker compose up -d --build` |

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| `command not found: docker` | Re-run Step 1 |
| `no configuration file provided` | Run commands from `/opt/apps/chatvault` |
| Cannot open site from browser | `ufw status`; open 8080 in provider firewall; check `HTTP_PORT=8080` in `.env` |
| `Database initialization failed` | Wait 1–2 min; `docker compose logs mysql`; check passwords in `.env` |
| 502 on `/api/*` | `docker compose logs app` |
| Port 8080 in use | Set `HTTP_PORT=8081` in `.env`, `ufw allow 8081/tcp`, rebuild, use `:8081` in URL |

---

## Production checklist

- [ ] `JWT_SECRET`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` are not defaults
- [ ] `http://YOUR_VPS_IP:8080/api/health` works from your PC
- [ ] Login and ZIP upload tested
- [ ] Backups planned — see [VPS-DOCKER-SETUP.md](./VPS-DOCKER-SETUP.md)

---

## Related docs

- [VPS-DOCKER-SETUP.md](./VPS-DOCKER-SETUP.md) — architecture, HTTPS, backups
- [README.md](../README.md) — development and API reference
