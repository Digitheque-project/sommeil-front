# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────
# sommeil-front — image de production (Next.js 16, output: "standalone")
#
# Build (les variables NEXT_PUBLIC_* sont figées dans le bundle JS au
# build, PAS au runtime — à passer en --build-arg avec les vraies URLs) :
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_GATEWAY_URL=https://gateway-5pqs.onrender.com \
#     --build-arg NEXT_PUBLIC_AUTH_LOGIN_URL=https://authentification-front.vercel.app/login \
#     -t sommeil-front .
#
# Voir .env.example pour le détail et le rôle de chaque variable.
#
# Run :
#   docker run -p 3000:3000 sommeil-front
# ─────────────────────────────────────────────────────────────────────────

# ── Étape 1 : dépendances ───────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Étape 2 : build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables publiques (préfixe NEXT_PUBLIC_) : inlinées dans le bundle JS
# pendant "next build", donc obligatoires à l'étape de build, pas au run.
#
# Sur Render (runtime Docker), les variables d'environnement du service sont
# passées automatiquement au build en tant que build args — mais UNIQUEMENT
# celles déclarées ici par un ARG. Toute variable NEXT_PUBLIC_* absente de
# cette liste reste vide. Plus aucune adresse de repli dans le code : tout
# passe par la passerelle (NEXT_PUBLIC_GATEWAY_URL), la connexion par le
# portail central (NEXT_PUBLIC_LOGIN_URL). Le CHU et le service Sommeil sont
# lus dans le jeton de l'utilisateur (NEXT_PUBLIC_CHU_ID /
# NEXT_PUBLIC_SLEEP_SERVICE_ID ne servent que de repli facultatif).
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_LOGIN_URL
ARG NEXT_PUBLIC_AUTH_COOKIE_NAME
ARG NEXT_PUBLIC_CHU_ID
ARG NEXT_PUBLIC_SLEEP_SERVICE_ID
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL \
    NEXT_PUBLIC_LOGIN_URL=$NEXT_PUBLIC_LOGIN_URL \
    NEXT_PUBLIC_AUTH_COOKIE_NAME=$NEXT_PUBLIC_AUTH_COOKIE_NAME \
    NEXT_PUBLIC_CHU_ID=$NEXT_PUBLIC_CHU_ID \
    NEXT_PUBLIC_SLEEP_SERVICE_ID=$NEXT_PUBLIC_SLEEP_SERVICE_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Étape 3 : image de production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# output: "standalone" ne copie ni public/ ni .next/static — à faire à la main.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
