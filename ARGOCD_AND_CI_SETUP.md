# ArgoCD & CI/CD Setup Guide

## Overview

This document covers the complete setup of:
- **GitHub Actions CI/CD**: Automated testing and Docker image builds
- **ArgoCD**: GitOps continuous deployment to Kubernetes
- **Kubernetes**: Container orchestration

---

## Phase 1: GitHub Actions CI/CD Setup

### 1.1 What's Configured

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

#### Automated Testing
- ✅ Backend: Python 3.10 & 3.11 test matrix with pytest
- ✅ Frontend: Node 18.x & 20.x with vitest
- ✅ Coverage reports uploaded to Codecov

#### Container Builds
- ✅ Backend: Docker image built and pushed to GHCR
- ✅ Frontend: Docker image built and pushed to GHCR
- ✅ Automatic tagging: branch, version, and short SHA

#### Security
- ✅ Trivy vulnerability scanning
- ✅ Results uploaded to GitHub Security tab

#### Triggers
- ✅ On push to `main` or `develop`
- ✅ On pull requests to `main` or `develop`
- ✅ Container builds only on push (not PR)

### 1.2 Required Secrets

Add these to your GitHub repository settings under **Settings → Secrets and variables → Actions**:

None required! The workflow uses:
- `GITHUB_TOKEN` (automatic)
- `secrets.GITHUB_TOKEN` (automatic)

Optional for enhanced monitoring:
- `CODECOV_TOKEN` - For Codecov integration
- `DOCKER_USERNAME` / `DOCKER_PASSWORD` - For Docker Hub (if not using GHCR)

### 1.3 Verification

1. Push code to GitHub
2. Go to **Actions** tab
3. Monitor workflow execution
4. Check built images at: `ghcr.io/yourusername/trust-sense-*`

---

## Phase 2: Kubernetes Deployment Setup

### 2.1 Prerequisites

```bash
# Install Docker
# Install kubectl
# Set up a Kubernetes cluster (local: minikube/kind, cloud: GKE/EKS/AKS)

kubectl cluster-info
```

### 2.2 Deploy to Kubernetes

```bash
# 1. Create namespace and deploy
kubectl apply -f k8s/deployment.yaml

# 2. Verify deployments
kubectl get deployment -n trust-sense
kubectl get pods -n trust-sense
kubectl get svc -n trust-sense

# 3. Check pod logs
kubectl logs -n trust-sense -l app=trust-sense-backend
kubectl logs -n trust-sense -l app=trust-sense-frontend

# 4. Access services
kubectl port-forward -n trust-sense svc/trust-sense-backend-svc 8000:8000
kubectl port-forward -n trust-sense svc/trust-sense-frontend-svc 3000:80
```

### 2.3 Deployment Structure

**File:** `k8s/deployment.yaml` contains:

| Resource | Purpose |
|----------|---------|
| Namespace | `trust-sense` - isolated environment |
| ConfigMap | Backend environment variables |
| Deployment | Backend replicas (2, auto-scale 2-5) |
| Deployment | Frontend replicas (2, auto-scale 2-5) |
| Service | Backend (ClusterIP:8000) |
| Service | Frontend (LoadBalancer:80) |
| HPA | Horizontal Pod Autoscaler for both |

### 2.4 Update Container Images

Edit `k8s/deployment.yaml`:

```yaml
containers:
- name: backend
  image: gcr.io/YOUR_PROJECT/trust-sense-backend:TAG  # ← Change this
```

Or use ArgoCD to manage updates automatically (see Phase 3).

---

## Phase 3: ArgoCD Setup

### 3.1 Install ArgoCD

```bash
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD (latest version)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Install ArgoCD configuration
kubectl apply -f k8s/argocd-setup.yaml

# Wait for all ArgoCD pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=argocd -n argocd --timeout=300s
```

### 3.2 Access ArgoCD UI

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port-forward to ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Access: http://localhost:8080
# Username: admin
# Password: (from above)

# Or expose via LoadBalancer
kubectl get svc argocd-server -n argocd
# Use the EXTERNAL-IP:443 to access
```

### 3.3 Deploy Trust Sense Application

```bash
# Deploy the Trust Sense application
kubectl apply -f k8s/argocd-app.yaml

# Monitor in ArgoCD UI or CLI
argocd app list
argocd app get trust-sense
argocd app sync trust-sense  # Manual sync if needed
```

### 3.4 Configure Automatic Sync

Edit `k8s/argocd-app.yaml`:

```yaml
syncPolicy:
  automated:
    prune: true      # Delete removed resources
    selfHeal: true   # Resync if cluster differs
```

With these settings:
- ✅ Automatic sync on git changes
- ✅ ArgoCD watches repository for changes
- ✅ Pulls new images automatically
- ✅ Reconciles cluster state every 3 minutes

---

## Phase 4: Connect GitHub to ArgoCD

### 4.1 Generate GitHub Token

```bash
# In GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
# Generate new token with:
# - repo (full control of private repositories)
# - admin:public_key (SSH)
```

### 4.2 Connect Repository

```bash
# Login to ArgoCD CLI
argocd login <ARGOCD_SERVER> --username admin

# Add your GitHub repository
argocd repo add https://github.com/yourusername/trust-sense-fixed \
  --username <github_username> \
  --password <personal_access_token>

# Verify connection
argocd repo list
```

### 4.3 Configure Repository Source

Edit `k8s/argocd-app.yaml`:

```yaml
source:
  repoURL: https://github.com/yourusername/trust-sense-fixed  # ← Your repo
  targetRevision: main
  path: k8s
```

---

## Phase 5: GitOps Workflow

### 5.1 Complete Deployment Flow

```
1. Developer pushes code to main branch
   ↓
2. GitHub Actions CI runs (tests)
   ↓
3. If tests pass, build Docker images
   ↓
4. Push images to GHCR with new tag
   ↓
5. Update k8s/deployment.yaml with new image tag (manual or automated)
   ↓
6. Push changes to GitHub
   ↓
7. ArgoCD detects changes in repository
   ↓
8. ArgoCD pulls new manifests
   ↓
9. ArgoCD syncs cluster with git state
   ↓
10. Kubernetes rolls out new pods
```

### 5.2 Manual Image Updates

```bash
# After GitHub Actions builds new image
# Update k8s/deployment.yaml:
# image: gcr.io/trust-sense/trust-sense-backend:main-abc1234

# Push to GitHub
git add k8s/deployment.yaml
git commit -m "chore: update container images"
git push origin main

# ArgoCD will automatically sync within 3 minutes
```

### 5.3 Automated Image Updates (Optional)

For automatic image scanning and updates, install:

```bash
# Install Dependabot or Renovate for automated PRs
# Or use ArgoCD Image Updater:

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
```

---

## Troubleshooting

### Container Images Not Found
```bash
# Verify images exist
docker image ls
# Push images manually:
docker tag trust-sense-backend ghcr.io/yourusername/trust-sense-backend:main
docker push ghcr.io/yourusername/trust-sense-backend:main
```

### ArgoCD Not Syncing
```bash
# Check application status
argocd app get trust-sense

# Manual sync
argocd app sync trust-sense

# Check sync options
kubectl describe app trust-sense -n argocd
```

### Pods Not Starting
```bash
# Check events
kubectl describe pod <pod-name> -n trust-sense

# Check logs
kubectl logs -n trust-sense <pod-name>

# Check resource requests
kubectl top nodes
kubectl top pods -n trust-sense
```

### GitHub Actions Failing
```bash
1. Check GitHub Actions logs in repository
2. Verify Python/Node versions match workflow
3. Ensure all dependencies are in requirements.txt / package.json
4. Check for secrets/credentials issues
```

---

## Monitoring & Alerts

### 4.1 View Application Status

```bash
argocd app list
argocd app get trust-sense
argocd app history trust-sense
```

### 4.2 Monitor Kubernetes

```bash
# Watch pod status
kubectl get pods -n trust-sense -w

# Check resource usage
kubectl top pods -n trust-sense

# View events
kubectl get events -n trust-sense --sort-by='.lastTimestamp'
```

### 4.3 View Logs

```bash
# Backend logs
kubectl logs -n trust-sense -l app=trust-sense-backend -f

# Frontend logs
kubectl logs -n trust-sense -l app=trust-sense-frontend -f

# Last pod's logs
kubectl logs -n trust-sense -l app=trust-sense-backend -f --previous
```

---

## Configuration References

### Environment Variables (ConfigMap)
- Located in: `k8s/deployment.yaml` under ConfigMap
- Update values before deploying
- ArgoCD will automatically re-apply changes

### Secrets Management
For sensitive data (database passwords, API keys):

```bash
# Create secret
kubectl create secret generic trust-sense-secrets \
  --from-literal=db-password=mypassword \
  -n trust-sense

# Reference in deployment
valueFrom:
  secretKeyRef:
    name: trust-sense-secrets
    key: db-password
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment trust-sense-backend --replicas=3 -n trust-sense

# Monitor HPA
kubectl get hpa -n trust-sense -w
```

---

## Next Steps

1. ✅ GitHub Actions: Tests and builds containers automatically
2. ✅ ArgoCD: Deploys and manages Kubernetes cluster
3. ✅ GitOps: Single source of truth is your Git repository
4. ⏭️ Set up monitoring (Prometheus + Grafana)
5. ⏭️ Configure logging (ELK stack or Loki)
6. ⏭️ Add secret management (Sealed Secrets / External Secrets)
7. ⏭️ Setup alerts (ArgoCD Notifications)

---

## Quick Commands

```bash
# View everything
kubectl get all -n trust-sense

# ArgoCD status
argocd app list
argocd app sync trust-sense

# View recent deployments
kubectl rollout history deployment/trust-sense-backend -n trust-sense

# Rollback if needed
kubectl rollout undo deployment/trust-sense-backend -n trust-sense

# Restart pods
kubectl rollout restart deployment/trust-sense-backend -n trust-sense
```

---

**Last Updated:** March 3, 2026
