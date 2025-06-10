from pydantic import BaseModel
from typing import List, Dict


class StatsOverview(BaseModel):
    total_violations: int
    average_per_day: float
    processed_ratio: float
    violations_by_type: Dict[str, int]
    violations_by_camera: Dict[str, int]


class WeekdayStats(BaseModel):
    weekday: str  
    count: int


class WeeklyViolationStats(BaseModel):
    data: List[WeekdayStats]


class HourlyStats(BaseModel):
    hour: int  # 0-23
    count: int


class HourlyViolationStats(BaseModel):
    data: List[HourlyStats]


class ProcessingStats(BaseModel):
    processed: int
    unprocessed: int
    ratio: float
