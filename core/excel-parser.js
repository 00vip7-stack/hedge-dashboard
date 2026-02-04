/**
 * Excel Parser - Excel 파일 읽기 및 파싱
 * 더존 ERP 형식 지원
 */

class ExcelParser {
    constructor() {
        this.supportedFormats = ['더존', 'SAP', '기본'];
        console.log('📊 ExcelParser 초기화');
    }
    
    /**
     * Excel 파일 읽기 (컬럼 매핑 포함)
     * @param {File} file - Excel 파일
     * @returns {Promise<Object>} { data, mapping, provenance }
     */
    async parseExcelWithMapping(file) {
        console.log(`📊 Excel 파일 읽기 시작 (매핑 포함): ${file.name}`);
        
        // 프로비넌스 그래프 초기화
        let provenance = null;
        try {
            if (window.ProvenanceGraph) {
                provenance = new window.ProvenanceGraph();
                await provenance.initialize(file);
            } else {
                console.warn('⚠️ ProvenanceGraph를 사용할 수 없습니다');
            }
        } catch (error) {
            console.warn('⚠️ 프로비넌스 초기화 실패:', error);
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            console.log(`📄 워크북 시트: ${workbook.SheetNames.join(', ')}`);
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            if (!worksheet) {
                throw new Error('워크시트를 찾을 수 없습니다');
            }
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                blankrows: false
            });
            
            console.log(`📋 총 ${jsonData.length}행 읽음`);
            
            if (jsonData.length < 2) {
                throw new Error('유효한 데이터가 없습니다');
            }
            
            // 헤더 추출
            const headers = jsonData[0];
            console.log('📋 헤더:', headers);
            
            // 컬럼 매핑 (AI 기반)
            const columnMap = await this.mapColumns(headers);
            const mappingResults = columnMap.aiResults || {};
            
            // ERP 시스템 자동 탐지
            if (provenance) {
                const detectedERP = provenance.detectERPSystem(headers, mappingResults);
                console.log(`🏢 ERP 시스템 탐지: ${detectedERP.name} (신뢰도: ${(detectedERP.confidence * 100).toFixed(1)}%)`);
                
                // 컬럼 매핑 기록
                provenance.recordColumnMapping(mappingResults, columnMap);
            }
            console.log('🗺️ 컬럼 매핑:', columnMap);
            
            // 매핑 결과를 사용자에게 보여줄 형식으로 변환
            const mappingResult = {};
            headers.forEach((header, index) => {
                for (const [field, colIndex] of Object.entries(columnMap)) {
                    if (colIndex === index) {
                        mappingResult[header] = field;
                    }
                }
            });
            
            // 데이터 파싱
            const positions = this.parsePositions(jsonData.slice(1), columnMap);
            console.log(`✅ ${positions.length}건 파싱 완료`);
            
            return {
                data: positions,
                mapping: mappingResult,
                headers: headers,
                provenance: provenance  // 프로비넌스 그래프 포함
            };
            
        } catch (error) {
            console.error('❌ Excel 파싱 실패:', error);
            
            window.eventBus.emit(window.EventTypes.ERROR_OCCURRED, {
                type: 'EXCEL_PARSE_ERROR',
                message: error.message,
                file: file.name
            });
            
            throw error;
        }
    }
    
    /**
     * Excel 파일 읽기 (기존 방식 - 호환성 유지)
     * @param {File} file - Excel 파일
     * @returns {Promise<Object>} { original, anonymized }
     */
    async readExcelFile(file) {
        console.log(`📊 Excel 파일 읽기 시작: ${file.name}`);
        
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            console.log(`📄 워크북 시트: ${workbook.SheetNames.join(', ')}`);
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            if (!worksheet) {
                throw new Error('워크시트를 찾을 수 없습니다');
            }
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                blankrows: false
            });
            
            console.log(`📋 총 ${jsonData.length}행 읽음`);
            
            if (jsonData.length < 2) {
                throw new Error('유효한 데이터가 없습니다');
            }
            
            // 헤더 추출
            const headers = jsonData[0];
            console.log('📋 헤더:', headers);
            
            // 컬럼 매핑 (AI 기반)
            const columnMap = await this.mapColumns(headers);
            console.log('🗺️ 컬럼 매핑:', columnMap);
            
            // 데이터 파싱
            const positions = this.parsePositions(jsonData.slice(1), columnMap);
            console.log(`✅ ${positions.length}건 파싱 완료`);
            
            // 익명화
            const result = window.dataAnonymizer.anonymizePositions(positions);
            
            // 이벤트 발행
            window.eventBus.emit(window.EventTypes.FILE_PARSED, {
                fileName: file.name,
                originalCount: positions.length,
                anonymizedCount: result.anonymized.length
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Excel 파싱 실패:', error);
            
            window.eventBus.emit(window.EventTypes.ERROR_OCCURRED, {
                type: 'EXCEL_PARSE_ERROR',
                message: error.message,
                file: file.name
            });
            
            throw error;
        }
    }
    
    /**
     * 컬럼 자동 매핑 (AI 기반 의미 분석 활용)
     */
    async mapColumns(headers) {
        console.log('🧠 AI 기반 컬럼 매핑 시작...');
        console.log('📋 헤더:', headers);
        console.log('🔍 Semantic Matcher 로드 상태:', window.semanticMatcher ? '✅ 로드됨' : '❌ 미로드');
        
        // Semantic Matcher 사용 가능 여부 확인
        if (window.semanticMatcher && typeof window.semanticMatcher.matchAll === 'function') {
            try {
                console.log('🚀 Semantic Matcher로 의미 분석 시작...');
                const semanticResults = await window.semanticMatcher.matchAll(headers);
                
                console.log('📊 Semantic 분석 결과:', semanticResults);
                const map = this.convertSemanticResultsToMap(semanticResults, headers);
                
                console.log('🗺️ AI 매핑 결과:', map);
                
                // 필수 컬럼 확인
                if (map.currency !== -1 && map.amount !== -1) {
                    console.log('✅ AI 기반 매핑 성공! (통화, 금액 모두 인식)');
                    // AI 결과를 포함하여 반환
                    map.aiResults = semanticResults;
                    return map;
                }
                
                console.log('⚠️ AI 매핑으로 필수 컬럼을 찾지 못함. 통화: ' + map.currency + ', 금액: ' + map.amount);
                console.log('   폴백 매핑으로 재시도...');
            } catch (error) {
                console.warn('⚠️ AI 매핑 실패:', error.message);
                console.warn('   에러 스택:', error.stack);
                console.log('   기존 키워드 방식으로 진행...');
            }
        } else {
            console.log('⚠️ Semantic Matcher를 사용할 수 없습니다. 기존 키워드 방식 사용');
        }
        
        // 폴백: 기존 키워드 기반 매핑
        console.log('🔄 폴백 매핑 시작...');
        const fallbackMap = this.fallbackMapping(headers);
        fallbackMap.aiResults = {};  // 빈 객체로 초기화
        return fallbackMap;
    }
    
    /**
     * Semantic Matcher 결과를 맵으로 변환
     */
    convertSemanticResultsToMap(semanticResults, headers) {
        const map = {
            counterparty: -1,
            currency: -1,
            amount: -1,
            date: -1,
            bank: -1,
            type: -1
        };
        
        headers.forEach((header, index) => {
            if (semanticResults[header]) {
                const field = semanticResults[header].field;
                const confidence = semanticResults[header].confidence;
                
                // 신뢰도 50% 이상만 채택
                if (confidence >= 0.5 && map[field] === -1) {
                    map[field] = index;
                    console.log(`✅ ${field} ← "${header}" (신뢰도: ${(confidence * 100).toFixed(1)}%)`);
                }
            }
        });
        
        return map;
    }
    
    /**
     * 폴백: 기존 키워드 기반 매핑 (개선된 버전)
     */
    fallbackMapping(headers) {
        const map = {
            counterparty: -1,
            currency: -1,
            amount: -1,
            date: -1,
            bank: -1,
            type: -1
        };
        
        // 매핑 규칙 (더욱 유연하게) - 더존 ERP 형식 포함
        const mappingRules = {
            counterparty: [
                '거래처', '거래처명', '업체명', '고객사', '상대처', 'counterparty', 'client', 'customer', 
                '회사명', '상호', '거래선', '공급사', '거래처코드', '거래선명', 'counterparty_name'
            ],
            currency: [
                '통화', '외화', '외화종류', '통화코드', 'currency', 'curr', 'ccy', '화폐', '외화구분',
                '외화', '화폐단위', '외화코드', 'currency_code', '외화명', '통화종류'
            ],
            amount: [
                '금액', '외화금액', '거래금액', '수량', 'amount', 'amt', '외화수량', '발생금액', 
                '금액(외화)', '외화거래액', '외화액', '거래액', 'transaction_amount', '외화금', 
                '금액원화', '금액(외화)', '결제금액', '공급가액', '부가세포함금액'
            ],
            date: [
                '날짜', '거래일', '결제예정일', '예정일', 'date', '일자', '결제일', '만기일', '정산일',
                '거래일자', '전표일자', '거래기일', 'transaction_date', '발생일자'
            ],
            bank: [
                '은행', '거래은행', '금융기관', 'bank', '은행명', '은행(수취)', '거래은행명',
                'bank_name', '은행코드', '거래처은행'
            ],
            type: [
                '유형', '거래유형', '구분', 'type', '종류', '수출입구분', '거래구분', '수출/수입',
                '거래처유형', '거래종류', '수입/수출', 'transaction_type'
            ]
        };
        
        console.log(`🗺️ 컬럼 매핑 시작 (${headers.length}개 헤더)`);
        
        // 첫 번째 패스: 정확한 매칭
        headers.forEach((header, index) => {
            if (!header) return;
            const headerStr = String(header).trim().toLowerCase();
            
            for (const [field, keywords] of Object.entries(mappingRules)) {
                if (map[field] !== -1) continue; // 이미 매핑됨
                
                // 정확한 매칭 시도
                for (const keyword of keywords) {
                    const keywordLower = keyword.toLowerCase();
                    if (headerStr === keywordLower || headerStr.endsWith(keywordLower.replace('통화', '')) ) {
                        map[field] = index;
                        console.log(`✅ [정확] ${field} → 컬럼 ${index} (${header})`);
                        break;
                    }
                }
            }
        });
        
        // 두 번째 패스: 부분 매칭
        headers.forEach((header, index) => {
            if (!header) return;
            const headerStr = String(header).trim().toLowerCase();
            
            for (const [field, keywords] of Object.entries(mappingRules)) {
                if (map[field] !== -1) continue; // 이미 매핑됨
                
                if (keywords.some(keyword => {
                    const keywordLower = keyword.toLowerCase();
                    return headerStr.includes(keywordLower) || keywordLower.includes(headerStr);
                })) {
                    map[field] = index;
                    console.log(`✅ [부분] ${field} → 컬럼 ${index} (${header})`);
                    break;
                }
            }
        });
        
        console.log('🗺️ 폴백 매핑 결과:', map);
        
        // 필수 컬럼 체크 (통화, 금액)
        const missingFields = [];
        if (map.currency === -1) missingFields.push('통화');
        if (map.amount === -1) missingFields.push('금액');
        
        if (missingFields.length > 0) {
            console.error('❌ 필수 컬럼 누락:', missingFields);
            console.error('📋 사용 가능한 헤더:', headers);
            console.error('📋 찾은 컬럼들:', map);
            
            // 더 자세한 에러 메시지 생성
            const headerList = headers
                .map((h, i) => `  [${i}] ${h}`)
                .join('\n');
            
            throw new Error(
                `필수 컬럼을 찾을 수 없습니다: ${missingFields.join(', ')}\n\n` +
                `📋 Excel 파일의 헤더 (총 ${headers.length}개):\n${headerList}\n\n` +
                `💡 인식 가능한 컬럼명:\n` +
                `  - 통화: ${mappingRules.currency.slice(0, 8).join(', ')} 등\n` +
                `  - 금액: ${mappingRules.amount.slice(0, 8).join(', ')} 등\n` +
                `  - 날짜: ${mappingRules.date.slice(0, 5).join(', ')} 등\n\n` +
                `해결 방법:\n` +
                `1. Excel 파일의 컬럼명을 확인하세요\n` +
                `2. 파일의 첫 행에 헤더가 있어야 합니다\n` +
                `3. 계속 문제가 발생하면 다른 형식의 파일을 시도해보세요`
            );
        }
        
        return map;
    }
    
    /**
     * 포지션 데이터 파싱
     */
    parsePositions(rows, columnMap) {
        const positions = [];
        
        // columnMap 유효성 검사
        if (!columnMap) {
            console.error('❌ columnMap이 정의되지 않았습니다');
            throw new Error('컬럼 매핑이 실패했습니다');
        }
        
        // 필수 컬럼 확인
        if (columnMap.currency === -1 || columnMap.amount === -1) {
            console.error('❌ 필수 컬럼 매핑 실패:', columnMap);
            console.error('📋 columnMap 상태:', columnMap);
            throw new Error('필수 컬럼(통화, 금액)을 찾을 수 없습니다');
        }
        
        console.log(`📊 행 파싱 시작: 총 ${rows.length}행, columnMap:`, columnMap);
        
        let validRowCount = 0;
        let skippedCount = 0;
        
        rows.forEach((row, rowIndex) => {
            try {
                // 행 데이터 검증
                if (!row || (Array.isArray(row) && row.length === 0)) {
                    skippedCount++;
                    return;
                }
                
                // 배열 또는 객체로 변환
                const rowData = Array.isArray(row) ? row : Object.values(row);
                
                // 통화 값 추출 (필수)
                const currencyValue = rowData[columnMap.currency];
                if (!currencyValue || String(currencyValue).trim() === '') {
                    skippedCount++;
                    return;
                }
                
                const currency = String(currencyValue).trim();
                
                // 금액 값 추출 (필수)
                const amountValue = rowData[columnMap.amount];
                if (amountValue === null || amountValue === undefined || String(amountValue).trim() === '') {
                    console.log(`⏭️ 행 ${rowIndex + 2} 건너뜀: 금액 값 없음`);
                    skippedCount++;
                    return;
                }
                
                const amountStr = String(amountValue).replace(/,/g, '').trim();
                const amount = parseFloat(amountStr);
                
                // 금액 유효성 검사 (0이 아닌지 확인)
                if (isNaN(amount)) {
                    console.log(`⏭️ 행 ${rowIndex + 2} 건너뜀: 유효하지 않은 금액 형식 (${amountStr})`);
                    skippedCount++;
                    return;
                }
                
                if (amount === 0) {
                    console.log(`⏭️ 행 ${rowIndex + 2} 건너뜀: 금액이 0`);
                    skippedCount++;
                    return;
                }
                
                // 유효한 데이터만 position 생성
                const position = {
                    id: `pos_${Date.now()}_${rowIndex}_${Math.random().toString(36).substr(2, 9)}`,
                    customerId: 'customer_1',  // 기본값
                    currency: currency,
                    amount: amount,
                    date: columnMap.date !== -1 ? this.parseDate(rowData[columnMap.date]) : new Date().toISOString().split('T')[0],
                    type: columnMap.type !== -1 ? String(rowData[columnMap.type] || 'exposure') : 'exposure',
                    counterparty: columnMap.counterparty !== -1 ? String(rowData[columnMap.counterparty] || '') : '',
                    bank: columnMap.bank !== -1 ? String(rowData[columnMap.bank] || '') : '',
                    hedgedAmount: 0,
                    hedgeStatus: 'unhedged'
                };
                
                positions.push(position);
                validRowCount++;
                
                if (validRowCount <= 3) {
                    console.log(`✅ 행 ${rowIndex + 2} 파싱 성공: ${currency} ${amount}`);
                }
                
            } catch (error) {
                console.warn(`⚠️ 행 ${rowIndex + 2} 파싱 실패:`, error.message);
                skippedCount++;
            }
        });
        
        console.log(`📊 파싱 완료: 유효한 행 ${validRowCount}개, 건너뛴 행 ${skippedCount}개`);
        
        if (validRowCount === 0) {
            console.error('❌ 파싱된 데이터가 없습니다');
            console.error('📋 행 데이터 샘플 (처음 3행):', rows.slice(0, 3));
            console.error('📋 columnMap:', columnMap);
            throw new Error(`유효한 데이터 행을 찾을 수 없습니다. (총 ${rows.length}행 중 통화와 금액이 있는 행 필요)`);
        }
        
        return positions;
    }
    
    /**
     * 날짜 파싱
     */
    parseDate(value) {
        if (!value) return new Date().toISOString().split('T')[0];
        
        try {
            // Excel 날짜 숫자인 경우
            if (typeof value === 'number') {
                const date = XLSX.SSF.parse_date_code(value);
                return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
            
            // 문자열 날짜
            const dateStr = String(value).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            
            // 기타 형식 처리
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }
            
        } catch (error) {
            console.warn('날짜 파싱 실패:', value);
        }
        
        return new Date().toISOString().split('T')[0];
    }
}

// 전역 인스턴스
window.excelParser = new ExcelParser();

console.log('✅ Excel Parser 로드 완료');
