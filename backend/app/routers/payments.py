from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.routers.audio_video import get_current_user
from pydantic import BaseModel
from typing import Optional, Union
import os
import random

router = APIRouter()

class PaymentRequest(BaseModel):
    amount: float
    currency: Union[str, None] = None

@router.post("/api/payments/local")
def local_payment(
    req: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return simple instructions for local/TND payments.
    If a non-TND currency is provided we convert using a fixed rate.
    """
    rate = float(os.getenv('TND_RATE', '3.0'))
    amt = req.amount
    if req.currency and req.currency.upper() in ['USD', 'EUR']:
        amt = amt * rate
    reference = f"TND-{int(random.random()*1e6)}"
    return {
        'status': 'created',
        'currency': 'TND',
        'amount_tnd': round(amt, 2),
        'reference': reference,
        'instructions': 'Send to eDinar account 123-456-789 using the reference.'
    }

@router.post("/api/payments/international")
def international_payment(
    req: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent using Stripe if available, else return stub."""
    amt = req.amount
    cur = req.currency or 'USD'
    stripe_key = os.getenv('STRIPE_SECRET_KEY')
    if stripe_key:
        try:
            import stripe
            stripe.api_key = stripe_key
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': cur.lower(),
                        'product_data': {'name': 'TrustSense Subscription'},
                        'unit_amount': int(amt * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/payment?success=1',
                cancel_url=os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/payment?cancelled=1',
            )
            return {'sessionId': session.id, 'url': session.url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {'status': 'stub', 'currency': cur, 'amount': amt, 'note': 'Stripe not configured. This is a placeholder.'}
