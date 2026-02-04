"""
계산기 베이스 클래스
모든 계산기는 이 클래스를 상속받아 구현
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseCalculator(ABC):
    """
    헤지 계산기 추상 베이스 클래스
    
    새로운 계산기 추가 방법:
    1. 이 클래스를 상속
    2. name 속성 정의
    3. calculate() 메서드 구현
    4. registry에 자동 등록됨
    """
    
    # 계산기 이름 (하위 클래스에서 정의 필수)
    name: str = None
    
    # 계산 우선순위 (낮을수록 먼저 실행, 의존성 관리용)
    priority: int = 100
    
    # 이 계산기가 의존하는 다른 계산기들
    dependencies: List[str] = []
    
    def __init__(self):
        if not self.name:
            raise ValueError(f"{self.__class__.__name__}은 'name' 속성을 정의해야 합니다")
    
    @abstractmethod
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> Any:
        """
        계산 수행
        
        Args:
            positions: 헤지 포지션 리스트
            context: 다른 계산기 결과 및 컨텍스트 정보
                    예: {'totalExposure': 1000000, 'customerId': 'C001'}
        
        Returns:
            계산 결과 (숫자, 문자열, 딕셔너리 등)
        """
        pass
    
    def validate_input(self, positions: List[Dict[str, Any]]) -> bool:
        """
        입력 데이터 검증
        
        Args:
            positions: 헤지 포지션 리스트
        
        Returns:
            True if valid, False otherwise
        """
        if not positions:
            return False
        
        # 기본 필드 검증
        required_fields = ['currency', 'amount', 'direction']
        for pos in positions:
            if not all(field in pos for field in required_fields):
                return False
        
        return True
    
    def format_result(self, result: Any) -> Any:
        """
        결과 포맷팅 (필요시 오버라이드)
        
        Args:
            result: 원시 계산 결과
        
        Returns:
            포맷팅된 결과
        """
        return result
