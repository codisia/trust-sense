# TRUST SENSE Platform - Production Deployment Guide

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Production Environment](#production-environment)
4. [Database & Cache Setup](#database--cache-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- PostgreSQL 15+ (local or Docker)
- Redis 5.0+ (optional, for caching)
- Docker & Docker Compose (for full stack)
- Git

### Step 1: Clone & Environment Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/trust-sense.git
cd trust-sense

# Create Python virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Create `backend/.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/trust_sense_dev
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Supabase (Auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis (Cache)
REDIS_URL=redis://localhost:6379/0
REDIS_TTL=3600

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Features
ENABLE_AI_CACHING=true
MAX_CONTENT_SIZE=10485760  # 10MB
REQUEST_TIMEOUT_SECONDS=30

# External APIs (for production)
GOOGLE_CLOUD_KEY=your-google-cloud-key
OPENAI_API_KEY=your-openai-key
AZURE_SPEECH_KEY=your-azure-key
```

### Step 3: Database Setup

```bash
# Create database
createdb trust_sense_dev

# Run migrations (using Alembic)
cd backend
alembic upgrade head

# Seed initial data (optional)
python -c "from app.core.database import init_db; init_db()"
```

### Step 4: Run Development Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API Explorer: http://localhost:8000/docs
# Alternative API docs: http://localhost:8000/redoc
```

### Step 5: Run Frontend (in separate terminal)

```bash
cd frontend
npm install
npm run dev

# Frontend: http://localhost:5173
```

---

## Docker Deployment

### Single Container (Backend Only)

```bash
# Build image
cd backend
docker build -t trust-sense-api:latest .

# Run container
docker run -d \
  --name trust-sense-api \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:password@localhost:5432/trust_sense \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_KEY=your-key \
  -e SECRET_KEY=your-secret \
  trust-sense-api:latest

# View logs
docker logs -f trust-sense-api

# Health check
curl http://localhost:8000/health
```

### Full Stack with Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: trust-sense-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
      POSTGRES_DB: trust_sense
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: trust-sense-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: trust-sense-api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-password}@postgres:5432/trust_sense
      REDIS_URL: redis://redis:6379/0
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_KEY: ${SUPABASE_KEY}
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: trust-sense-frontend
    depends_on:
      - api
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:

networks:
  default:
    name: trust-sense-network
```

Deploy with Docker Compose:

```bash
# Create .env from template
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

---

## Production Environment

### AWS Deployment (Recommended)

#### Using ECS (Elastic Container Service)

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name trust-sense-api

# 2. Build and push image
cd backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t trust-sense-api:latest .
docker tag trust-sense-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/trust-sense-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/trust-sense-api:latest

# 3. Create CloudFormation stack for RDS PostgreSQL
aws cloudformation create-stack \
  --stack-name trust-sense-db \
  --template-body file://cloudformation/rds-postgres.yml \
  --parameters ParameterKey=DBInstanceClass,ParameterValue=db.t3.medium

# 4. Create ECS Cluster and Task Definition
aws ecs create-cluster --cluster-name trust-sense

# Create task definition (see cloudformation/ecs-task-def.json)
aws ecs register-task-definition --cli-input-json file://cloudformation/ecs-task-def.json

# 5. Create ECS Service
aws ecs create-service \
  --cluster trust-sense \
  --service-name trust-sense-api \
  --task-definition trust-sense-api:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Using App Runner (Simpler Alternative)

```bash
# 1. Push to ECR (same as above)
# 2. Create App Runner service
aws apprunner create-service \
  --service-name trust-sense-api \
  --source-configuration RepositoryType=ECR,ImageRepository={ImageIdentifier=<account>.dkr.ecr.us-east-1.amazonaws.com/trust-sense-api:latest,RepositoryType=ECR} \
  --instance-configuration InstanceRoleArn=arn:aws:iam::<account>:role/AppRunnerServiceRole
```

### Google Cloud Run

```bash
# 1. Configure Cloud Run
gcloud config set project YOUR_PROJECT_ID

# 2. Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/trust-sense-api:latest backend/

# 3. Deploy to Cloud Run
gcloud run deploy trust-sense-api \
  --image gcr.io/YOUR_PROJECT_ID/trust-sense-api:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgresql://...,SUPABASE_URL=...,SUPABASE_KEY=... \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 100
```

### Kubernetes Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trust-sense-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trust-sense-api
  template:
    metadata:
      labels:
        app: trust-sense-api
    spec:
      containers:
      - name: api
        image: your-registry/trust-sense-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: trust-sense-secrets
              key: database-url
        - name: SUPABASE_URL
          valueFrom:
            configMapKeyRef:
              name: trust-sense-config
              key: supabase-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: trust-sense-api
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: trust-sense-api
```

Deploy:

```bash
# Create namespace
kubectl create namespace trust-sense

# Create secrets (create these separately!)
kubectl create secret generic trust-sense-secrets \
  --from-literal=database-url=postgresql://... \
  -n trust-sense

# Deploy
kubectl apply -f k8s/deployment.yaml -n trust-sense

# Check status
kubectl get deployments -n trust-sense
kubectl get pods -n trust-sense
kubectl logs -f deployment/trust-sense-api -n trust-sense
```

---

## Database & Cache Setup

### PostgreSQL Optimization

```sql
-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create indexes for common queries
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_trust_score ON analyses(trust_score);
CREATE INDEX idx_analyses_risk_level ON analyses(risk_level);

-- Full-text search indexes
CREATE INDEX idx_analyses_content_fts ON analyses 
  USING GIN(to_tsvector('english', content));

-- Partitioning (for large deployments)
CREATE TABLE analyses_2024_q1 PARTITION OF analyses
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Redis Configuration

For production Redis:

```bash
# docker-compose.yml update for production Redis
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  volumes:
    - redis_data:/data
  ports:
    - "6379:6379"

volumes:
  redis_data:
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Already configured in `.github/workflows/main.yml` with:

1. **Code Quality** (flake8, isort, black, mypy)
2. **Testing** (pytest with coverage)
3. **Security Scanning** (Trivy)
4. **Docker Build & Push**
5. **Integration Tests**
6. **Staging Deployment**
7. **Production Deployment** (on tags)

### Manual Deployment Trigger

```bash
# Tag a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions automatically deploys to production
```

---

## Security Hardening

### SSL/TLS Configuration

```nginx
# Nginx reverse proxy (optional)
server {
    listen 443 ssl http2;
    server_name api.trustsense.com;

    ssl_certificate /etc/letsencrypt/live/api.trustsense.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trustsense.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables Protection

Never commit `.env` files:

```bash
# .gitignore
.env
.env.local
.env.*.local
secrets/
credentials/
```

### Secrets Management

Use managed secret services:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name trust-sense/prod/database-url \
  --secret-string "postgresql://user:password@host:5432/db"

# Retrieve in application
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='trust-sense/prod/database-url')
```

---

## Monitoring & Logging

### Application Metrics

Add Prometheus monitoring:

```python
# In backend/app/main.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import Response

# Metrics
request_count = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint'])
request_duration = Histogram('api_request_duration_seconds', 'Request duration')
analysis_duration = Histogram('analysis_duration_seconds', 'Analysis duration', ['type'])

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")

@app.middleware("http")
async def add_metrics(request, call_next):
    with request_duration.time():
        response = await call_next(request)
    request_count.labels(method=request.method, endpoint=request.url.path).inc()
    return response
```

### Log Aggregation

Using ELK Stack or CloudWatch:

```python
# Structured logging
import structlog
logger = structlog.get_logger()

logger.info("analysis_completed", 
    analysis_id=analysis_id,
    trust_score=score,
    risk_level=level,
    duration_ms=duration)
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection timeout**
```bash
# Solution 1: Check database is running
docker-compose ps postgres

# Solution 2: Verify connection string
python -c "import sqlalchemy; engine = sqlalchemy.create_engine('$DATABASE_URL'); engine.execute('SELECT 1')"

# Solution 3: Check network
docker network ls
docker network inspect trust-sense-network
```

**Issue: Redis connection refused**
```bash
# Solution: Ensure Redis is running and accessible
redis-cli -h localhost ping
# Should return: PONG
```

**Issue: API returns 502 Bad Gateway**
```bash
# Solution: Check backend health
curl http://localhost:8000/health

# View logs
docker-compose logs api
# Look for error messages

# Restart service
docker-compose restart api
```

**Issue: Out of memory**
```bash
# Solution: Increase limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 4G
```

### Performance Tuning

```python
# Enable query caching
from app.core.database import get_db

KEY_EXPIRATION = 3600  # 1 hour

async def cached_query(key: str, query_func):
    # Check Redis first
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    
    # Execute query
    result = await query_func()
    
    # Store in Redis
    await redis.setex(key, KEY_EXPIRATION, json.dumps(result))
    return result
```

---

## Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review database size and optimize queries
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Full backup of database, disaster recovery test

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump -U postgres trust_sense > backup-$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * pg_dump -U postgres trust_sense | gzip > /backups/trust_sense-$(date +\%Y\%m\%d).sql.gz

# Restore from backup
psql -U postgres trust_sense < backup-20240305.sql
```

---

## Support & Resources

- **Documentation**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Issues**: GitHub Issues
- **Community**: Discussions section
- **Email**: support@trustsense.com

---

**Last Updated**: March 5, 2026
**Version**: 2.0.0
