#!/bin/bash

# Trust Sense ArgoCD & Kubernetes Quick Deploy Script

set -e

echo "================================"
echo "Trust Sense Kubernetes Deploy"
echo "================================"
echo ""

# Check prerequisites
echo "[1/5] Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl not found. Install kubectl first."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "git not found. Install git first."; exit 1; }

kubectl cluster-info >/dev/null 2>&1 || { echo "No Kubernetes cluster found. Start one with: minikube start"; exit 1; }

echo "✓ Prerequisites OK"
echo ""

# Step 1: Deploy Kubernetes Manifests
echo "[2/5] Deploying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml
echo "✓ Kubernetes deployment created"
echo ""

# Step 2: Wait for pods
echo "[3/5] Waiting for pods to be ready (60 seconds)..."
kubectl wait --for=condition=ready pod -l app=trust-sense-backend -n trust-sense --timeout=60s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=trust-sense-frontend -n trust-sense --timeout=60s 2>/dev/null || true
echo "✓ Pods ready"
echo ""

# Step 3: Install ArgoCD
echo "[4/5] Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f k8s/argocd-setup.yaml
echo "✓ ArgoCD installed"
echo ""

# Step 4: Deploy Application via ArgoCD
echo "[5/5] Deploying application via ArgoCD..."
kubectl apply -f k8s/argocd-app.yaml
echo "✓ ArgoCD application deployed"
echo ""

# Display summary
echo "================================"
echo "✓ Deployment Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Access Kubernetes Dashboard:"
echo "   kubectl port-forward -n trust-sense svc/trust-sense-backend-svc 8000:8000 &"
echo "   kubectl port-forward -n trust-sense svc/trust-sense-frontend-svc 3000:80 &"
echo ""
echo "2. Access ArgoCD Dashboard:"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:80 &"
echo "   http://localhost:8080"
echo ""
echo "3. Get ArgoCD admin password:"
echo "   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d"
echo ""
echo "4. Monitor deployments:"
echo "   kubectl get pods -n trust-sense -w"
echo "   argocd app get trust-sense"
echo ""
echo "5. View logs:"
echo "   kubectl logs -n trust-sense -l app=trust-sense-backend -f"
echo ""
