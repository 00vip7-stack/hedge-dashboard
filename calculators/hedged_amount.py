"""
헤지된 금액 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class HedgedAmountCalculator(BaseCalculator):
    """
    헤지된 금액 계산
    direction이 'hedge'인 포지션의 합계
    """
    
    name = "hedgedAmount"
    priority = 20
    dependencies = []
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        헤지된 금액 = SUM(direction='hedge'인 포지션의 amount)
        
        Args:
            positions: 헤지 포지션 리스트
            context: 컨텍스트 (사용 안 함)
        
        Returns:
            헤지된 금액 (float)
        """
        hedged = 0.0
        
        for pos in positions:
            direction = pos.get('direction', '').lower()
            
            # 'hedge', '헤지', 'hedged' 등 다양한 표현 지원
            if direction in ['hedge', 'hedged', '헤지', '헷지']:
                amount = pos.get('amount', 0)
                
                # 문자열인 경우 숫자로 변환
                if isinstance(amount, str):
                    amount = amount.replace(',', '').replace('$', '').strip()
                    try:
                        amount = float(amount)
                    except (ValueError, AttributeError):
                        amount = 0
                
                hedged += float(amount)
        
        return hedged
    
    def format_result(self, result: float) -> float:
        """결과를 소수점 2자리로 포맷"""
        return round(result, 2)
