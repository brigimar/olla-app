# Usamos una imagen pequeña de Node
FROM node:18-alpine

# Carpeta interna dentro del contenedor
WORKDIR /app

# Copia este archivo adentro del contenedor
COPY server.js .

# Cuando inicie el contenedor, ejecutará esto
CMD ["node", "server.js"]
