#!/usr/bin/env bash
# =============================================================================
# MedAlign VPS Bootstrap Script
# Run ONCE on the VPS to set up the host-level Nginx + SSL.
#
# Prerequisites:
#   - DNS: medalign.austattendance.online → 187.52.122.100 (already done)
#   - Docker containers running: medalign_web (:9000), medalign_frontend (:5173)
#
# Usage:
#   chmod +x vps-setup.sh
#   sudo bash vps-setup.sh
# =============================================================================
set -euo pipefail

DOMAIN="medalign.austattendance.online"
EMAIL="akib.cse.20230204118@aust.edu"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "======================================================"
echo "  MedAlign VPS Bootstrap"
echo "  Domain : $DOMAIN"
echo "  Dir    : $PROJECT_DIR"
echo "======================================================"
echo ""

# ── 1. Install Nginx and Certbot ─────────────────────────────────────────────
echo "==> Installing Nginx and Certbot..."
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx curl

# ── 2. Open firewall ports ───────────────────────────────────────────────────
echo "==> Opening ports 80 and 443..."
if command -v ufw &>/dev/null && ufw status | grep -q "active"; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw reload
fi

# ── 3. Deploy Nginx reverse-proxy config ─────────────────────────────────────
echo "==> Deploying Nginx config..."
cp "$PROJECT_DIR/nginx-proxy/medalign.conf" /etc/nginx/sites-available/medalign.conf
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/medalign.conf /etc/nginx/sites-enabled/medalign.conf

# Use a temporary HTTP-only server block so Certbot can verify domain ownership
# (the SSL block will fail before the cert exists — temporarily disable it)
cat > /etc/nginx/sites-available/medalign-temp.conf <<'TEMP'
server {
    listen 80;
    server_name medalign.austattendance.online;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok"; add_header Content-Type text/plain; }
}
TEMP
rm -f /etc/nginx/sites-enabled/medalign.conf
ln -sf /etc/nginx/sites-available/medalign-temp.conf /etc/nginx/sites-enabled/medalign-temp.conf

systemctl enable nginx
systemctl restart nginx

# ── 4. Obtain Let's Encrypt SSL certificate ──────────────────────────────────
echo ""
echo "==> Obtaining SSL certificate for $DOMAIN ..."
certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    --redirect

# ── 5. Switch to full reverse-proxy config with SSL ──────────────────────────
echo "==> Activating full Nginx config with SSL..."
rm -f /etc/nginx/sites-enabled/medalign-temp.conf
rm -f /etc/nginx/sites-available/medalign-temp.conf
ln -sf /etc/nginx/sites-available/medalign.conf /etc/nginx/sites-enabled/medalign.conf

nginx -t
systemctl reload nginx

# ── 6. Auto-renewal cron ─────────────────────────────────────────────────────
echo "==> Setting up certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") \
    | sort -u | crontab -

echo ""
echo "======================================================"
echo "  Bootstrap complete!"
echo ""
echo "  App is live at:"
echo "    https://$DOMAIN"
echo ""
echo "  API:      https://$DOMAIN/api/"
echo "  Frontend: https://$DOMAIN/"
echo "======================================================"
