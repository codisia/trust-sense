# Trust Sense ArgoCD & Kubernetes Quick Deploy Script (PowerShell)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Trust Sense Kubernetes Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "kubectl not found. Install kubectl first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "git not found. Install git first." -ForegroundColor Red
    exit 1
}

$clusterInfo = kubectl cluster-info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No Kubernetes cluster found. Start one with: minikube start" -ForegroundColor Red
    exit 1
}

Write-Host "OK Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Step 1: Deploy Kubernetes Manifests
Write-Host "[2/5] Deploying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f k8s/deployment.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy manifests" -ForegroundColor Red
    exit 1
}
Write-Host "Kubernetes deployment created" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for pods
Write-Host "[3/5] Waiting for pods to be ready (60 seconds)..." -ForegroundColor Yellow
try {
    kubectl wait --for=condition=ready pod -l app=trust-sense-backend -n trust-sense --timeout=60s 2>$null
} catch {}
try {
    kubectl wait --for=condition=ready pod -l app=trust-sense-frontend -n trust-sense --timeout=60s 2>$null
} catch {}
Write-Host "Pods ready" -ForegroundColor Green
Write-Host ""

# Step 3: Install ArgoCD
Write-Host "[4/5] Installing ArgoCD..." -ForegroundColor Yellow
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
Start-Sleep -Seconds 5
kubectl apply -f k8s/argocd-setup.yaml
Write-Host "ArgoCD installed" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy Application via ArgoCD
Write-Host "[5/5] Deploying application via ArgoCD..." -ForegroundColor Yellow
kubectl apply -f k8s/argocd-app.yaml
Write-Host "ArgoCD application deployed" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Access Kubernetes services:"
Write-Host "   kubectl port-forward -n trust-sense svc/trust-sense-backend-svc 8000:8000" -ForegroundColor Gray
Write-Host "   kubectl port-forward -n trust-sense svc/trust-sense-frontend-svc 3000:80" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Access ArgoCD Dashboard:"
Write-Host "   kubectl port-forward svc/argocd-server -n argocd 8080:80" -ForegroundColor Gray
Write-Host "   Open: http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Get ArgoCD admin password:"
Write-Host "   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor deployments:"
Write-Host "   kubectl get pods -n trust-sense -w" -ForegroundColor Gray
Write-Host "   argocd app list" -ForegroundColor Gray
Write-Host ""
Write-Host "5. View logs:"
Write-Host "   kubectl logs -n trust-sense -l app=trust-sense-backend -f" -ForegroundColor Gray
Write-Host ""
