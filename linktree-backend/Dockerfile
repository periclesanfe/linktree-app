# Usa uma imagem base do Node.js, a mesma que usamos para o frontend
FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Expõe a porta que a nossa API usa
EXPOSE 3000

# O comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "run", "dev"]