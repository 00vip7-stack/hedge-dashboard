/**
 * Data Anonymizer - 클라이언트 측 데이터 추출 및 익명화
 * 원본은 로컬 보관, 서버 전송용 데이터만 추출
 */

class DataAnonymizer {
    constructor() {
        console.log('🔒 DataAnonymizer 초기화 (컬럼 추출 방식)');
        
        // 서버 전송용 템플릿 정의 (필요한 컬럼만)
        this.serverTransmissionTemplate = {
            required: [
                'currency',      // 통화 (USD, EUR 등)
                'amount',        // 금액
                'date',          // 결제예정일
                'type'           // 거래유형 (수출/수입)
            ],
            optional: [
                'hedgedAmount',  // 헤지금액 (있으면)
                'hedgeStatus'    // 헤지상태 (있으면)
            ],
            excluded: [
                'counterparty',  // ❌ 거래처명 (절대 전송 안 함)
                'bank',          // ❌ 은행명 (절대 전송 안 함)
                'accountNumber', // ❌ 계좌번호 (절대 전송 안 함)
                'companyName',   // ❌ 회사명 (절대 전송 안 함)
                'contact',       // ❌ 담당자 (절대 전송 안 함)
                'email',         // ❌ 이메일 (절대 전송 안 함)
                'phone'          // ❌ 전화번호 (절대 전송 안 함)
            ]
        };
    }
    
    /**
     * 포지션 데이터에서 서버 전송용 컬럼만 추출
     * @param {Array} positions - 원본 포지션 데이터 (로컬에 보관됨)
     * @param {ProvenanceGraph} provenance - 프로비넌스 그래프 (선택)
     * @returns {Object} { original, extracted, comparison, provenance }
     */
    anonymizePositions(positions, provenance = null) {
        console.log(`🔒 ${positions.length}건의 데이터에서 전송용 컬럼 추출 시작`);
        
        const template = this.serverTransmissionTemplate;
        const allowedFields = [...template.required, ...template.optional];
        
        // 원본에서 필요한 컬럼만 추출
        const extracted = positions.map((pos, index) => {
            const extractedRecord = {
                _index: index,  // 원본과 매칭용 인덱스
                _extractedAt: new Date().toISOString()
            };
            
            // 허용된 필드만 복사
            allowedFields.forEach(field => {
                if (pos[field] !== undefined) {
                    extractedRecord[field] = pos[field];
                }
            });
            
            return extractedRecord;
        });
        
        console.log(`✅ 추출 완료: ${extracted.length}건`);
        console.log('📋 추출 샘플:', extracted[0]);
        
        // 프로비넌스 그래프에 추출 과정 기록
        if (provenance) {
            provenance.recordExtraction(positions, extracted, template);
            provenance.calculateQuality();
        }
        
        return {
            original: positions,      // 원본 (로컬 저장용)
            extracted: extracted,     // 추출본 (서버 전송용)
            template: template,
            provenance: provenance    // 프로비넌스 그래프
        };
    }
    
    /**
     * 파일명 익명화
     */
    anonymizeFileName(fileName) {
        const timestamp = new Date().toISOString();
        const hash = this.generateHash(fileName + timestamp);
        
        return {
            originalFileName: fileName,
            anonymizedFileName: `file_${hash}`,
            uploadTimestamp: timestamp,
            anonymized: true
        };
    }
    
    /**
     * 간단한 해시 생성
     */
    generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * 추출된 데이터 검증
     */
    validateAnonymization(data) {
        const excludedFields = this.serverTransmissionTemplate.excluded;
        
        // 제외 필드가 있는지 확인
        const hasSensitiveData = data.some(item => 
            excludedFields.some(field => item[field] !== undefined && item[field] !== '')
        );
        
        if (hasSensitiveData) {
            console.warn('⚠️ 추출 검증 실패: 민감정보가 포함되어 있습니다!');
            return false;
        }
        
        console.log('✅ 추출 검증 완료: 민감정보 없음');
        return true;
    }
    
    /**
     * 원본 vs 추출본 비교 미리보기 생성
     * @param {Array} originalData - 원본 데이터 (최대 5건)
     * @returns {Object} { beforeSample, afterSample, extractedFields, excludedFields }
     */
    generatePreview(originalData) {
        const sampleSize = Math.min(5, originalData.length);
        const beforeSample = originalData.slice(0, sampleSize);
        
        const result = this.anonymizePositions(beforeSample);
        const afterSample = result.extracted;
        
        // 추출된 필드와 제외된 필드 분석
        const extractedFields = [];
        const excludedFields = [];
        
        if (beforeSample.length > 0) {
            const firstOriginal = beforeSample[0];
            const firstExtracted = afterSample[0];
            
            Object.keys(firstOriginal).forEach(key => {
                if (key in firstExtracted && !key.startsWith('_')) {
                    extractedFields.push({
                        field: key,
                        sampleValue: firstOriginal[key],
                        status: '✅ 서버 전송'
                    });
                } else if (!key.startsWith('_')) {
                    excludedFields.push({
                        field: key,
                        sampleValue: this.maskValue(firstOriginal[key]),
                        status: '🔒 로컬 보관만'
                    });
                }
            });
        }
        
        return {
            beforeSample,           // 원본 데이터 (마스킹해서 표시)
            afterSample,            // 추출 데이터 (서버 전송용)
            extractedFields,        // 전송되는 필드 목록
            excludedFields,         // 제외되는 필드 목록
            totalRecords: originalData.length,
            template: this.serverTransmissionTemplate
        };
    }
    
    /**
     * 값 마스킹 (UI 표시용)
     */
    maskValue(value) {
        if (value === null || value === undefined) return '';
        
        const str = String(value);
        if (str.length <= 2) return '***';
        
        return str.charAt(0) + '***' + str.charAt(str.length - 1);
    }
}

// 전역 인스턴스
window.dataAnonymizer = new DataAnonymizer();

console.log('✅ Data Anonymizer 로드 완료');
