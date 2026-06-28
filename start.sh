#!/bin/bash
export PATH=/home/asyun/.nvm/versions/node/v20.20.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
echo "Using Node: $(which node)"
echo "Node Platform: $(node -p process.platform)"
npm run dev
