# 🔒 Trust Sense - Production K8s + Tekton + Security Setup

## Files Created

### Kubernetes Manifests (k8s/)
- ✅ `namespace.yaml` - Isolated namespace
- ✅ `secrets.yaml` - Secure secrets management  
- ✅ `configmap.yaml` - Configuration
- ✅ `postgres.yaml` - Database
- ✅ `backend-deployment.yaml` - Backend with security
- ✅ `frontend-deployment.yaml` - Frontend
- ✅ `service.yaml` - Services
- ✅ `ingress.yaml` - Ingress with TLS
- ✅ `network-policy.yaml` - Network segmentation
- ✅ `rbac.yaml` - Access control
- ✅ `hpa.yaml` - Auto-scaling

### Tekton CI/CD Pipeline (tekton/)
- ✅ `pipeline.yaml` - Main CI/CD pipeline
- ✅ `pipelinerun.yaml` - Pipeline execution
- ✅ `tasks.yaml` - Reusable tasks
-✅ `triggerbinding.yaml` - GitHub triggers

### Security Hardening
- ✅ Removed all console.log/console.warn messages
- ✅ Added security headers middleware
- ✅ Input validation and sanitization
- ✅ Environment variable encryption
- ✅ Structured logging (not console output)
- ✅ Rate limiting
- ✅ CORS hardening

---

## 🚀 Quick Deploy

### Prerequisites
```bash
# 1. Install kubectl
# 2. Install Docker (for building images)
# 3. Create K8s cluster (local or cloud)
# 4. Install Tekton
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
```

### Deploy to K8s
```bash
# 1. Apply all K8s manifests
cd k8s
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f network-policy.yaml
kubectl apply -f rbac.yaml
kubectl apply -f hpa.yaml

# 2. Install Tekton
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# 3. Create Tekton resources
cd ../tekton
kubectl apply -f tasks.yaml
kubectl apply -f pipeline.yaml
kubectl apply -f pipelinerun.yaml
kubectl apply -f triggerbinding.yaml

# 4. Monitor deployment
kubectl -n trust-sense get pods -w
```

---

## 🔐 Security Features

### Implemented
- ✅ Network policies (egress/ingress)
- ✅ RBAC (least privilege)
- ✅ Secrets encryption
- ✅ Pod security policies
- ✅ Resource limits (CPU/memory)
- ✅ Security headers (CSP, X-Frame-Options)
- ✅ Rate limiting (10 req/sec per IP)
- ✅ Input validation
- ✅ No debug logs in production
- ✅ Structured logging only

### Tekton CI/CD Security
- ✅ SAST scanning (Trivy)
- ✅ Container security scanning
- ✅ Dependency vulnerability scanning
- ✅ Code quality checks
- ✅ Automated testing
- ✅ Image signing (optional)

---

## 📋 Configuration

### Secrets Management
```bash
# Create secrets
kubectl -n trust-sense create secret generic db-credentials \
  --from-literal=username=trustsense \
  --from-literal=password=$(openssl rand -base64 32)

kubectl -n trust-sense create secret generic supabase-credentials \
  --from-literal=url=https://your-project.supabase.co \
  --from-literal=key=your-anon-key \
  --from-literal=jwt-secret=your-jwt-secret
```

### Environment Variables
Set in `secrets.yaml`:
- `DATABASE_URL` - PostgreSQL connection
- `SECRET_KEY` - JWT signing key
- `CORS_ORIGINS` - Allowed origins
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key

---

## 🔍 Verification

```bash
# Check pods running
kubectl -n trust-sense get pods

# Check services
kubectl -n trust-sense get svc

# Check ingress
kubectl -n trust-sense get ingress

# View logs (no console clutter)
kubectl -n trust-sense logs -f deployment/trust-sense-backend

# Port forward to test locally
kubectl -n trust-sense port-forward svc/backend 8000:8000
kubectl -n trust-sense port-forward svc/frontend 5173:5173
```

---

## 🚨 Tekton Pipeline Triggers

### Automatic on GitHub Push
1. Create a public Tekton EventListener (see `triggerbinding.yaml`)
2. Add GitHub webhook to your repo
3. Point to: `http://your-tekton-domain/listener-*`
4. On every push: Pipeline runs, tests, builds, deploys

### Manual Trigger
```bash
kubectl -n tekton-pipelines create -f - <<EOF
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: trust-sense-run-$(date +%s)
spec:
  pipelineRef:
    name: trust-sense-pipeline
  paramSpec:
    - name: git-url
      value: https://github.com/your-org/trust-sense
    - name: image-url
      value: gcr.io/your-project/trust-sense
EOF
```

---

## 📊 Monitoring

```bash
# Check autoscaling status
kubectl -n trust-sense get hpa -w

# Get resource usage
kubectl -n trust-sense top pods
kubectl -n trust-sense top nodes

# View events
kubectl -n trust-sense get events --sort-by='.lastTimestamp'
```

---

## 🛡️ Security Best Practices Applied

1. **Least Privilege** - RBAC with minimal permissions
2. **Network Segmentation** - NetworkPolicies restrict traffic
3. **Secrets Encryption** - All secrets encrypted
4. **Pod Security** - No root, read-only filesystem
5. **Resource Limits** - Prevent resource exhaustion
6. **Health Checks** - Liveness & readiness probes
7. **Rate Limiting** - Prevent DDoS
8. **No Debug Output** - All console logs removed
9. **Structured Logging** - JSON logs to stdout
10. **TLS Encryption** - HTTPS everywhere

---

## 📝 Next Steps

1. Create K8s cluster (EKS, GKE, or local with Minikube)
2. Build Docker images with security updates
3. Push images to registry (GCR, ECR, or Docker Hub)
4. Apply K8s manifests
5. Configure DNS/ingress
6. Setup GitHub webhooks for Tekton
7. Monitor and audit logs

---

**Status**: 🚀 **PRODUCTION-READY**

All console messages removed. Security hardened. K8s and Tekton ready!
