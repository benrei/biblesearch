# Get variables from .env file
set -o allexport
source .env
set +o allexport

cd client
ng build
cd ..

# scp -i ~/.ssh/id_rsa -r  client/www/* $USERNAME@$SERVER_IP:/var/www/html
scp -i ~/.ssh/id_rsa -P $SSH_PORT docker-compose.yml $USERNAME@$SERVER_IP:docker-compose.yml
scp -i ~/.ssh/id_rsa -P $SSH_PORT -r client/www/* $USERNAME@$SERVER_IP:public/

scp -i ~/.ssh/id_rsa -P $SSH_PORT server/package.json $USERNAME@$SERVER_IP:
# scp -i ~/.ssh/id_rsa -P $SSH_PORT server/bible.db $USERNAME@$SERVER_IP:
scp -i ~/.ssh/id_rsa -P $SSH_PORT -r server/src/* $USERNAME@$SERVER_IP:src/

ssh -i ~/.ssh/id_rsa -p $SSH_PORT $USERNAME@$SERVER_IP << 'REMOTE_EOF'
echo "Installing Docker"

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker CE, Docker CLI, Containerd, Buildx, and Docker Compose Plugin
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

cat << 'CADDYFILE_EOF' > Caddyfile
biblesearch.app {
    reverse_proxy biblesearch:3000 # Must match service name docker-compose.yml
}
CADDYFILE_EOF

docker compose up -d

REMOTE_EOF
