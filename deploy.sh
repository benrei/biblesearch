# Prompt the user for domain name
read -p "Enter the domain name: " DOMAIN_NAME

# Variables
APP_NAME_CLIENT="biblesearch-client"
APP_NAME_SERVER="biblesearch-server"
REMOTE_DIR="~/biblesearch"
USERNAME="root"

# Validate that DOMAIN_NAME is not empty
if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: DOMAIN_NAME cannot be empty."
    exit 1
fi

# Ensure the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

echo "Building client application"
cd client
ng build
cd ..
echo "Done building client application"

# Create a docker image for the ./client directory
echo "Creating client docker image"
docker build --platform=linux/amd64 -t $APP_NAME_CLIENT ./client
docker save $APP_NAME_CLIENT > $APP_NAME_CLIENT.tar

# Create a docker image for the ./server directory
echo "Creating server docker image"
docker build --platform=linux/amd64 -t $APP_NAME_SERVER ./server
docker save $APP_NAME_SERVER > $APP_NAME_SERVER.tar

echo "Done creating docker images"
echo "Deploying to server"

# Copy project files from local machine to server
scp -i ~/.ssh/id_rsa  ./$APP_NAME_CLIENT.tar $USERNAME@$DOMAIN_NAME:$APP_NAME_CLIENT.tar
scp -i ~/.ssh/id_rsa ./$APP_NAME_SERVER.tar $USERNAME@$DOMAIN_NAME:$APP_NAME_SERVER.tar
scp -i ~/.ssh/id_rsa ./docker-compose.yml $USERNAME@$DOMAIN_NAME:docker-compose.yml

ssh -i ~/.ssh/id_rsa $USERNAME@$DOMAIN_NAME << EOF
  echo "Installing Docker"
  # Add Docker's official GPG key
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc

  # Add the Docker repository to Apt sources
  echo \
    "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    \$(. /etc/os-release && echo \$VERSION_CODENAME) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # Install Docker CE, Docker CLI, Containerd, Buildx, and Docker Compose Plugin
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Run docker containers
  docker load -i $APP_NAME_CLIENT.tar
  docker load -i $APP_NAME_SERVER.tar

  echo "Starting docker containers"
  docker compose up -d

  echo "Deployment completed successfully!"
EOF