from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date

from storage.database import get_db
from storage.models import Violation, Camera
from api.schemas.stats import (
    StatsOverview, WeeklyViolationStats, WeekdayStats,
    HourlyViolationStats, HourlyStats, ProcessingStats
)
from api.utils.auth import require_all

stats_router = APIRouter(
    prefix="/api/v1/stats",
    tags=["Stats"],
    dependencies=[Depends(require_all)]
)

@stats_router.get("/overview", response_model=StatsOverview)
def get_stats_overview(db: Session = Depends(get_db)):
    total = db.query(Violation).count()

    avg_per_day = (
        db.query(cast(Violation.timestamp, Date))
        .group_by(cast(Violation.timestamp, Date))
        .count()
    )
    avg = total / avg_per_day if avg_per_day else 0

    processed = db.query(Violation).filter(Violation.status == "done").count()
    ratio = processed / total if total else 0

    by_type = dict(
        db.query(Violation.violation_type, func.count())
        .group_by(Violation.violation_type)
        .all()
    )

    by_camera = dict(
        db.query(Camera.name, func.count(Violation.id))
        .join(Camera, Camera.id == Violation.camera_id)
        .group_by(Camera.name)
        .all()
    )

    return StatsOverview(
        total_violations=total,
        average_per_day=avg,
        processed_ratio=ratio,
        violations_by_type=by_type,
        violations_by_camera=by_camera,
    )


@stats_router.get("/by-weekday", response_model=WeeklyViolationStats)
def get_weekday_stats(db: Session = Depends(get_db)):
    data = (
        db.query(func.to_char(Violation.timestamp, 'Day'), func.count())
        .group_by(func.to_char(Violation.timestamp, 'Day'))
        .all()
    )
    return WeeklyViolationStats(data=[
        WeekdayStats(weekday=day.strip(), count=count) for day, count in data
    ])  


@stats_router.get("/by-hour", response_model=HourlyViolationStats)
def get_hourly_stats(db: Session = Depends(get_db)):
    data = (
        db.query(extract("hour", Violation.timestamp).label("hour"), func.count())
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    return HourlyViolationStats(data=[
        HourlyStats(hour=int(hour), count=count) for hour, count in data
    ])


@stats_router.get("/processing-ratio", response_model=ProcessingStats)
def get_processing_ratio(db: Session = Depends(get_db)):
    total = db.query(Violation).count()
    processed = db.query(Violation).filter(Violation.status == "done").count()
    unprocessed = total - processed
    ratio = processed / total if total else 0

    return ProcessingStats(
        processed=processed,
        unprocessed=unprocessed,
        ratio=ratio
    )
