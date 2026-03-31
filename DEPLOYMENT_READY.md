# DEPLOYMENT READY! 🚀

## What's Been Created

### CI/CD Pipeline
```
.github/workflows/ci-cd.yml
├─ Tests (Backend & Frontend)
├─ Docker builds
├─ Image push to GHCR
└─ Security scanning
```

### Kubernetes & ArgoCD
```
k8s/
├─ deployment.yaml        (All K8s resources: Namespace, ConfigMap, Deployments, Services, HPA)
├─ argocd-app.yaml        (ArgoCD Application manifest)
└─ argocd-setup.yaml      (ArgoCD configuration)

Documentation/
├─ ARGOCD_AND_CI_SETUP.md (Complete setup guide)
├─ K8S_AND_ARGOCD_REFERENCE.md (Quick commands)
└─ PROJECT_STATUS.md      (Updated with CI/CD info)

Scripts/
├─ deploy.sh              (Linux/Mac one-command deploy)
└─ deploy.ps1             (Windows one-command deploy)
```

---

## Quick Start (Choose One)

### Option 1: Automated Deployment (Recommended)
```bash
# Linux/Mac
bash deploy.sh

# Windows
powershell .\deploy.ps1
```

### Option 2: Manual Deployment
```bash
# 1. Deploy Kubernetes
kubectl apply -f k8s/deployment.yaml

# 2. Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f k8s/argocd-setup.yaml

# 3. Deploy application
kubectl apply -f k8s/argocd-app.yaml

# 4. Access ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:80
# Open http://localhost:8080
```

---

## Architecture

```
GitHub Repository
        ↓
GitHub Actions (CI/CD)
    ├─ Test (pytest, vitest)
    ├─ Build (Docker)
    └─ Push (GHCR)
        ↓
ArgoCD (watches repo)
    ├─ Detects changes
    ├─ Pulls manifests
    └─ Syncs Kubernetes
        ↓
Kubernetes Cluster
    ├─ Backend Deployment (2+ replicas)
    ├─ Frontend Deployment (2+ replicas)
    ├─ Auto-scaling (HPA)
    └─ Services (ClusterIP, LoadBalancer)
```

---

## Deployment Flow

```
1. Developer commits to main/develop
   ↓
2. GitHub Actions runs:
   • Tests (Python & Node)
   • Docker builds (backend & frontend)
   • Pushes images to GHCR
   ↓
3. Developer updates k8s/deployment.yaml with new image tags
   (Or configure Image Updater for automatic updates)
   ↓
4. Push changes to GitHub
   ↓
5. ArgoCD detects changes within 3 minutes
   ↓
6. ArgoCD syncs cluster
   ↓
7. Kubernetes rolls out new pods
   ↓
8. New version live! 🎉
```

---

## Commands You'll Need

### GitHub Actions
```bash
# View workflows
gh run list --repo yourusername/trust-sense-fixed

# Manually trigger (if you configure workflow_dispatch)
gh workflow run ci-cd.yml
```

### Docker (Local Testing)
```bash
# Build locally
docker build -t trust-sense-backend:latest backend/

# Push to registry
docker tag trust-sense-backend:latest ghcr.io/yourusername/trust-sense-backend:latest
docker push ghcr.io/yourusername/trust-sense-backend:latest
```

### Kubernetes
```bash
# View all resources
kubectl get all -n trust-sense

# View pods
kubectl get pods -n trust-sense -w

# View logs
kubectl logs -n trust-sense -l app=trust-sense-backend -f

# Scale replicas
kubectl scale deployment trust-sense-backend --replicas=3 -n trust-sense
```

### ArgoCD
```bash
# Login
argocd login <ARGOCD_SERVER> --username admin

# List applications
argocd app list

# Get status
argocd app get trust-sense

# Manual sync
argocd app sync trust-sense

# View history
argocd app history trust-sense
```

---

## Configuration

### Update Environment Variables
Edit `k8s/deployment.yaml` ConfigMap section:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: trust-sense
data:
  SUPABASE_URL: "your-supabase-url"
  GOOGLE_CLIENT_ID: "your-google-client-id"
  # ... other variables
```

### Update Container Images
In `k8s/deployment.yaml`:

```yaml
containers:
- name: backend
  image: gcr.io/your-project/trust-sense-backend:main  # ← Update this
```

Or configure ArgoCD Image Updater for automatic updates from registry.

---

## Next Steps

1. **Before deploying:**
   - [ ] Change ArgoCD admin password
   - [ ] Configure GitHub repository access with ArgoCD
   - [ ] Update container image references in k8s/deployment.yaml
   - [ ] Set environment variables in ConfigMap
   - [ ] Configure database credentials as Kubernetes secrets

2. **After deployment:**
   - [ ] Verify all pods are running
   - [ ] Test backend API endpoints
   - [ ] Test frontend application
   - [ ] Check ArgoCD UI for sync status
   - [ ] Monitor logs for errors

3. **For production:**
   - [ ] Set up monitoring (Prometheus + Grafana)
   - [ ] Configure logging (ELK or Loki)
   - [ ] Setup alerts and notifications
   - [ ] Configure backup/disaster recovery
   - [ ] Enable HTTPS/TLS certificates
   - [ ] Setup secrets management (Sealed Secrets)

---

## Troubleshooting

### Pods not starting?
```bash
kubectl describe pod <pod-name> -n trust-sense
kubectl logs <pod-name> -n trust-sense
```

### ArgoCD not syncing?
```bash
argocd app get trust-sense
argocd app sync trust-sense
```

### Images not found?
```bash
# Check image registry
docker pull ghcr.io/yourusername/trust-sense-backend:main

# Update deployment
kubectl set image deployment/trust-sense-backend \
  trust-sense-backend=ghcr.io/yourusername/trust-sense-backend:main \
  -n trust-sense
```

For more details, see:
- `ARGOCD_AND_CI_SETUP.md` - Complete setup guide
- `K8S_AND_ARGOCD_REFERENCE.md` - Command reference
- `PROJECT_STATUS.md` - Project overview

---

**Status:** ✅ Ready for deployment!

**Last Updated:** March 3, 2026
