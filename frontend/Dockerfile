# MUDANÇA AQUI: Usando Node 24 (Bleeding Edge)
FROM node:24-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Expõe a porta 3000
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]