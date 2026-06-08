# ChatVault VPS Setup — Simple Checklist

Use this checklist to deploy ChatVault on a Linux VPS and access it at **`http://YOUR_VPS_IP:PORT`**.

Designed so you can add **other apps on the same server later** (each app in its own folder and port).

---

## Before you start

| Item | Value |
|------|--------|
| VPS OS | Ubuntu 22.04 / 24.04 (recommended) |
| Min specs | 2 GB RAM, 2 vCPU, 20 GB disk |
| ChatVault port | **8080** (recommended — leaves port 80 free for a future reverse proxy) |
| Access URL | `http://YOUR_VPS_IP:8080` |

---

## Step 1 — Connect to the VPS

```bash
ssh root@YOUR_VPS_IP
# or
ssh your-user@YOUR_VPS_IP
```

- [ ] You can log in via SSH

---

## Step 2 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and log back in, then verify:

```bash
docker --version
docker compose version
```

- [ ] Docker installed
- [ ] Docker Compose v2 works

---

## Step 3 — Create the apps folder (multi-app layout)

Each app lives in its own directory under `/opt/apps`:

```bash
sudo mkdir -p /opt/apps
sudo chown $USER:$USER /opt/apps
mkdir -p /opt/apps/chatvault
cd /opt/apps/chatvault
```

Future apps example:

```
/opt/apps/
├── chatvault/     ← this app (port 8080)
├── other-app/     ← later (port 8081, 8082, etc.)
└── proxy/         ← optional later (Caddy/Traefik on port 80/443)
```

- [ ] `/opt/apps/chatvault` exists and you are inside it

---

## Step 4 — Upload or clone the project

**Option A — Git (recommended)**

```bash
cd /opt/apps/chatvault
git clone <your-repo-url> .
```

**Option B — Upload from your PC**

Copy the **entire project** (not only `docker-compose.yml`) into `/opt/apps/chatvault`.

Required files include: `docker-compose.yml`, `Dockerfile`, `Dockerfile.web`, `server/`, `src/`, `package.json`, `docker/nginx.conf`, `.env.docker.example`.

- [ ] Full project is in `/opt/apps/chatvault`

---

## Step 5 — Create `.env`

```bash
cd /opt/apps/chatvault
cp .env.docker.example .env
nano .env
```

Set these values (do **not** leave defaults in production):

| Variable | What to set |
|----------|-------------|
| `JWT_SECRET` | Run: `openssl rand -base64 48` and paste the result |
| `DB_PASSWORD` | Strong password for the `chatvault` DB user |
| `MYSQL_ROOT_PASSWORD` | Strong MySQL root password |
| `HTTP_PORT` | **`8080`** (or another free port — see port plan below) |

Keep these as-is:

```env
DB_HOST=mysql
DB_USER=chatvault
DB_NAME=chatvault
NODE_ENV=production
PORT=3001
```

- [ ] `.env` created with strong secrets
- [ ] `HTTP_PORT=8080` set (or your chosen port)
- [ ] `DB_HOST` is still `mysql`

---

## Step 6 — Open the firewall port

Replace `8080` if you chose a different `HTTP_PORT`.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 8080/tcp
sudo ufw enable
sudo ufw status
```

**Cloud panel (AWS, DigitalOcean, Hetzner, etc.):** also allow inbound **TCP 8080** in the security group / firewall rules.

- [ ] UFW allows SSH + your ChatVault port
- [ ] Cloud firewall allows the same port

---

## Step 7 — Build and start ChatVault

```bash
cd /opt/apps/chatvault
docker compose up -d --build
```

First run may take 5–10 minutes.

Check status:

```bash
docker compose ps
```

All three services should be **Up**; `mysql` should be **healthy**.

- [ ] `mysql`, `app`, and `web` containers are running

---

## Step 8 — Test from the VPS

```bash
curl http://localhost:8080/api/health
```

Expected:

```json
{"status":"OK","timestamp":"..."}
```

If it fails:

```bash
docker compose logs mysql
docker compose logs app
docker compose logs web
```

- [ ] Health check returns `"status":"OK"`

---

## Step 9 — Test from your browser (IP + port)

Open:

```
http://YOUR_VPS_IP:8080
```

Health endpoint:

```
http://YOUR_VPS_IP:8080/api/health
```

- [ ] Website loads in the browser
- [ ] You can register / log in
- [ ] Upload test works (optional)

---

## Step 10 — Note what is internal (do not expose)

ChatVault uses **one public port** only. Keep these **off** the public internet:

| Service | Port | Exposed? |
|---------|------|----------|
| **web** (Nginx + React) | `8080` on host | **Yes** — this is what users open |
| **app** (Node API) | `3001` | **No** — internal Docker network only |
| **mysql** | `3306` | **No** — internal Docker network only |

Do **not** add `ports: "3001:3001"` or `3306:3306` unless you have a specific reason.

- [ ] Only `HTTP_PORT` (8080) is open publicly

---

## Port plan for multiple apps on one VPS

| Port | App | Status |
|------|-----|--------|
| 22 | SSH | System |
| 80 | Reserved | Future reverse proxy (Caddy / Traefik / Nginx) |
| 443 | Reserved | Future HTTPS |
| **8080** | **ChatVault** | **Use now** |
| 8081 | Next app | Free |
| 8082 | Next app | Free |

When you add another app later:

1. Create `/opt/apps/other-app`
2. Give it its own `docker-compose.yml` and `.env`
3. Set a **different** `HTTP_PORT` (e.g. `8081`)
4. Open that port in UFW + cloud firewall
5. Access at `http://YOUR_VPS_IP:8081`

Optional later: put **Caddy** or **Traefik** on port 80/443 and route by domain name (`chatvault.example.com`, `other.example.com`) to each app’s internal port.

---

## Daily commands (quick reference)

```bash
cd /opt/apps/chatvault

docker compose ps              # status
docker compose logs -f app     # API logs
docker compose restart app     # restart API only
docker compose down            # stop (keeps data)
docker compose up -d           # start again
docker compose up -d --build   # rebuild after code update
```

---

## Production checklist (do before real use)

- [ ] Changed `JWT_SECRET`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` from defaults
- [ ] Tested `http://YOUR_VPS_IP:8080/api/health`
- [ ] Tested login and ZIP upload
- [ ] Planned backups (MySQL dump + uploads volume — see [VPS-DOCKER-SETUP.md](./VPS-DOCKER-SETUP.md))
- [ ] HTTPS planned for later (domain + reverse proxy or Certbot)

---

## Troubleshooting (one line each)

| Problem | Fix |
|---------|-----|
| Cannot connect from browser | Check UFW + cloud firewall; confirm `HTTP_PORT` in `.env` matches URL |
| `Database initialization failed` | Wait for MySQL; check `.env` passwords match |
| 502 on `/api/*` | `docker compose logs app` — API may be down |
| Port already in use | Pick another `HTTP_PORT` (e.g. 8081) in `.env` and reopen firewall |

---

## Related docs

- [VPS-DOCKER-SETUP.md](./VPS-DOCKER-SETUP.md) — full architecture, HTTPS, backups, uninstall
- [README.md](../README.md) — development and API reference
