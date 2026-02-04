"""
헤지 권장사항 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class RecommendationCalculator(BaseCalculator):
    """
    헤지 권장사항 계산
    헤지 비율에 따라 권장사항 제공
    """
    
    name = "recommendation"
    priority = 60  # hedgeRatio 이후 실행
    dependencies = ["hedgeRatio"]
    
    # 권장 헤지 비율 임계값
    OPTIMAL_MIN = 70.0  # 최소 권장 헤지 비율
    OPTIMAL_MAX = 90.0  # 최대 권장 헤지 비율
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> str:
        """
        권장사항 = 
            - hedgeRatio < 70% → "추가헤지필요"
            - 70% <= hedgeRatio <= 90% → "적정"
            - hedgeRatio > 90% → "과도헤지"
        
        Args:
            positions: 헤지 포지션 리스트 (사용 안 함)
            context: 이전 계산 결과 (hedgeRatio)
        
        Returns:
            권장사항 문자열
        """
        hedge_ratio = context.get('hedgeRatio', 0)
        
        if hedge_ratio < self.OPTIMAL_MIN:
            return "추가헤지필요"
        elif hedge_ratio > self.OPTIMAL_MAX:
            return "과도헤지"
        else:
            return "적정"
    
    def format_result(self, result: str) -> str:
        """결과 그대로 반환"""
        return result
