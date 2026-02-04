// 공통 인쇄 템플릿 시스템
// HedgeFreedom 대시보드 전용

// 네고용 브리핑 인쇄 템플릿
function getPrintTemplate_NegooBriefing() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR');
    const timeStr = now.toLocaleTimeString('ko-KR');
    
    return `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 10px;">은행 협상 브리핑 자료</h1>
            <p style="font-size: 11pt; color: #666;">HedgeFreedom 실시간 협상 가이드</p>
            <p style="font-size: 10pt; color: #999;">생성일시: ${dateStr} ${timeStr}</p>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; background: #e0f2fe; border-left: 4px solid #0284c7;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">📊 현재 시장 정보</h2>
            <table style="width: 100%; font-size: 11pt;">
                <tr>
                    <td style="padding: 6px 0;"><strong>현재 시장가 (USD/KRW):</strong></td>
                    <td style="text-align: right; font-size: 16pt; font-weight: bold; color: #0284c7;">1,350.00원</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><strong>평소 귀사 평균 마진:</strong></td>
                    <td style="text-align: right; font-size: 14pt; font-weight: bold; color: #16a34a;">0.80원</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><strong>목표 체결가:</strong></td>
                    <td style="text-align: right; font-size: 16pt; font-weight: bold; color: #dc2626;">1,350.80원</td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">🎯 오늘의 협상 전략</h2>
            <div style="font-size: 11pt; line-height: 1.8;">
                <p style="margin-bottom: 10px;"><strong>1단계 (오프닝):</strong> "안녕하세요, 오늘 USD 500,000 달러 환전 건으로 연락드렸습니다. 시장가 확인 부탁드립니다."</p>
                <p style="margin-bottom: 10px;"><strong>2단계 (시장가 확인):</strong> 은행원이 제시한 가격이 시장가 대비 얼마인지 확인하세요.</p>
                <p style="margin-bottom: 10px;"><strong>3단계 (협상):</strong> "타행에서는 시장가 +0.5원으로 제안받았습니다. 경쟁력 있는 가격 부탁드립니다."</p>
                <p style="margin-bottom: 10px;"><strong>4단계 (마무리):</strong> 목표가 달성 시 즉시 체결하세요.</p>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">💬 협상 스크립트</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
                    <tr style="background: #0284c7; color: white;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #0369a1;">상황</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #0369a1;">멘트 예시</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>오프닝</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">"500,000 달러 환전 건입니다. 현재 시장가 기준 어떻게 되나요?"</td>
                    </tr>
                    <tr style="background: #f0f9ff;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>가격 높을 때</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">"타행에서 더 나은 조건 제시했는데, 조정 가능할까요?"</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>가격 만족</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">"좋습니다. 1,350.80원으로 500,000 달러 체결하겠습니다."</td>
                    </tr>
                    <tr style="background: #f0f9ff;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>거절</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">"검토 후 다시 연락드리겠습니다. 감사합니다."</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>본 브리핑은 HedgeFreedom에서 자동 생성되었습니다.</p>
        </div>
    `;
}

// 변동성 알림 인쇄 템플릿  
function getPrintTemplate_VolatilityAlert() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR');
    const timeStr = now.toLocaleTimeString('ko-KR');
    
    return `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 10px;">환율 변동성 알림 보고서</h1>
            <p style="font-size: 11pt; color: #666;">HedgeFreedom 위험관리시스템</p>
            <p style="font-size: 10pt; color: #999;">보고서 생성: ${dateStr} ${timeStr}</p>
        </div>

        <div style="margin-bottom: 25px; padding: 20px; background: #fee2e2; border: 2px solid #ef4444;">
            <h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; color: #991b1b;">⚠️ 긴급 알림 발생</h2>
            <p style="font-size: 12pt; margin-bottom: 10px;">
                현재 USD/KRW 환율이 귀사의 <strong style="color: #dc2626;">마진 마지노선인 1,370원을 돌파</strong>했습니다.
            </p>
            <p style="font-size: 11pt; color: #666;">
                지금 헤지하지 않으면 계획 대비 손실이 발생하기 시작합니다.
            </p>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">📊 실시간 모니터링 현황</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                <thead>
                    <tr style="background: #3b82f6; color: white;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #2563eb;">항목</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #2563eb;">현재값</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #2563eb;">상태</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">현재 환율</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">1,375.50원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #dc2626;"><strong>위험</strong></td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; border: 1px solid #ddd;">마진 마지노선</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">1,370.00원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">-</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">초과 금액</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">+5.50원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #dc2626;"><strong>손실 구간</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; background: #fff7ed; border-left: 4px solid #ea580c;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">💸 예상 손익 분석</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                • <strong>미헤지 잔액:</strong> $2,500,000<br>
                • <strong>1원당 손실:</strong> 25,000,000원<br>
                • <strong>현재 누적 손실:</strong> <strong style="font-size: 14pt; color: #dc2626;">약 1억 3,750만원</strong>
            </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border: 2px solid #f59e0b;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #92400e;">📋 권고사항</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                1. 즉시 헤지 실행을 검토하세요<br>
                2. 추가 상승 시 손실이 가속화될 수 있습니다<br>
                3. 경영진 보고 및 의사결정이 필요합니다
            </p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>본 보고서는 HedgeFreedom에서 자동 생성되었습니다.</p>
        </div>
    `;
}

// 마진 벤치마크 인쇄 템플릿
function getPrintTemplate_MarginBenchmark() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR');
    
    return `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 10px;">마진 벤치마킹 분석 보고서</h1>
            <p style="font-size: 11pt; color: #666;">HedgeFreedom 익명 비교 시스템</p>
            <p style="font-size: 10pt; color: #999;">분석 기준일: ${dateStr}</p>
        </div>

        <div style="margin-bottom: 25px; padding: 20px; background: #fee2e2; border: 2px solid #ef4444;">
            <h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; color: #991b1b;">📊 벤치마크 결과 요약</h2>
            <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 12pt; margin-bottom: 10px;">귀사 평균 마진: <strong style="font-size: 18pt; color: #dc2626;">1.2원</strong></p>
                <p style="font-size: 12pt; margin-bottom: 10px;">업계 평균 마진: <strong style="font-size: 14pt;">0.5원</strong></p>
                <p style="font-size: 16pt; font-weight: bold; color: #dc2626; margin: 15px 0;">
                    귀사는 상위 10% 비싼 고객입니다
                </p>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">📈 업계 비교 분석</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                <thead>
                    <tr style="background: #3b82f6; color: white;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #2563eb;">구분</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #2563eb;">평균 마진</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #2563eb;">평가</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #dcfce7;">
                        <td style="padding: 10px; border: 1px solid #ddd;">상위 25% (우수)</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">0.3원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #15803d;"><strong>우수</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">중간 50% (보통)</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">0.5원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">보통</td>
                    </tr>
                    <tr style="background: #fee2e2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>귀사 현황</strong></td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">1.2원</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #dc2626;"><strong>개선 필요</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">💰 연간 낭비 추정액</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                • 연간 거래액: $140,000,000<br>
                • 귀사 마진: 1.2원 (168,000,000원)<br>
                • 업계 평균 적용 시: 0.5원 (70,000,000원)<br>
                • <strong style="font-size: 14pt; color: #dc2626;">연간 낭비액: 약 9,800만원</strong>
            </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #e0f2fe; border: 2px solid #0284c7;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #075985;">💡 개선 권고사항</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                1. 즉시 은행과 마진 재협상을 시작하세요<br>
                2. 목표: 업계 평균인 0.5원 수준 달성<br>
                3. 여러 은행에 견적을 요청하여 경쟁 구도를 만드세요
            </p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>본 보고서는 HedgeFreedom 익명 벤치마킹 시스템에서 생성되었습니다.</p>
        </div>
    `;
}

// 타사 환율 랭킹 인쇄 템플릿
function getPrintTemplate_RankingReport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR');
    
    return `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 10px;">업계 환율 랭킹 보고서</h1>
            <p style="font-size: 11pt; color: #666;">HedgeFreedom 익명 벤치마킹</p>
            <p style="font-size: 10pt; color: #999;">분석 기간: 2026년 1월 (기준일: ${dateStr})</p>
        </div>

        <div style="margin-bottom: 25px; padding: 20px; background: #fef2f2; border: 2px solid #ef4444;">
            <h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; color: #991b1b;">🏆 우리 회사 순위</h2>
            <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 48pt; font-weight: bold; color: #dc2626; margin: 10px 0;">7위</p>
                <p style="font-size: 14pt; color: #666;">/ 12개사 (자동차 부품 업계)</p>
                <div style="margin-top: 20px;">
                    <table style="width: 100%; font-size: 11pt;">
                        <tr>
                            <td style="padding: 8px;"><strong>우리 회사 평균 환율:</strong></td>
                            <td style="text-align: right; font-weight: bold; color: #dc2626;">1,328.50원</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>업계 평균 환율:</strong></td>
                            <td style="text-align: right;">1,323.20원</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>격차 (불리):</strong></td>
                            <td style="text-align: right; font-weight: bold; color: #dc2626;">+5.30원</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">📊 업계 환율 랭킹 (익명)</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
                    <tr style="background: #3b82f6; color: white;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #2563eb;">순위</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #2563eb;">기업</th>
                        <th style="padding: 8px; text-align: right; border: 1px solid #2563eb;">평균 환율</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #2563eb;">평가</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #dcfce7;">
                        <td style="padding: 8px; border: 1px solid #ddd;">1위</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">A사</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #15803d;">1,318.20원</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: #15803d;">우수</td>
                    </tr>
                    <tr style="background: #f0fdf4;">
                        <td style="padding: 8px; border: 1px solid #ddd;">2-6위</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">B~F사</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">1,320~1,325원</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">양호</td>
                    </tr>
                    <tr style="background: #fee2e2;">
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>7위</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>우리 회사 ⬅</strong></td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">1,328.50원</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: #dc2626;">개선 필요</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">8-12위</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">G~I사</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd; color: #dc2626;">1,330~1,335원</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">부진</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 12px;">💡 업계 평균 달성 시 절감 효과</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                • 이번 달 거래액: $3,200,000<br>
                • 환율 격차: +5.30원<br>
                • <strong style="font-size: 14pt; color: #3b82f6;">월간 손실 추정액: 16,960,000원</strong><br>
                • <strong style="font-size: 14pt; color: #dc2626;">연간 손실 추정액: 약 2억원</strong>
            </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fff7ed; border: 2px solid #ea580c;">
            <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #9a3412;">📋 개선 권고사항</h2>
            <p style="font-size: 11pt; line-height: 1.8;">
                1. 목표: 업계 평균(1,323.20원) 수준 달성<br>
                2. 은행과 즉시 마진 재협상 시작<br>
                3. 경쟁사 사례를 근거로 협상력 강화<br>
                4. 분기별 벤치마킹으로 지속적 개선
            </p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>본 보고서는 HedgeFreedom 익명 벤치마킹 시스템에서 생성되었습니다.</p>
        </div>
    `;
}
