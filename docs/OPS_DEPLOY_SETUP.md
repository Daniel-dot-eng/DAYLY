# VM deploy setup (PM only)

Codex never receives SSH keys or any secret. It writes the deploy scripts and the GitHub Actions workflow; GitHub Actions (or you) runs them against the VM.

## Why not give Codex your private key

- Your personal SSH key opens every machine it is authorized on, with full admin rights. If it leaks into a prompt, a log or a commit, you lose the VM.
- Codex works inside its own sandbox and does not need to reach the VM to write code. The workflow does the deploying.
- If Codex needs to see how the VM behaves, you run a command and paste the output.

## Step 0: check what already runs on the VM

The VM already has Docker and n8n. Before anything else, run this on the VM and keep the output:

```
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker compose ls
sudo ss -tlnp | grep -E ':(80|443|5432|5678)\b'
uname -m && free -h && df -h /srv /
```

What to look for: whether something already listens on 80 or 443 (a reverse proxy for n8n), and whether the existing Postgres publishes port 5432. DAYLY never uses that Postgres or n8n. If 80 and 443 are taken, the plan changes: either DAYLY's Caddy takes a different host port behind the existing proxy, or the existing proxy gets a new route for DAYLY. Send me the output and I will give you the exact setup.

If the n8n on this VM runs anything live that people depend on, treat it as production: do not restart or reconfigure it during DAYLY work.

## One-time setup

### 1. Create a dedicated deploy key (on your Mac)

```
ssh-keygen -t ed25519 -f ~/.ssh/dayly_deploy -C "dayly-github-actions" -N ""
```

This creates `dayly_deploy` (private) and `dayly_deploy.pub` (public). This key is only for DAYLY deploys and can be revoked in seconds.

### 2. Create a deploy user on the VM (logged in with your own admin key)

```
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo mkdir -p /srv/dayly/app /srv/dayly/pgdata /srv/dayly/files /srv/dayly/backups
sudo chown -R deploy:deploy /srv/dayly
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
```

Then append the contents of `~/.ssh/dayly_deploy.pub` (from your Mac) as one line to `/home/deploy/.ssh/authorized_keys` and run:

```
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

Note: membership in the docker group is effectively root on this machine. That is acceptable for this staging VM; revisit before production.

### 3. Open the firewall

In the OCI console, add ingress rules for TCP 80 and 443 to the instance's security list. On the VM also allow them in the host firewall (Oracle Ubuntu images ship with restrictive iptables rules). Keep SSH (22) limited to your own IP if you can.

### 4. DNS

Create an A record for your DAYLY staging name pointing to the VM public IP. Use a short TTL while testing.

### 5. Create the production environment file on the VM

Create `/srv/dayly/app/.env` (owned by deploy, mode 600) from `.env.example` with real values: DOMAIN, POSTGRES_PASSWORD, database role passwords, SESSION_SECRET (long random string), BACKUP_AGE_RECIPIENT. This file never goes into git or into GitHub secrets.

### 6. GitHub repository secrets

Repository, Settings, Secrets and variables, Actions, New repository secret:

| Secret | Value |
|---|---|
| VM_HOST | the VM public IP |
| VM_USER | deploy |
| VM_SSH_KEY | full contents of `~/.ssh/dayly_deploy` (the private key) |
| VM_HOST_KEY | output of `ssh-keyscan -t ed25519 <VM public IP>` |

Make the repository private. Enable branch protection on `main` once CI exists.

### 7. Check the VM before Day 1

Run on the VM and keep the output handy:

```
uname -m          # expect aarch64
docker --version
docker compose version
df -h /srv
free -h
```

## Codespaces and Codex

- A Codespace is a development machine (usually x86), not the VM. Use it to run and test the stack locally; the Docker images in this repo are multi-architecture, so they run in both places.
- Give Codex access to the GitHub repository only. Review its changes through pull requests or commits.
- Never paste `.env` contents, the deploy key or database passwords into a prompt.

## If a key is ever exposed

Remove its line from `/home/deploy/.ssh/authorized_keys`, generate a new key, and update the `VM_SSH_KEY` secret. Rotate any password that appeared in the same place.
