# Quick Reference: CI/CD & ArgoCD Commands

## GitHub Actions

### View Workflow Runs
```bash
# In browser: GitHub → Actions
# Or via CLI:
gh run list --repo yourusername/trust-sense-fixed
gh run view <RUN_ID>
```

### Trigger Manual Build
```bash
# Push to main
git push origin main

# Or use workflow_dispatch (if configured)
gh workflow run ci-cd.yml
```

---

## Docker Image Management

### Build Locally
```bash
# Backend
cd backend
docker build -t trust-sense-backend:latest .
docker tag trust-sense-backend:latest ghcr.io/yourusername/trust-sense-backend:latest
docker push ghcr.io/yourusername/trust-sense-backend:latest

# Frontend
cd frontend
docker build -t trust-sense-frontend:latest .
docker tag trust-sense-frontend:latest ghcr.io/yourusername/trust-sense-frontend:latest
docker push ghcr.io/yourusername/trust-sense-frontend:latest
```

### View Local Images
```bash
docker image ls | grep trust-sense
```

---

## Kubernetes Deployment

### Deploy Manifests
```bash
# Deploy all
kubectl apply -f k8s/deployment.yaml

# Or using the script
bash deploy.sh              # Linux/Mac
powershell .\deploy.ps1    # Windows
```

### Check Status
```bash
# List all resources in namespace
kubectl get all -n trust-sense

# Check deployment replicas
kubectl get deployment -n trust-sense

# Check pods
kubectl get pods -n trust-sense

# Check services
kubectl get svc -n trust-sense
```

### View Details
```bash
kubectl describe deployment trust-sense-backend -n trust-sense
kubectl describe pod <pod-name> -n trust-sense
kubectl logs <pod-name> -n trust-sense
```

### Scale Replicas
```bash
# Manual scaling
kubectl scale deployment trust-sense-backend --replicas=3 -n trust-sense

# Check HPA status
kubectl get hpa -n trust-sense
```

---

## ArgoCD

### Installation
```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f k8s/argocd-setup.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=argocd -n argocd --timeout=300s
```

### Access UI
```bash
# Port forward
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access: http://localhost:8080
# Username: admin
# Password: (from above)
```

### CLI Commands
```bash
# Login
argocd login <ARGOCD_SERVER> --username admin

# List applications
argocd app list

# Get application details
argocd app get trust-sense

# Sync application
argocd app sync trust-sense

# View application history
argocd app history trust-sense

# Rollback deployment
argocd app rollback trust-sense <REVISION>
```

### Add Repository
```bash
argocd repo add https://github.com/yourusername/trust-sense-fixed \
  --username <github_username> \
  --password <personal_access_token>

argocd repo list
```

---

## Troubleshooting

### Pod not starting
```bash
# Check events
kubectl describe pod <pod-name> -n trust-sense

# Check logs
kubectl logs <pod-name> -n trust-sense

# Check node resources
kubectl top nodes
kubectl top pods -n trust-sense
```

### Container image not found
```bash
# Verify image exists in registry
docker pull ghcr.io/yourusername/trust-sense-backend:main

# Update deployment with correct image tag
kubectl set image deployment/trust-sense-backend \
  trust-sense-backend=ghcr.io/yourusername/trust-sense-backend:main \
  -n trust-sense
```

### ArgoCD not syncing
```bash
# Check application status
argocd app get trust-sense

# Manual sync
argocd app sync trust-sense

# View recent deployments
kubectl rollout history deployment/trust-sense-backend -n trust-sense
```

### GitHub Actions failing
```bash
1. Check logs in GitHub Actions tab
2. Verify Python/Node versions in workflow
3. Check requirements.txt / package.json
4. Verify test files exist in paths
```

---

## Monitoring

### Check Pod Status
```bash
# Watch pods (will auto-update)
kubectl get pods -n trust-sense -w

# Check specific pod
kubectl get pod <pod-name> -n trust-sense -o wide
```

### View Logs
```bash
# Backend logs (last 50 lines, follow)
kubectl logs -n trust-sense -l app=trust-sense-backend -f --tail=50

# Frontend logs
kubectl logs -n trust-sense -l app=trust-sense-frontend -f --tail=50

# Previous pod logs (if crashed)
kubectl logs -n trust-sense <pod-name> --previous
```

### Resource Usage
```bash
kubectl top pods -n trust-sense
kubectl top nodes
```

### Events
```bash
kubectl get events -n trust-sense --sort-by='.lastTimestamp'
```

---

## Useful Aliases

Add to `.bashrc` or `.zshrc` or PowerShell profile:

```bash
# kubectl aliases
alias k='kubectl'
alias kgp='kubectl get pods -n trust-sense'
alias kgs='kubectl get svc -n trust-sense'
alias kl='kubectl logs -n trust-sense'
alias kdesc='kubectl describe -n trust-sense'
alias kw='kubectl get pods -n trust-sense -w'

# ArgoCD aliases
alias argoa='argocd app'
alias argos='argocd app sync'
```

---

## Common Workflows

### Deploy New Version
```bash
# 1. Push code to main
git push origin main

# 2. GitHub Actions runs tests & builds image
# Wait for GitHub Actions to complete

# 3. (Optional) Update image tag in k8s/deployment.yaml
# ArgoCD will auto-sync if automated is enabled

# 4. Monitor deployment
kubectl get pods -n trust-sense -w

# 5. Check logs
kubectl logs -n trust-sense -l app=trust-sense-backend -f
```

### Rollback Deployment
```bash
# View history
kubectl rollout history deployment/trust-sense-backend -n trust-sense

# Rollback to previous version
kubectl rollout undo deployment/trust-sense-backend -n trust-sense

# Or use ArgoCD
argocd app rollback trust-sense
```

### Scale Up for High Load
```bash
# Manual
kubectl scale deployment trust-sense-backend --replicas=5 -n trust-sense

# Or let HPA handle it (configured to scale 2-5 based on CPU)
kubectl get hpa -n trust-sense -w
```

---

**For detailed information, see:** `ARGOCD_AND_CI_SETUP.md`
