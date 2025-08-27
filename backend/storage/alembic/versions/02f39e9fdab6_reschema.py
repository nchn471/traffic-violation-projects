"""Reschema

Revision ID: 02f39e9fdab6
Revises: 
Create Date: 2025-06-13 04:56:24.804643

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02f39e9fdab6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Tạo bảng không có foreign key trước
    op.create_table(
        'cameras',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('folder_path', sa.String(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'officers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('hash_password', sa.String(), nullable=False),
        sa.Column('avatar_path', sa.String(), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
    )

    op.create_table(
        'ticket_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('ticket_id', sa.UUID(), nullable=False),
        sa.Column('officer_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('change_type', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'violation_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('violation_id', sa.UUID(), nullable=False),
        sa.Column('officer_id', sa.UUID(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), nullable=True),
        sa.Column('violation_type', sa.String(length=50), nullable=False),
        sa.Column('license_plate', sa.String(length=20), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('frame_image_path', sa.String(), nullable=False),
        sa.Column('vehicle_image_path', sa.String(), nullable=False),
        sa.Column('lp_image_path', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('change_type', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'violations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('camera_id', sa.UUID(), nullable=False),
        sa.Column('version_id', sa.UUID(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), nullable=True),
        sa.Column('violation_type', sa.String(length=50), nullable=False),
        sa.Column('license_plate', sa.String(length=20), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('frame_image_path', sa.String(), nullable=False),
        sa.Column('vehicle_image_path', sa.String(), nullable=False),
        sa.Column('lp_image_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version_id'),
    )

    op.create_table(
        'tickets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('violation_id', sa.UUID(), nullable=False),
        sa.Column('officer_id', sa.UUID(), nullable=False),
        sa.Column('version_id', sa.UUID(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('violation_id'),
    )

    # 2. Thêm foreign key sau cùng để tránh vòng lặp
    op.create_foreign_key(None, 'ticket_versions', 'tickets', ['ticket_id'], ['id'])
    op.create_foreign_key(None, 'ticket_versions', 'officers', ['officer_id'], ['id'])
    op.create_foreign_key(None, 'tickets', 'violations', ['violation_id'], ['id'])
    op.create_foreign_key(None, 'tickets', 'officers', ['officer_id'], ['id'])
    op.create_foreign_key(None, 'tickets', 'ticket_versions', ['version_id'], ['id'])
    op.create_foreign_key(None, 'violation_versions', 'officers', ['officer_id'], ['id'])
    op.create_foreign_key(None, 'violation_versions', 'violations', ['violation_id'], ['id'])
    op.create_foreign_key(None, 'violations', 'cameras', ['camera_id'], ['id'])
    op.create_foreign_key(None, 'violations', 'violation_versions', ['version_id'], ['id'])

def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('violations')
    op.drop_table('violation_versions')
    op.drop_table('tickets')
    op.drop_table('ticket_versions')
    op.drop_table('officers')
    op.drop_table('cameras')
    # ### end Alembic commands ###
