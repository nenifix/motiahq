# Dockerfile — motiahq
# Developed by nenifix.com

FROM node:18-alpine

WORKDIR /app

# Install server deps
COPY package.json ./
RUN npm ci --production

# Copy source
COPY src/ ./src/
COPY bin/ ./bin/

# Build UI
COPY src/ui/package.json src/ui/package-lock.json* ./src/ui/
RUN cd src/ui && npm ci && npm run build && cp -r dist /app/ui-dist

# Create config dir
RUN mkdir -p /root/.motiahq

EXPOSE 8770

CMD ["node", "src/server/index.js", "serve"]
