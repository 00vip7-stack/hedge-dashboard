"""
엑셀 파싱 및 익명화 테스트
"""

import sys
from excel_parser import ExcelParser, DataAnonymizer, calculate_kpi


def test_excel_parser():
    """엑셀 파서 테스트"""
    
    print("=" * 60)
    print("엑셀 파싱 테스트")
    print("=" * 60)
    
    # 테스트 파일들
    test_files = [
        'sample_trades.xlsx',
        'sample_no_header.xlsx',
        'sample_various_formats.xlsx'
    ]
    
    for filename in test_files:
        try:
            print(f"\n📄 파일: {filename}")
            print("-" * 60)
            
            # 파서 생성
            parser = ExcelParser(file_path=filename)
            
            # 데이터 파싱
            trades = parser.parse_trade_data()
            
            print(f"✅ 파싱된 거래 건수: {len(trades)}")
            
            # 처음 3건만 출력
            for i, trade in enumerate(trades[:3], 1):
                print(f"\n거래 #{i}:")
                print(f"  - ID: {trade['id']}")
                print(f"  - 거래처: {trade['counterparty']}")
                print(f"  - 통화: {trade['currency']}")
                print(f"  - 금액: {trade['amount']:,.0f}")
                print(f"  - 결제일: {trade['settlementDate']}")
                print(f"  - 구분: {trade['type']}")
                print(f"  - 원화환산: {trade['krwAmount']:,}원")
                print(f"  - D-Day: {trade['daysUntil']}일")
                print(f"  - 헤지상태: {trade['hedgeStatus']}")
            
            if len(trades) > 3:
                print(f"\n... 외 {len(trades) - 3}건")
            
        except Exception as e:
            print(f"❌ 오류: {e}")
            import traceback
            traceback.print_exc()


def test_anonymization():
    """익명화 테스트"""
    
    print("\n\n" + "=" * 60)
    print("데이터 익명화 테스트")
    print("=" * 60)
    
    try:
        # 파서로 데이터 가져오기
        parser = ExcelParser(file_path='sample_trades.xlsx')
        raw_trades = parser.parse_trade_data()
        
        print(f"\n원본 데이터: {len(raw_trades)}건")
        print("\n원본 거래처명:")
        for i, trade in enumerate(raw_trades[:5], 1):
            print(f"  {i}. {trade['counterparty']}")
        
        # 익명화
        customer_id = "customer_test_12345"
        anonymizer = DataAnonymizer(customer_id)
        anonymized_trades = anonymizer.anonymize_trades(raw_trades)
        
        print(f"\n익명화된 데이터: {len(anonymized_trades)}건")
        print("\n익명화된 거래처명:")
        for i, trade in enumerate(anonymized_trades[:5], 1):
            print(f"  {i}. {trade['counterparty']}")
        
        # 익명화 매핑 확인
        print(f"\n익명화 매핑 테이블 ({len(anonymizer.anonymization_map)}건):")
        for original, anonymized in list(anonymizer.anonymization_map.items())[:10]:
            print(f"  {original} → {anonymized}")
        
    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()


def test_kpi_calculation():
    """KPI 계산 테스트"""
    
    print("\n\n" + "=" * 60)
    print("KPI 계산 테스트")
    print("=" * 60)
    
    try:
        # 파서로 데이터 가져오기
        parser = ExcelParser(file_path='sample_trades.xlsx')
        trades = parser.parse_trade_data()
        
        # KPI 계산
        kpi = calculate_kpi(trades)
        
        print(f"\n📊 KPI 결과:")
        print(f"  - 총 노출액: {kpi['totalExposure']:,}원")
        print(f"  - 헤지금액: {kpi['hedgedAmount']:,}원")
        print(f"  - 현재 헤지비율: {kpi['currentHedgeRatio']}%")
        print(f"  - 목표 헤지비율: {kpi['targetHedgeRatio']}%")
        print(f"  - 갭: {kpi['gap']:+.1f}%p")
        print(f"  - 미헤지금액: {kpi['unhedgedAmount']:,}원")
        
        # 헤지 상태별 분석
        hedge_status_counts = {}
        for trade in trades:
            status = trade['hedgeStatus']
            hedge_status_counts[status] = hedge_status_counts.get(status, 0) + 1
        
        print(f"\n📈 헤지 상태별 건수:")
        for status, count in hedge_status_counts.items():
            print(f"  - {status}: {count}건")
        
    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_excel_parser()
    test_anonymization()
    test_kpi_calculation()
    
    print("\n\n" + "=" * 60)
    print("✅ 모든 테스트 완료!")
    print("=" * 60)
