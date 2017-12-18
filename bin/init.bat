nvm install 8.0.0
nvm use 8.0.0
nvm list
nvm use 8.0.0
git config --global http.proxy http://10.86.1.245:8080
git clone https://github.com/Garyhjj/MIAPP-proxy.git
cd MIAPP-proxy
npm config set proxy https://10.86.1.245:8080/ && npm config set registry https://registry.npm.taobao.org/ && npm install pm2 -g && npm install