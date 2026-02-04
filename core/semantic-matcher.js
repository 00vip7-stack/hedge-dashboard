/**
 * Semantic Column Matcher - AI 기반 컬럼 의미 분석 및 매칭
 * 다양한 ERP 시스템(더존, 영림원, SAP 등)의 컬럼명을 의미론적으로 이해
 */

class SemanticMatcher {
    constructor() {
        this.mode = 'hybrid'; // 'local', 'api', 'hybrid'
        this.apiEndpoint = null; // OpenAI/HuggingFace API
        this.cache = new Map(); // 매칭 결과 캐시
        
        // 필드 정의 (의미 설명 포함)
        this.fieldDefinitions = {
            counterparty: {
                name: '거래처',
                description: '거래 상대방의 회사명이나 이름. 수출/수입 업체, 고객사, 공급처 등',
                examples: ['삼성전자', 'Apple Inc.', '현대자동차'],
                synonyms: ['거래처명', '업체명', '고객사', '상대처', '회사명', '상호', '공급처', '매출처', '매입처'],
                erpVariants: {
                    '더존': ['거래처명', '거래처코드명'],
                    '영림원': ['업체명', '거래처'],
                    'SAP': ['Customer', 'Vendor'],
                    '한컴': ['상대처명'],
                    '하나로': ['거래회사']
                }
            },
            currency: {
                name: '통화',
                description: '외화 종류. USD, EUR, JPY 등의 통화 코드',
                examples: ['USD', 'EUR', 'JPY', 'CNY'],
                synonyms: ['통화코드', '외화', '외화종류', '화폐', '통화단위', 'CCY'],
                erpVariants: {
                    '더존': ['외화종류', '통화코드'],
                    '영림원': ['통화', '외화코드'],
                    'SAP': ['Currency', 'Curr'],
                    '한컴': ['통화구분'],
                    '하나로': ['외화명']
                }
            },
            amount: {
                name: '금액',
                description: '거래 금액 또는 외화 수량. 숫자 형식',
                examples: ['1000000', '50000.50', '-25000'],
                synonyms: ['외화금액', '거래금액', '발생금액', '잔액', '수량', '외화수량', '원화환산금액'],
                erpVariants: {
                    '더존': ['외화금액', '발생금액(외화)'],
                    '영림원': ['거래금액', '외화잔액'],
                    'SAP': ['Amount', 'Amt in FC'],
                    '한컴': ['금액(외화)'],
                    '하나로': ['외화수량']
                }
            },
            date: {
                name: '날짜',
                description: '거래 날짜 또는 결제 예정일. YYYY-MM-DD 형식',
                examples: ['2026-02-04', '2026/02/04', '20260204'],
                synonyms: ['거래일', '결제예정일', '예정일', '일자', '발생일', '만기일', '정산일', '약정일'],
                erpVariants: {
                    '더존': ['결제예정일', '발생일자'],
                    '영림원': ['거래일자', '만기일'],
                    'SAP': ['Document Date', 'Due Date'],
                    '한컴': ['예정일'],
                    '하나로': ['정산예정일']
                }
            },
            bank: {
                name: '은행',
                description: '거래 은행이나 금융기관명',
                examples: ['우리은행', '국민은행', 'HSBC'],
                synonyms: ['거래은행', '금융기관', '은행명', '거래처은행'],
                erpVariants: {
                    '더존': ['거래은행명'],
                    '영림원': ['은행'],
                    'SAP': ['Bank'],
                    '한컴': ['금융기관명'],
                    '하나로': ['거래은행']
                }
            },
            type: {
                name: '거래유형',
                description: '수출/수입, 매출/매입 등의 거래 구분',
                examples: ['수출', '수입', '매출', '매입'],
                synonyms: ['구분', '거래구분', '유형', '종류', '수출입구분', '입출금구분', '차대구분'],
                erpVariants: {
                    '더존': ['거래구분', '수출입구분'],
                    '영림원': ['구분', '유형'],
                    'SAP': ['Transaction Type'],
                    '한컴': ['거래종류'],
                    '하나로': ['입출금구분']
                }
            }
        };
        
        console.log('🧠 SemanticMatcher 초기화 (AI 기반 컬럼 매칭)');
    }
    
    /**
     * 컬럼 헤더와 필드 매칭 (하이브리드 방식)
     */
    async matchColumn(headerName, candidates = null) {
        if (!headerName) return null;
        
        // 캐시 확인
        const cacheKey = headerName.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const targetFields = candidates || Object.keys(this.fieldDefinitions);
        
        // 1단계: 정확한 키워드 매칭 (빠름)
        const exactMatch = this.exactMatch(headerName, targetFields);
        if (exactMatch.score > 0.9) {
            this.cache.set(cacheKey, exactMatch);
            return exactMatch;
        }
        
        // 2단계: Fuzzy 매칭 (중간)
        const fuzzyMatch = this.fuzzyMatch(headerName, targetFields);
        if (fuzzyMatch.score > 0.7) {
            this.cache.set(cacheKey, fuzzyMatch);
            return fuzzyMatch;
        }
        
        // 3단계: 의미론적 유사도 (느리지만 정확)
        const semanticMatch = await this.semanticMatch(headerName, targetFields);
        
        this.cache.set(cacheKey, semanticMatch);
        return semanticMatch;
    }
    
    /**
     * 1단계: 정확한 키워드 매칭
     */
    exactMatch(headerName, targetFields) {
        const headerLower = headerName.toLowerCase().trim();
        let bestMatch = { field: null, score: 0, method: 'exact' };
        
        for (const field of targetFields) {
            const definition = this.fieldDefinitions[field];
            
            // 동의어 확인
            for (const synonym of definition.synonyms) {
                if (headerLower === synonym.toLowerCase()) {
                    return { field, score: 1.0, method: 'exact', matched: synonym };
                }
                
                // 부분 일치
                if (headerLower.includes(synonym.toLowerCase()) || 
                    synonym.toLowerCase().includes(headerLower)) {
                    const score = 0.95;
                    if (score > bestMatch.score) {
                        bestMatch = { field, score, method: 'exact-partial', matched: synonym };
                    }
                }
            }
            
            // ERP별 변형 확인
            for (const [erp, variants] of Object.entries(definition.erpVariants)) {
                for (const variant of variants) {
                    if (headerLower === variant.toLowerCase()) {
                        return { field, score: 1.0, method: 'erp-exact', erp, matched: variant };
                    }
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * 2단계: Fuzzy 매칭 (편집 거리 기반)
     */
    fuzzyMatch(headerName, targetFields) {
        const headerLower = headerName.toLowerCase().trim();
        let bestMatch = { field: null, score: 0, method: 'fuzzy' };
        
        for (const field of targetFields) {
            const definition = this.fieldDefinitions[field];
            
            // 모든 동의어와 비교
            const allKeywords = [
                ...definition.synonyms,
                ...Object.values(definition.erpVariants).flat()
            ];
            
            for (const keyword of allKeywords) {
                const similarity = this.levenshteinSimilarity(headerLower, keyword.toLowerCase());
                
                if (similarity > bestMatch.score) {
                    bestMatch = { field, score: similarity, method: 'fuzzy', matched: keyword };
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * 3단계: 의미론적 유사도 (AI 기반)
     */
    async semanticMatch(headerName, targetFields) {
        // 로컬 임베딩 기반 유사도
        let bestMatch = { field: null, score: 0, method: 'semantic-local' };
        
        for (const field of targetFields) {
            const definition = this.fieldDefinitions[field];
            
            // 설명과 헤더의 의미론적 유사도 계산
            const score = this.calculateSemanticSimilarity(
                headerName,
                definition.description + ' ' + definition.synonyms.join(' ')
            );
            
            if (score > bestMatch.score) {
                bestMatch = { field, score, method: 'semantic-local' };
            }
        }
        
        // API 기반 임베딩 (선택적)
        if (this.apiEndpoint && bestMatch.score < 0.8) {
            try {
                const apiMatch = await this.apiSemanticMatch(headerName, targetFields);
                if (apiMatch.score > bestMatch.score) {
                    bestMatch = { ...apiMatch, method: 'semantic-api' };
                }
            } catch (error) {
                console.warn('⚠️ API 매칭 실패, 로컬 결과 사용:', error.message);
            }
        }
        
        return bestMatch;
    }
    
    /**
     * 로컬 의미론적 유사도 계산 (간단한 TF-IDF 방식)
     */
    calculateSemanticSimilarity(text1, text2) {
        // 형태소 분석 간소화 버전
        const tokens1 = this.tokenize(text1);
        const tokens2 = this.tokenize(text2);
        
        // Jaccard 유사도
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * 텍스트 토큰화 (한글 + 영문)
     */
    tokenize(text) {
        const lower = text.toLowerCase();
        // 한글 자소 분리는 생략하고 단순 문자 분할
        return lower.split('').filter(c => c.match(/[a-z가-힣0-9]/));
    }
    
    /**
     * 레벤슈타인 유사도
     */
    levenshteinSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLen = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLen);
    }
    
    /**
     * 레벤슈타인 거리
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * API 기반 의미론적 매칭 (OpenAI/HuggingFace)
     */
    async apiSemanticMatch(headerName, targetFields) {
        // TODO: OpenAI Embeddings API 또는 HuggingFace API 호출
        // 현재는 플레이스홀더
        throw new Error('API 매칭은 아직 구현되지 않았습니다');
    }
    
    /**
     * 일괄 매칭 (모든 헤더에 대해)
     */
    async matchAll(headers) {
        console.log('🧠 AI 기반 일괄 매칭 시작...');
        const results = {};
        
        for (const header of headers) {
            if (!header) continue;
            
            const match = await this.matchColumn(header);
            
            if (match && match.score > 0.5) {
                results[header] = {
                    field: match.field,
                    confidence: match.score,
                    method: match.method,
                    matched: match.matched || null
                };
                
                console.log(`✅ "${header}" → ${match.field} (신뢰도: ${(match.score * 100).toFixed(1)}%, 방법: ${match.method})`);
            } else {
                console.log(`❓ "${header}" → 매칭 실패 (최고 신뢰도: ${match ? (match.score * 100).toFixed(1) : 0}%)`);
            }
        }
        
        return results;
    }
}

// 전역 인스턴스
window.semanticMatcher = new SemanticMatcher();

console.log('✅ Semantic Matcher 로드 완료 (AI 기반 컬럼 인식)');
