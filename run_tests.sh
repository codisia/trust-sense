#!/bin/bash
# Trust Sense Testing Suite

echo "🧪 Trust Sense - Complete Test Suite"
echo "======================================"
echo ""

# Backend Tests
echo "📝 Running Backend Tests..."
cd backend
python -m pytest test_main.py test_auth.py test_analysis.py test_database.py -v --cov=app --cov-report=html
BACKEND_EXIT=$?

# Frontend Tests
echo ""
echo "⚛️  Running Frontend Tests..."
cd ../frontend
npm run test:coverage
FRONTEND_EXIT=$?

echo ""
echo "======================================"
if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
