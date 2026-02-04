#!/usr/bin/env python3
"""
B-tree 폴더 구조 테스트 및 시각화
"""

import hashlib
from pathlib import Path

def visualize_customer_path(customer_id):
    """고객 ID의 경로 시각화"""
    hash_value = hashlib.md5(customer_id.encode()).hexdigest()
    
    level1 = hash_value[0:2]
    level2 = hash_value[2:4]
    level3 = hash_value[4:6]
    
    print(f"\n{'='*60}")
    print(f"고객 ID: {customer_id}")
    print(f"MD5 해시: {hash_value}")
    print(f"{'='*60}")
    print(f"경로 구조:")
    print(f"  server_data/customers/")
    print(f"    └── {level1}/ (Level 1: {int(level1, 16)}/256)")
    print(f"        └── {level2}/ (Level 2: {int(level2, 16)}/256)")
    print(f"            └── {level3}/ (Level 3: {int(level3, 16)}/256)")
    print(f"                └── {customer_id}/")
    print(f"                    ├── positions/")
    print(f"                    ├── kpi/")
    print(f"                    ├── reports/")
    print(f"                    ├── uploads/")
    print(f"                    ├── backup/")
    print(f"                    └── archive/")
    print(f"\n전체 경로:")
    print(f"  customers/{level1}/{level2}/{level3}/{customer_id}/")
    

def simulate_distribution(num_customers):
    """고객 분포 시뮬레이션"""
    from collections import defaultdict
    
    distribution = defaultdict(int)
    
    for i in range(num_customers):
        customer_id = f"customer_{i:010d}"
        hash_value = hashlib.md5(customer_id.encode()).hexdigest()
        level1 = hash_value[0:2]
        level2 = hash_value[2:4]
        level3 = hash_value[4:6]
        
        bucket = f"{level1}/{level2}/{level3}"
        distribution[bucket] += 1
    
    print(f"\n{'='*60}")
    print(f"고객 {num_customers:,}명 분포 시뮬레이션")
    print(f"{'='*60}")
    print(f"총 L3 버킷 수: {len(distribution):,}개")
    print(f"평균 고객/버킷: {num_customers / len(distribution):.1f}명")
    print(f"최대 고객/버킷: {max(distribution.values())}명")
    print(f"최소 고객/버킷: {min(distribution.values())}명")
    
    # 상위 5개 버킷
    print(f"\n가장 많은 고객을 가진 버킷 TOP 5:")
    sorted_buckets = sorted(distribution.items(), key=lambda x: x[1], reverse=True)[:5]
    for bucket, count in sorted_buckets:
        print(f"  {bucket}: {count}명")


def estimate_performance(num_customers):
    """성능 추정"""
    total_buckets = 256 * 256 * 256  # 16,777,216
    avg_per_bucket = num_customers / total_buckets
    
    print(f"\n{'='*60}")
    print(f"성능 추정 (고객 {num_customers:,}명)")
    print(f"{'='*60}")
    print(f"총 가능 버킷: {total_buckets:,}개")
    print(f"평균 고객/버킷: {avg_per_bucket:.2f}명")
    print(f"버킷 활용률: {(num_customers / total_buckets * 100):.4f}%")
    
    # 파일 시스템 성능
    if avg_per_bucket < 100:
        status = "✅ 최적"
    elif avg_per_bucket < 1000:
        status = "✅ 양호"
    elif avg_per_bucket < 10000:
        status = "⚠️  주의"
    else:
        status = "🔴 위험"
    
    print(f"성능 상태: {status}")
    
    # 조회 성능
    print(f"\n조회 성능:")
    print(f"  - 해시 계산: O(1)")
    print(f"  - 디렉토리 접근: 3단계 (L1→L2→L3)")
    print(f"  - 최종 파일 검색: O(log n) where n={avg_per_bucket:.0f}")


if __name__ == '__main__':
    print("\n🌲 B-tree 스타일 폴더 구조 분석\n")
    
    # 샘플 고객 경로 시각화
    visualize_customer_path("customer_1770173165154_8po8qgc")
    visualize_customer_path("default")
    visualize_customer_path("company_samsung_electronics")
    
    # 분포 시뮬레이션
    print("\n" + "="*60)
    simulate_distribution(1000)      # 천 명
    simulate_distribution(100000)    # 10만 명
    simulate_distribution(1000000)   # 100만 명
    simulate_distribution(10000000)  # 1천만 명
    
    # 성능 추정
    estimate_performance(1000)
    estimate_performance(100000)
    estimate_performance(1000000)
    estimate_performance(10000000)
    estimate_performance(100000000)  # 1억 명
    
    print("\n" + "="*60)
    print("✅ 분석 완료!")
    print("="*60 + "\n")
