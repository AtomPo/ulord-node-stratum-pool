FROM ubuntu
ENV POOL_VERSION O_SR_PURE_1.0.0
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        ca-certificates \
        build-essential \
        libsodium-dev \
        npm \
        curl \
        wget \
        git \
    && rm -rf /var/lib/apt/lists/*
# Node
RUN npm install n -g \ 
    && n 4.8.7
# NPM    
ADD . /ulord-node-stratum-pool
WORKDIR /ulord-node-stratum-pool
RUN npm update
# 更新矿池签名
ADD ./transactions.js /ulord-node-stratum-pool/node_modules/stratum-pool/lib/transactions.js
CMD ["npm","start"]