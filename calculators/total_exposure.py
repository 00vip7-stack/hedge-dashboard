"""
총 노출액 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class TotalExposureCalculator(BaseCalculator):
    """
    총 노출액 계산
    모든 포지션의 금액 합계
    """
    
    name = "totalExposure"
    priority = 10  # 가장 먼저 실행 (다른 계산기들이 이 값을 참조)
    dependencies = []
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        총 노출액 = SUM(모든 포지션의 amount)
        
        Args:
            positions: 헤지 포지션 리스트
            context: 컨텍스트 (사용 안 함)
        
        Returns:
            총 노출액 (float)
        """
        total = 0.0
        
        for pos in positions:
            amount = pos.get('amount', 0)
            
            # 문자열인 경우 숫자로 변환
            if isinstance(amount, str):
                amount = amount.replace(',', '').replace('$', '').strip()
                try:
                    amount = float(amount)
                except (ValueError, AttributeError):
                    amount = 0
            
            total += float(amount)
        
        return total
    
    def format_result(self, result: float) -> float:
        """결과를 소수점 2자리로 포맷"""
        return round(result, 2)
