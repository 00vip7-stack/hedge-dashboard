"""
평균 헤지 환율 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class AvgHedgeRateCalculator(BaseCalculator):
    """
    평균 헤지 환율 계산
    헤지 포지션들의 가중 평균 환율
    """
    
    name = "avgHedgeRate"
    priority = 50
    dependencies = []
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        평균 헤지 환율 = SUM(헤지포지션.amount * rate) / SUM(헤지포지션.amount)
        
        Args:
            positions: 헤지 포지션 리스트
            context: 컨텍스트 (사용 안 함)
        
        Returns:
            평균 헤지 환율 (float)
        """
        total_weighted = 0.0
        total_amount = 0.0
        
        for pos in positions:
            direction = pos.get('direction', '').lower()
            
            # 헤지 포지션만 계산
            if direction in ['hedge', 'hedged', '헤지', '헷지']:
                amount = pos.get('amount', 0)
                rate = pos.get('rate', 0)
                
                # 문자열인 경우 숫자로 변환
                if isinstance(amount, str):
                    amount = amount.replace(',', '').replace('$', '').strip()
                    try:
                        amount = float(amount)
                    except (ValueError, AttributeError):
                        amount = 0
                
                if isinstance(rate, str):
                    rate = rate.replace(',', '').strip()
                    try:
                        rate = float(rate)
                    except (ValueError, AttributeError):
                        rate = 0
                
                amount = float(amount)
                rate = float(rate)
                
                total_weighted += amount * rate
                total_amount += amount
        
        if total_amount == 0:
            return 0.0
        
        avg_rate = total_weighted / total_amount
        return avg_rate
    
    def format_result(self, result: float) -> float:
        """결과를 소수점 2자리로 포맷"""
        return round(result, 2)
