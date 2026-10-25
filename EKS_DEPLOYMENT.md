# 🚀 UniVance Kubernetes Deployment Guide (AWS EC2 & EKS)

This guide provides three options to deploy **UniVance** on Kubernetes on AWS. Choose the one that best fits your budget and project requirements:

- **Option 1 (Recommended for Faculty Demos)**: **Multi-Node KinD Cluster on AWS EC2** — Genuine 3-node cluster (1 control plane + 2 worker nodes) on a single EC2 instance, avoiding the $0.10/hr EKS cluster fee.
- **Option 2 (100% Free Tier $0.00)**: **Multi-Node K3s on 2 x Free Tier `t2.micro` Instances** — Fully covered under the 12-month AWS Free Tier.
- **Option 3 (Managed EKS)**: **AWS EKS using `eksctl`** — Managed Kubernetes (costs ~$0.10/hr, recommended for short 2–3 hour demos).

---

## 🏆 Option 1: Multi-Node KinD Cluster on AWS EC2 (Recommended)

### Why this is ideal for college/faculty evaluation:
1. **True Multi-Node Visuals**: `kubectl get nodes` shows **1 Control-Plane and 2 Worker Nodes**.
2. **Pod Distribution**: `kubectl get pods -o wide` shows your backend and frontend pods running across separate worker nodes.
3. **No EKS Control Plane Fee**: Saves the $72/month AWS EKS fee.
4. **Single EC2 Machine**: No complex inter-instance VPC networking or firewalls to debug.

---

### Step 1: Launch an AWS EC2 Instance
1. Go to **AWS Console** → **EC2** → **Launch Instance**.
2. **Name**: `univance-k8s-node`
3. **OS**: **Ubuntu Server 24.04 LTS** (or 22.04 LTS).
4. **Instance Type**: 
   - `t3.medium` (2 vCPU, 4GB RAM) — *Recommended for smooth operation (~$0.04/hr)*
   - Or `t3.small` (2 vCPU, 2GB RAM) with 2GB swap.
5. **Storage**: 25 GB gp3.
6. **Key Pair**: Select or create an SSH key pair (`univance-key.pem`).
7. **Security Group (Inbound Rules)**:
   - **SSH**: Port `22` (Source: My IP or Anywhere)
   - **HTTP**: Port `80` (Source: Anywhere `0.0.0.0/0`)
   - **Backend (Optional)**: Port `5002` (Source: Anywhere `0.0.0.0/0`)
8. Click **Launch Instance**.

---

### Step 2: Connect and Install Prerequisites (Docker, KinD, kubectl)
SSH into your EC2 instance from your terminal:
```bash
ssh -i "univance-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Run the following setup script on your EC2 instance:
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker

# 3. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 4. Install KinD (Kubernetes in Docker)
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verify installations
docker --version
kubectl version --client
kind --version
```

---

### Step 3: Clone UniVance and Create the 3-Node Cluster
On the EC2 instance:
```bash
# Clone the repository
git clone <YOUR-GITHUB-REPO-URL>
cd "UniVance_Project - Copy"   # or your repo directory

# Create the 3-node Kubernetes cluster using kind-config.yaml
kind create cluster --config k8s/kind-config.yaml
```

Verify your multi-node cluster:
```bash
kubectl get nodes
```
You will see:
```
NAME                           STATUS   ROLES           AGE   VERSION
univance-cluster-control-plane Ready    control-plane   60s   v1.32.2
univance-cluster-worker        Ready    <none>          45s   v1.32.2
univance-cluster-worker2       Ready    <none>          45s   v1.32.2
```

---

### Step 4: Build or Pull Container Images
You have two choices to get container images into KinD:

#### Method A: Build locally on EC2 and load into KinD directly (Zero registry setup)
```bash
# Build the Docker images right on the EC2 machine
docker build -t univance-backend:latest ./backend
docker build -t univance-frontend:latest ./frontend

# Load the images directly into the KinD cluster nodes
kind load docker-image univance-backend:latest --name univance-cluster
kind load docker-image univance-frontend:latest --name univance-cluster
```

#### Method B: Use Docker Hub
```bash
# If you pushed to Docker Hub:
# Update k8s/backend-deployment.yaml and k8s/frontend-deployment.yaml with your Docker Hub username
# (e.g. docker.io/username/univance-backend:latest)
```

---

### Step 5: Deploy UniVance to the Cluster
```bash
# 1. Create a local Secret manifest from the template and replace its placeholder values.
#    Do not commit k8s/secret.yaml; it is excluded by .gitignore.
cp k8s/secret.example.yaml k8s/secret.yaml

# 2. Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. Deploy MongoDB (or use MongoDB Atlas in your local k8s/secret.yaml)
kubectl apply -f k8s/mongodb-deployment.yaml

# 4. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml

# 5. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
```

Watch your pods start and get distributed across worker nodes:
```bash
kubectl get pods -o wide -w
```

Example output:
```
NAME                        READY   STATUS    NODE
backend-79dfb8b54-xk2m9     1/1     Running   univance-cluster-worker
frontend-5f96b9cb79-zp5lr   1/1     Running   univance-cluster-worker2
mongodb-5c9c7f6685-6r7qw    1/1     Running   univance-cluster-worker
```

---

### Step 6: Access UniVance in Your Browser
Open your browser and navigate to:
```
http://<YOUR-EC2-PUBLIC-IP>
```
Because `k8s/kind-config.yaml` maps EC2 host port `80` to the frontend `nodePort: 30080`:
- Port 80 directly reaches the React frontend.
- Nginx proxies `/api` requests to `http://backend:5002` through Kubernetes internal DNS.
- Admin login: `univance@dietms.org` / `Admin@123`.

---

## 🆓 Option 2: Multi-Node K3s Cluster on AWS Free Tier (100% Free - $0.00)

If you strictly want to stay within the **12-Month AWS Free Tier**:

### Architecture:
- **Node 1 (Master)**: EC2 `t2.micro` (Ubuntu)
- **Node 2 (Worker)**: EC2 `t2.micro` (Ubuntu)
*(Both covered under the 750 monthly free tier hours)*

### Setup on Node 1 (Master):
```bash
# 1. Install K3s server
curl -sfL https://get.k3s.io | sh -

# 2. Get the join token
sudo cat /var/lib/rancher/k3s/server/node-token

# 3. Get master private IP
hostname -I | awk '{print $1}'
```

### Setup on Node 2 (Worker):
```bash
# Replace with master private IP and token from step above
curl -sfL https://get.k3s.io | K3S_URL=https://<MASTER_PRIVATE_IP>:6443 K3S_TOKEN=<NODE_TOKEN> sh -
```

### On Master Node:
```bash
sudo kubectl get nodes
# Shows both EC2 instances as ready Kubernetes nodes!

# Deploy UniVance
sudo kubectl apply -f k8s/
```
Access via `http://<MASTER-EC2-PUBLIC-IP>`.

---

## ☁️ Option 3: Managed AWS EKS (Short Demo Strategy)

If your faculty insists on **AWS Managed EKS**:

### 1. Create the EKS Cluster using `eksctl`:
```powershell
eksctl create cluster `
  --name univance-cluster `
  --region ap-south-1 `
  --nodegroup-name univance-nodes `
  --node-type t3.medium `
  --nodes 2 `
  --managed
```

### 2. Deploy Manifests:
```powershell
kubectl apply -f k8s/
```

### 3. Get Public Load Balancer URL:
```powershell
kubectl get svc frontend
```
Copy the `EXTERNAL-IP` (e.g. `http://xxxx.elb.amazonaws.com`).

### 4. Delete Cluster After Demo (Essential for cost savings):
```powershell
eksctl delete cluster --name univance-cluster --region ap-south-1
```

---

## 📋 Faculty Demo Commands Cheat-Sheet

During your presentation, run these commands to impress your evaluators:

1. **Show Multi-Node Infrastructure**:
   ```bash
   kubectl get nodes -o wide
   ```
2. **Show Pod Distribution Across Nodes**:
   ```bash
   kubectl get pods -o wide
   ```
3. **Show Services and Ports**:
   ```bash
   kubectl get services
   ```
4. **Inspect Live Logs**:
   ```bash
   kubectl logs -f deployment/backend
   ```
