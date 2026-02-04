"""
계산기 레지스트리
모든 계산기를 자동으로 등록하고 관리
"""
from typing import Dict, List, Any, Type
import logging

logger = logging.getLogger(__name__)

class CalculatorRegistry:
    """
    계산기 레지스트리 - 싱글톤 패턴
    
    사용법:
        registry = CalculatorRegistry()
        registry.register(TotalExposureCalculator())
        results = registry.calculate_all(positions)
    """
    
    _instance = None
    _calculators: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # 이미 초기화되었으면 스킵
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        self._calculators = {}
    
    def register(self, calculator):
        """
        계산기 등록
        
        Args:
            calculator: BaseCalculator를 상속한 계산기 인스턴스
        """
        from .base_calculator import BaseCalculator
        
        if not isinstance(calculator, BaseCalculator):
            raise TypeError(f"{calculator}는 BaseCalculator를 상속해야 합니다")
        
        if not calculator.name:
            raise ValueError(f"{calculator.__class__.__name__}은 name 속성이 필요합니다")
        
        self._calculators[calculator.name] = calculator
        logger.info(f"계산기 등록: {calculator.name}")
    
    def unregister(self, name: str):
        """
        계산기 등록 해제
        
        Args:
            name: 계산기 이름
        """
        if name in self._calculators:
            del self._calculators[name]
            logger.info(f"계산기 등록 해제: {name}")
    
    def get(self, name: str):
        """
        계산기 가져오기
        
        Args:
            name: 계산기 이름
        
        Returns:
            계산기 인스턴스 또는 None
        """
        return self._calculators.get(name)
    
    def list_calculators(self) -> List[str]:
        """
        등록된 모든 계산기 이름 반환
        
        Returns:
            계산기 이름 리스트
        """
        return list(self._calculators.keys())
    
    def calculate_all(self, positions: List[Dict[str, Any]], 
                     context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        모든 계산기 실행 (의존성 순서 고려)
        
        Args:
            positions: 헤지 포지션 리스트
            context: 초기 컨텍스트 (선택)
        
        Returns:
            모든 계산 결과를 담은 딕셔너리
        """
        if context is None:
            context = {}
        
        results = {}
        
        # 우선순위 순으로 정렬
        sorted_calculators = sorted(
            self._calculators.values(),
            key=lambda c: c.priority
        )
        
        # 각 계산기 실행
        for calculator in sorted_calculators:
            try:
                # 입력 검증
                if not calculator.validate_input(positions):
                    logger.warning(f"{calculator.name}: 입력 데이터 검증 실패")
                    results[calculator.name] = None
                    continue
                
                # 계산 수행
                result = calculator.calculate(positions, {**context, **results})
                
                # 결과 포맷팅
                formatted_result = calculator.format_result(result)
                
                results[calculator.name] = formatted_result
                logger.info(f"{calculator.name}: {formatted_result}")
                
            except Exception as e:
                logger.error(f"{calculator.name} 계산 오류: {str(e)}", exc_info=True)
                results[calculator.name] = None
        
        return results
    
    def calculate_one(self, name: str, positions: List[Dict[str, Any]], 
                     context: Dict[str, Any] = None) -> Any:
        """
        특정 계산기만 실행
        
        Args:
            name: 계산기 이름
            positions: 헤지 포지션 리스트
            context: 컨텍스트
        
        Returns:
            계산 결과
        """
        if context is None:
            context = {}
        
        calculator = self.get(name)
        if not calculator:
            raise ValueError(f"계산기를 찾을 수 없음: {name}")
        
        if not calculator.validate_input(positions):
            raise ValueError(f"{name}: 입력 데이터 검증 실패")
        
        result = calculator.calculate(positions, context)
        return calculator.format_result(result)
