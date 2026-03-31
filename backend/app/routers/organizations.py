"""
Organization Management Router
Handles multi-tenant organization CRUD and member management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Organization, User, OrganizationMember
from app.schemas.schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationOut,
    AddMemberRequest,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("/", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new organization (current user becomes owner)"""
    # Check if slug already exists
    existing = db.query(Organization).filter(Organization.slug == org_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")

    org = Organization(
        name=org_data.name,
        slug=org_data.slug,
        owner_id=current_user.id,
        tier="free",
    )
    db.add(org)
    db.commit()

    # Add current user as owner
    member = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(member)
    db.commit()

    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get organization details (must be a member)"""
    # Check if user is member
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return org


@router.get("/my/organizations", response_model=list[OrganizationOut])
def get_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all organizations where current user is a member"""
    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    )
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return orgs


@router.put("/{org_id}", response_model=OrganizationOut)
def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update organization (owner/admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if user is owner
    if org.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can update organization")

    if org_data.name:
        org.name = org_data.name
    if org_data.tier:
        org.tier = org_data.tier

    db.commit()
    db.refresh(org)
    return org


@router.post("/{org_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(
    org_id: int,
    member_data: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a member to organization (admin/owner only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if current user is owner/admin
    current_membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
        .first()
    )
    if not current_membership or current_membership.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=403, detail="Only owner/admin can add members"
        )

    # Find user by email
    user = db.query(User).filter(User.email == member_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already a member
    existing = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = OrganizationMember(
        organization_id=org_id,
        user_id=user.id,
        role=member_data.role,
    )
    db.add(member)
    db.commit()

    return {"message": f"User {member_data.email} added to organization"}


@router.delete("/{org_id}/members/{user_id}")
def remove_member(
    org_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from organization (owner only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if current user is owner
    if org.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can remove members")

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Prevent owner from removing themselves
    if member.role == "owner" and member.user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Owner cannot remove themselves"
        )

    db.delete(member)
    db.commit()

    return {"message": "Member removed from organization"}
