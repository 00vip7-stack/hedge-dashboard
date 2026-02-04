"""
헤지 비율 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class HedgeRatioCalculator(BaseCalculator):
    """
    헤지 비율 계산
    (헤지된 금액 / 총 노출액) * 100
    """
    
    name = "hedgeRatio"
    priority = 30  # totalExposure와 hedgedAmount 이후 실행
    dependencies = ["totalExposure", "hedgedAmount"]
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        헤지 비율 = (hedgedAmount / totalExposure) * 100
        
        Args:
            positions: 헤지 포지션 리스트 (사용 안 함)
            context: 이전 계산 결과 (totalExposure, hedgedAmount)
        
        Returns:
            헤지 비율 (%) (float)
        """
        total_exposure = context.get('totalExposure', 0)
        hedged_amount = context.get('hedgedAmount', 0)
        
        if total_exposure == 0:
            return 0.0
        
        ratio = (hedged_amount / total_exposure) * 100
        return ratio
    
    def format_result(self, result: float) -> float:
        """결과를 소수점 1자리로 포맷"""
        return round(result, 1)
