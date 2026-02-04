"""
미헤지 금액 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class UnhedgedGapCalculator(BaseCalculator):
    """
    미헤지 금액 계산
    총 노출액 - 헤지된 금액
    """
    
    name = "unhedgedGap"
    priority = 40  # totalExposure와 hedgedAmount 이후 실행
    dependencies = ["totalExposure", "hedgedAmount"]
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        미헤지 금액 = totalExposure - hedgedAmount
        
        Args:
            positions: 헤지 포지션 리스트 (사용 안 함)
            context: 이전 계산 결과 (totalExposure, hedgedAmount)
        
        Returns:
            미헤지 금액 (float)
        """
        total_exposure = context.get('totalExposure', 0)
        hedged_amount = context.get('hedgedAmount', 0)
        
        gap = total_exposure - hedged_amount
        return gap
    
    def format_result(self, result: float) -> float:
        """결과를 소수점 2자리로 포맷"""
        return round(result, 2)
