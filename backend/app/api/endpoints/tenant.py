from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantBrandingUpdate, TenantMemberInvite
from app.schemas.user import UserResponse
from app.api.deps import get_current_tenant, get_current_user, MOCK_USER_DICT

router = APIRouter()

# Static mock in-memory members list for development testing when DB is offline
MOCK_MEMBERS_LIST = [
    {
        "id": 1,
        "email": "dev@propintel.ai",
        "full_name": "Developer User",
        "role": "admin",
        "is_active": True,
        "mobile_number": "+65 9123 4567",
        "tenant_id": "propintel",
        "created_at": "2026-06-12T00:00:00Z",
        "updated_at": "2026-06-12T00:00:00Z"
    },
    {
        "id": 2,
        "email": "agent.smith@propintel.ai",
        "full_name": "Smith Agent",
        "role": "agent",
        "is_active": True,
        "mobile_number": "+65 9999 8888",
        "tenant_id": "propintel",
        "created_at": "2026-06-12T00:00:00Z",
        "updated_at": "2026-06-12T00:00:00Z"
    }
]

@router.post("/register", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def register_tenant(tenant_in: TenantCreate, db: Session = Depends(get_db)):
    """
    Onboard a new agency/tenant organization.
    """
    try:
        # Check if tenant exists
        existing = db.query(Tenant).filter(Tenant.id == tenant_in.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant ID '{tenant_in.id}' is already registered."
            )
        
        new_tenant = Tenant(
            id=tenant_in.id.lower().strip().replace(" ", "-"),
            name=tenant_in.name,
            domain=tenant_in.domain,
            logo_url=tenant_in.logo_url,
            primary_color=tenant_in.primary_color or "#4338ca"
        )
        db.add(new_tenant)
        db.commit()
        db.refresh(new_tenant)
        return new_tenant
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database tenant registration failed, using mock return: {e}")
        # Return mock tenant object
        import datetime
        return Tenant(
            id=tenant_in.id.lower().strip().replace(" ", "-"),
            name=tenant_in.name,
            domain=tenant_in.domain,
            logo_url=tenant_in.logo_url,
            primary_color=tenant_in.primary_color or "#4338ca",
            is_active=True,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )


@router.get("/me", response_model=TenantResponse)
def get_my_tenant(current_tenant: Tenant = Depends(get_current_tenant)):
    """
    Fetch current logged-in tenant profile (for branding/theme layout loading).
    """
    return current_tenant


@router.put("/branding", response_model=TenantResponse)
def update_branding(
    branding: TenantBrandingUpdate,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Update tenant primary color and branding settings (Admin-only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Only organization admins can edit branding."
        )
        
    try:
        # Attempt to find database record
        tenant_db = db.query(Tenant).filter(Tenant.id == current_tenant.id).first()
        if tenant_db:
            if branding.logo_url is not None:
                tenant_db.logo_url = branding.logo_url
            if branding.primary_color is not None:
                tenant_db.primary_color = branding.primary_color
            db.commit()
            db.refresh(tenant_db)
            return tenant_db
    except Exception as e:
        print(f"Database update branding failed: {e}")
        
    # Mock fallback
    if branding.logo_url is not None:
        current_tenant.logo_url = branding.logo_url
    if branding.primary_color is not None:
        current_tenant.primary_color = branding.primary_color
    return current_tenant


@router.get("/members", response_model=List[UserResponse])
def list_members(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    List team members of the active organization tenant.
    """
    try:
        # Return users matching tenant_id
        members = db.query(User).filter(User.tenant_id == current_tenant.id).all()
        if members:
            return members
    except Exception as e:
        print(f"Database query members failed: {e}")
        
    # Mock fallback: return list filtered by current tenant context
    import datetime
    out = []
    for m in MOCK_MEMBERS_LIST:
        user_dict = dict(m)
        user_dict["tenant_id"] = current_tenant.id
        user_dict["created_at"] = datetime.datetime.utcnow()
        user_dict["updated_at"] = datetime.datetime.utcnow()
        out.append(User(**user_dict))
    return out


@router.post("/members/invite", response_model=UserResponse)
def invite_member(
    invite: TenantMemberInvite,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Invite/provision a new agent member to the organization tenant.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Only organization admins can invite team members."
        )
        
    import datetime
    
    try:
        # Create detached user or insert in db
        new_member = User(
            email=invite.email,
            full_name=invite.full_name,
            role=invite.role or "agent",
            hashed_password="placeholder_invite_pwd_123",
            tenant_id=current_tenant.id,
            is_active=True
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        return new_member
    except Exception as e:
        print(f"Database invite failed: {e}")
        
    # Mock fallback success
    new_member_dict = {
        "id": 100 + len(MOCK_MEMBERS_LIST),
        "email": invite.email,
        "full_name": invite.full_name,
        "role": invite.role or "agent",
        "is_active": True,
        "mobile_number": None,
        "tenant_id": current_tenant.id,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    MOCK_MEMBERS_LIST.append(new_member_dict)
    
    return User(**new_member_dict)


@router.delete("/members/{user_id}")
def remove_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an agent member from the organization tenant (Admin-only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Only organization admins can remove members."
        )
        
    try:
        user_to_delete = db.query(User).filter(User.id == user_id, User.tenant_id == current_tenant.id).first()
        if user_to_delete:
            db.delete(user_to_delete)
            db.commit()
            return {"message": f"Successfully removed user id {user_id}."}
    except Exception as e:
        print(f"Database remove member failed: {e}")
        
    # Mock fallback
    for index, m in enumerate(MOCK_MEMBERS_LIST):
        if m["id"] == user_id:
            MOCK_MEMBERS_LIST.pop(index)
            return {"message": f"Successfully removed user id {user_id} from mock list."}
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Member not found."
    )
