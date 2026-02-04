/**
 * Excel Auto Mapper - 자동 컬럼 인식 및 데이터 마스킹
 * AI 패턴 매칭으로 자동 컬럼 인식, 고객은 확인만 하면 됨
 */

let excelData = null;
let excelHeaders = [];
let selectedFile = null;
let processedPositions = null;
let processedKPI = null;

/**
 * 컬럼 자동 인식 (AI 패턴 매칭)
 */
function autoDetectColumns(headers) {
    const mapping = {
        id: null,
        counterparty: null,
        currency: null,
        amount: null,
        settlementDate: null,
        type: null,
        hedgeStatus: null
    };
    
    headers.forEach((header, idx) => {
        const h = String(header || '').toLowerCase().trim().replace(/\s/g, '');
        
        // 거래 ID 패턴 (더 강화)
        if (!mapping.id && (
            h.includes('거래') || h.includes('번호') || h.includes('id') || 
            h.includes('no') || h === 'no.' || h.includes('관리번호') || 
            h.includes('전표') || h.includes('문서번호')
        )) {
            mapping.id = idx;
        }
        
        // 거래처 패턴 (더 강화)
        if (!mapping.counterparty && (
            h.includes('거래처') || h.includes('업체') || h.includes('회사') || 
            h.includes('고객') || h.includes('상대') || h.includes('counterparty') || 
            h.includes('company') || h.includes('customer') || h.includes('매입처') || 
            h.includes('매출처') || h.includes('공급') || h.includes('vendor')
        )) {
            mapping.counterparty = idx;
        }
        
        // 통화 패턴 (대폭 강화!)
        if (!mapping.currency && (
            h.includes('통화') || h.includes('currency') || h.includes('cur') ||
            h === 'usd' || h === 'eur' || h === 'jpy' || h === 'cny' ||
            h === 'krw' || h === 'gbp' || h === 'aud' || h === 'cad' ||
            h.includes('외화') || h.includes('화폐') || h.includes('fx') ||
            h.includes('화') || h.includes('통화코드') || h.includes('통화종류') ||
            h.includes('외화종류') || h.includes('외화코드') ||
            // 실제 통화 이름
            h.includes('달러') || h.includes('유로') || h.includes('엔') || 
            h.includes('위안') || h.includes('파운드') ||
            // 영문 통화명
            h.includes('dollar') || h.includes('euro') || h.includes('yen') ||
            h.includes('yuan') || h.includes('pound')
        )) {
            mapping.currency = idx;
            console.log('✅ 통화 컬럼 발견:', header, '(인덱스:', idx, ')');
        }
        
        // 금액 패턴 (더 강화)
        if (!mapping.amount && (
            h.includes('금액') || h.includes('amount') || h.includes('amt') || 
            h.includes('value') || h.includes('외화금액') || h.includes('외화') ||
            h.includes('잔액') || h.includes('balance') || h.includes('원화금액') ||
            h.includes('총액')
        )) {
            mapping.amount = idx;
        }
        
        // 결제일 패턴 (더 강화)
        if (!mapping.settlementDate && (
            h.includes('결제') || h.includes('만기') || h.includes('납기') || 
            h.includes('date') || h.includes('일자') || h.includes('settlement') ||
            h.includes('due') || h.includes('예정') || h.includes('도래') ||
            h.includes('지급') || h.includes('수령')
        )) {
            mapping.settlementDate = idx;
        }
        
        // 거래 유형 패턴 (더 강화)
        if (!mapping.type && (
            h.includes('유형') || h.includes('타입') || h.includes('type') || 
            h.includes('수출') || h.includes('수입') || h.includes('구분') ||
            h.includes('매출') || h.includes('매입') || h.includes('채권') || 
            h.includes('채무') || h.includes('export') || h.includes('import')
        )) {
            mapping.type = idx;
        }
        
        // 헤지 상태 패턴 (더 강화)
        if (!mapping.hedgeStatus && (
            h.includes('헤지') || h.includes('hedge') || h.includes('상태') || 
            h.includes('status') || h.includes('처리') || h.includes('진행')
        )) {
            mapping.hedgeStatus = idx;
        }
    });
    
    // 통화 컬럼을 못 찾은 경우 추가 로직
    if (mapping.currency === null) {
        console.warn('⚠️ 통화 컬럼을 자동 인식하지 못했습니다. 헤더:', headers);
        
        // 짧은 컬럼명 중에서 통화일 가능성이 높은 것 찾기
        headers.forEach((header, idx) => {
            const h = String(header || '').trim();
            if (h.length <= 4 && /^[A-Z]{3,4}$/.test(h)) {
                // USD, EUR, JPY 같은 형식
                mapping.currency = idx;
                console.log('✅ 통화 컬럼 추정:', header, '(짧은 대문자 코드)');
            }
        });
    }
    
    console.log('📋 컬럼 자동 매핑 결과:', mapping);
    return mapping;
}

/**
 * 데이터 마스킹 (개인정보 보호)
 */
function maskData(value, type) {
    if (!value) return value;
    
    const str = String(value);
    
    switch(type) {
        case 'counterparty':
            // "ABC 주식회사" -> "A*** 주식회사"
            if (str.length <= 2) return str;
            return str[0] + '***' + (str.length > 3 ? str.slice(-2) : '');
            
        case 'id':
            // "T2024001" -> "T202***1"
            if (str.length <= 3) return str;
            const start = str.slice(0, Math.min(4, str.length - 1));
            const end = str.slice(-1);
            return start + '***' + end;
            
        default:
            return value;
    }
}

/**
 * 엑셀 파일 읽기 (SheetJS 사용)
 */
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 첫 번째 시트 읽기
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error('엑셀 파일에 데이터가 없습니다.');
                }
                
                // 헤더와 데이터 분리
                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
                
                console.log('✅ 엑셀 파싱 완료:', rows.length, '행');
                
                resolve({ headers, rows });
                
            } catch (error) {
                reject(new Error('엑셀 파일 파싱 실패: ' + error.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기 실패'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * 컬럼 매핑 모달 표시
 */
function showColumnMappingModal() {
    const modal = document.getElementById('columnMappingModal');
    
    // 미리보기 생성
    const previewDiv = document.getElementById('excelPreview');
    const previewRows = excelData.slice(0, 3);
    
    let previewHTML = '<table class="w-full border"><thead><tr class="bg-gray-100">';
    excelHeaders.forEach(header => {
        previewHTML += `<th class="border px-2 py-1">${header || '(빈 컬럼)'}</th>`;
    });
    previewHTML += '</tr></thead><tbody>';
    
    previewRows.forEach(row => {
        previewHTML += '<tr>';
        excelHeaders.forEach((_, idx) => {
            previewHTML += `<td class="border px-2 py-1">${row[idx] || ''}</td>`;
        });
        previewHTML += '</tr>';
    });
    previewHTML += '</tbody></table>';
    
    previewDiv.innerHTML = previewHTML;
    
    // 드롭다운 옵션 생성
    const mappingFields = ['map_id', 'map_counterparty', 'map_currency', 'map_amount', 'map_settlementDate', 'map_type', 'map_hedgeStatus'];
    
    mappingFields.forEach(fieldId => {
        const select = document.getElementById(fieldId);
        select.innerHTML = '<option value="">-- 선택하세요 --</option>';
        
        excelHeaders.forEach((header, idx) => {
            select.innerHTML += `<option value="${idx}">${header || '컬럼 ' + (idx + 1)}</option>`;
        });
    });
    
    // 모달 표시
    modal.classList.add('active');
}

/**
 * 컬럼 매핑 취소
 */
function cancelColumnMapping() {
    document.getElementById('columnMappingModal').classList.remove('active');
}

/**
 * 매핑된 데이터 처리 (수동 매핑 시)
 */
async function processExcelWithMapping() {
    // 매핑 정보 가져오기
    const mapping = {
        id: parseInt(document.getElementById('map_id').value),
        counterparty: parseInt(document.getElementById('map_counterparty').value),
        currency: parseInt(document.getElementById('map_currency').value),
        amount: parseInt(document.getElementById('map_amount').value),
        settlementDate: parseInt(document.getElementById('map_settlementDate').value),
        type: document.getElementById('map_type').value !== '' ? parseInt(document.getElementById('map_type').value) : null,
        hedgeStatus: document.getElementById('map_hedgeStatus').value !== '' ? parseInt(document.getElementById('map_hedgeStatus').value) : null
    };
    
    // 필수 항목 체크
    const requiredFields = ['id', 'counterparty', 'currency', 'amount', 'settlementDate'];
    const missingFields = requiredFields.filter(field => isNaN(mapping[field]));
    
    if (missingFields.length > 0) {
        alert('⚠️ 필수 항목을 모두 선택해주세요:\n' + missingFields.map(f => {
            const names = { id: '거래 ID', counterparty: '거래처', currency: '통화', amount: '금액', settlementDate: '결제일' };
            return '- ' + names[f];
        }).join('\n'));
        return;
    }
    
    try {
        // 기존 컬럼 매핑 모달 닫기
        document.getElementById('columnMappingModal').classList.remove('active');
        
        // 자동 처리 실행
        const result = await processExcelData(mapping);
        
        processedPositions = result.positions;
        processedKPI = result.kpi;
        
        // 마스킹 확인 UI 표시
        showMaskingConfirmationModal(result);
        
    } catch (error) {
        console.error('❌ 데이터 처리 오류:', error);
        alert(`⚠️ 데이터 처리 실패\n\n${error.message}`);
    }
}

/**
 * 은행 엑셀 파일 처리 (마스킹)
 */
async function processBankExcelFile(file) {
    const data = await readExcelFile(file);
    const rows = data.rows;
    const headers = data.headers;
    
    console.log('🏦 은행 파일 헤더:', headers);
    console.log('🏦 은행 파일 행 수:', rows.length);
    
    // 은행 데이터 컬럼 자동 인식
    const bankMapping = {
        bank: null,
        accountNumber: null,
        currency: null,
        balance: null
    };
    
    headers.forEach((header, idx) => {
        const h = header.toLowerCase();
        
        if (h.includes('은행') || h.includes('bank')) {
            bankMapping.bank = idx;
        } else if (h.includes('계좌') || h.includes('account')) {
            bankMapping.accountNumber = idx;
        } else if (h.includes('통화') || h.includes('currency')) {
            bankMapping.currency = idx;
        } else if (h.includes('잔고') || h.includes('balance') || h.includes('금액') || h.includes('amount')) {
            bankMapping.balance = idx;
        }
    });
    
    console.log('🏦 은행 데이터 매핑:', bankMapping);
    
    // 은행 계좌 데이터 변환 및 마스킹
    const accounts = rows.map((row, index) => {
        const bankName = row[bankMapping.bank] ? String(row[bankMapping.bank]) : '은행';
        const accountNumber = row[bankMapping.accountNumber] ? String(row[bankMapping.accountNumber]) : '계좌번호';
        const currency = row[bankMapping.currency] ? String(row[bankMapping.currency]) : 'KRW';
        const balance = parseFloat(row[bankMapping.balance]) || 0;
        
        // 마스킹 처리
        const maskedBank = maskBankName(bankName);
        const maskedAccount = maskAccountNumber(accountNumber);
        const maskedBalance = Math.round(balance / 10000) * 10000; // 만원 단위로 마스킹
        
        return {
            bank: maskedBank,
            accountNumber: maskedAccount,
            currency: currency,
            balance: balance,
            maskedBalance: maskedBalance,
            originalBank: bankName,
            originalAccount: accountNumber
        };
    }).filter(acc => acc.balance > 0);
    
    return {
        accounts: accounts,
        totalCurrencies: [...new Set(accounts.map(a => a.currency))].length,
        timestamp: new Date().toISOString(),
        masked: true
    };
}

/**
 * 은행명 마스킹
 */
function maskBankName(bankName) {
    const bankMap = {
        '국민은행': '국민**',
        'kb국민은행': '국민**',
        '신한은행': '신한**',
        '하나은행': '하나**',
        '우리은행': '우리**',
        '기업은행': '기업**'
    };
    
    const key = bankName.toLowerCase().replace(/\s/g, '');
    for (const [original, masked] of Object.entries(bankMap)) {
        if (key.includes(original.toLowerCase())) {
            return masked;
        }
    }
    
    // 기본 마스킹: 첫 2글자만 표시
    if (bankName.length > 2) {
        return bankName.substring(0, 2) + '**';
    }
    return '은행**';
}

/**
 * 계좌번호 마스킹
 */
function maskAccountNumber(accountNumber) {
    const cleaned = accountNumber.replace(/[^0-9]/g, '');
    
    if (cleaned.length >= 8) {
        // 마지막 4자리만 표시
        return '****-****-' + cleaned.slice(-4);
    }
    return '****-****';
}

/**
 * 은행 데이터 생성 (마스킹) - 기존 함수 (폴더 없이 체크박스만 있을 때 사용)
 */
function generateMaskedBankData(positions) {
    // 통화별 예상 잔고 계산 (간단한 시뮬레이션)
    const currencyBalances = {};
    
    positions.forEach(p => {
        if (!currencyBalances[p.currency]) {
            currencyBalances[p.currency] = 0;
        }
        // 수출이면 +, 수입이면 -
        const factor = p.type === '수출' ? 1 : -1;
        currencyBalances[p.currency] += p.amount * factor;
    });
    
    // 은행별 마스킹된 잔고 데이터
    const banks = ['은행A', '은행B', '은행C'];
    const bankAccounts = [];
    
    Object.keys(currencyBalances).forEach((currency, idx) => {
        const balance = Math.abs(currencyBalances[currency]);
        const bankName = banks[idx % banks.length];
        
        bankAccounts.push({
            bank: bankName,  // 은행명 마스킹
            accountNumber: `****-****-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,  // 계좌번호 마스킹
            currency: currency,
            balance: Math.round(balance),  // 잔고 (마스킹 불필요, 통화별 총액이므로)
            maskedBalance: Math.round(balance / 10) * 10,  // 10단위로 반올림하여 마스킹
            lastUpdated: new Date().toISOString()
        });
    });
    
    return {
        accounts: bankAccounts,
        totalCurrencies: Object.keys(currencyBalances).length,
        timestamp: new Date().toISOString(),
        masked: true
    };
}

/**
 * 파일 선택 핸들러
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        return;
    }
    
    // 파일 확장자 체크
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = validExtensions.includes(fileExtension);
    
    if (!isValidExtension) {
        alert('⚠️ 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        event.target.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        return;
    }
    
    // 파일 크기 체크 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('⚠️ 파일 크기는 10MB 이하여야 합니다.');
        event.target.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        return;
    }
    
    selectedFile = file;
    document.getElementById('selectedFileName').textContent = file.name;
    document.getElementById('uploadBtn').disabled = false;
    
    console.log('✅ 파일 선택됨:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
}

/**
 * 폴더 선택 핸들러
 */
async function handleFolderSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        return;
    }
    
    // 엑셀 파일만 필터링
    const excelFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ext === 'xlsx' || ext === 'xls';
    });
    
    if (excelFiles.length === 0) {
        alert('⚠️ 폴더 내에 엑셀 파일(.xlsx, .xls)이 없습니다.');
        event.target.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        return;
    }
    
    // 파일 분석: 더존 거래 데이터 vs 은행 데이터
    const analysis = analyzeExcelFiles(excelFiles);
    
    console.log('📁 폴더 분석 결과:', analysis);
    
    // 사용자에게 확인
    let message = `📁 폴더 내 엑셀 파일 ${excelFiles.length}개 발견\n\n`;
    
    if (analysis.tradeFiles.length > 0) {
        message += `📋 거래 데이터 (더존/ERP): ${analysis.tradeFiles.length}개\n`;
        analysis.tradeFiles.forEach(f => message += `  - ${f.name}\n`);
    }
    
    if (analysis.bankFiles.length > 0) {
        message += `\n🏦 은행 잔고 데이터: ${analysis.bankFiles.length}개\n`;
        analysis.bankFiles.forEach(f => message += `  - ${f.name}\n`);
    }
    
    if (analysis.unknownFiles.length > 0) {
        message += `\n❓ 기타 파일: ${analysis.unknownFiles.length}개\n`;
        analysis.unknownFiles.forEach(f => message += `  - ${f.name}\n`);
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (analysis.tradeFiles.length > 0 && analysis.bankFiles.length > 0) {
        message += `\n✅ 거래 데이터와 은행 잔고를 모두 처리하시겠습니까?\n\n`;
        message += `💡 두 데이터를 함께 처리하면:\n`;
        message += `• 실시간 유동성 분석\n`;
        message += `• 결제일 대비 잔고 충분성 검증\n`;
        message += `• 최적 헤지 타이밍 제안\n`;
        message += `\n※ 모든 데이터는 안전하게 마스킹 처리됩니다.`;
        
        if (confirm(message)) {
            // 두 파일 모두 처리
            selectedFile = analysis.tradeFiles[0];
            window.selectedBankFile = analysis.bankFiles[0];
            document.getElementById('selectedFileName').textContent = `📋 ${analysis.tradeFiles[0].name} + 🏦 ${analysis.bankFiles[0].name}`;
            document.getElementById('uploadBtn').disabled = false;
            console.log('✅ 거래 + 은행 데이터 선택됨');
        } else {
            selectedFile = null;
            window.selectedBankFile = null;
            document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
            document.getElementById('uploadBtn').disabled = true;
        }
    } else if (analysis.tradeFiles.length > 0) {
        message += `\n거래 데이터만 처리하시겠습니까?`;
        
        if (confirm(message)) {
            selectedFile = analysis.tradeFiles[0];
            window.selectedBankFile = null;
            document.getElementById('selectedFileName').textContent = `📋 ${selectedFile.name}`;
            document.getElementById('uploadBtn').disabled = false;
            console.log('✅ 거래 데이터만 선택됨');
        } else {
            selectedFile = null;
            document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
            document.getElementById('uploadBtn').disabled = true;
        }
    } else if (analysis.bankFiles.length > 0) {
        alert('⚠️ 은행 데이터만 있습니다.\n거래 데이터(더존/ERP)가 필요합니다.');
        event.target.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
    } else {
        alert('⚠️ 처리 가능한 파일이 없습니다.');
        event.target.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
    }
}

/**
 * 엑셀 파일 분석 (더존 vs 은행)
 */
function analyzeExcelFiles(files) {
    const tradeFiles = [];
    const bankFiles = [];
    const unknownFiles = [];
    
    files.forEach(file => {
        const name = file.name.toLowerCase();
        
        // 거래 데이터 파일명 패턴
        if (name.includes('거래') || name.includes('trade') || 
            name.includes('더존') || name.includes('erp') ||
            name.includes('수출') || name.includes('수입') ||
            name.includes('외화') || name.includes('채권') || name.includes('채무')) {
            tradeFiles.push(file);
        }
        // 은행 잔고 파일명 패턴
        else if (name.includes('은행') || name.includes('bank') ||
                 name.includes('잔고') || name.includes('balance') ||
                 name.includes('계좌') || name.includes('account')) {
            bankFiles.push(file);
        }
        // 기타
        else {
            // 파일명으로 판단 안 되면 거래 데이터로 간주
            tradeFiles.push(file);
        }
    });
    
    return { tradeFiles, bankFiles, unknownFiles };
}

/**
 * 엑셀 파일 업로드 - 자동 처리 후 확인 UI 표시
 */
async function uploadExcelFile() {
    if (!selectedFile) {
        alert('⚠️ 파일을 먼저 선택해주세요.');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    
    try {
        // UI 업데이트
        uploadBtn.disabled = true;
        uploadBtn.textContent = '파일 읽는 중...';
        
        // 1단계: 거래 데이터 엑셀 파일 읽기
        const data = await readExcelFile(selectedFile);
        excelData = data.rows;
        excelHeaders = data.headers;
        
        uploadBtn.textContent = '자동 분석 중...';
        
        // 2단계: 컬럼 자동 인식
        const mapping = autoDetectColumns(excelHeaders);
        
        // 필수 항목 체크
        const requiredFields = ['id', 'counterparty', 'currency', 'amount', 'settlementDate'];
        const missingFields = requiredFields.filter(field => mapping[field] === null);
        
        if (missingFields.length > 0) {
            alert('⚠️ 필수 컬럼을 자동으로 인식하지 못했습니다.\n수동으로 선택해주세요:\n' + missingFields.map(f => {
                const names = { id: '거래 ID', counterparty: '거래처', currency: '통화', amount: '금액', settlementDate: '결제일' };
                return '- ' + names[f];
            }).join('\n'));
            
            // 수동 매핑 모달 표시
            showManualMappingModal(mapping);
            uploadBtn.disabled = false;
            uploadBtn.textContent = '⬆️ 업로드 및 계산';
            return;
        }
        
        // 은행 파일이 있으면 함께 처리
        let bankData = null;
        if (window.selectedBankFile) {
            try {
                uploadBtn.textContent = '🏦 은행 데이터 처리 중...';
                console.log('🏦 은행 파일 처리:', window.selectedBankFile.name);
                bankData = await processBankExcelFile(window.selectedBankFile);
                console.log('✅ 은행 데이터 처리 완료:', bankData);
            } catch (bankError) {
                console.warn('⚠️ 은행 파일 처리 실패:', bankError);
                // 은행 파일 실패해도 계속 진행
            }
        }
        
        uploadBtn.textContent = '데이터 처리 중...';
        
        // 3단계: 거래 데이터 변환 및 마스킹
        const result = await processExcelData(mapping);
        
        processedPositions = result.positions;
        processedKPI = result.kpi;
        
        // 은행 데이터 추가
        if (bankData) {
            result.bankData = bankData;
            window.processedBankData = bankData;
        }
        
        // 4단계: 마스킹 확인 UI 표시
        showMaskingConfirmationModal(result);
        
        // UI 복원
        uploadBtn.disabled = false;
        uploadBtn.textContent = '⬆️ 업로드 및 계산';
        
    } catch (error) {
        console.error('❌ 파일 처리 오류:', error);
        alert(`⚠️ 파일 처리 실패\n\n${error.message}\n\n다시 시도해주세요.`);
        uploadBtn.disabled = false;
        uploadBtn.textContent = '⬆️ 업로드 및 계산';
    }
}

/**
 * 데이터 자동 처리
 */
async function processExcelData(mapping) {
    // 데이터 변환
    const positions = excelData.map((row, index) => {
        const amount = parseFloat(row[mapping.amount]) || 0;
        const currency = String(row[mapping.currency] || '').toUpperCase();
        
        // 환율
        const exchangeRates = { 'USD': 1350, 'EUR': 1450, 'JPY': 9.5, 'CNY': 185 };
        const rate = exchangeRates[currency] || 1350;
        
        // 거래 유형
        let type = mapping.type !== null ? String(row[mapping.type] || '') : '';
        if (!type) {
            type = amount >= 0 ? '수출' : '수입';
        }
        
        // 헤지 상태
        let hedgeStatus = mapping.hedgeStatus !== null ? String(row[mapping.hedgeStatus] || '미헤지') : '미헤지';
        
        // 결제일 파싱
        let settlementDate = row[mapping.settlementDate];
        if (typeof settlementDate === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + settlementDate * 86400000);
            settlementDate = jsDate.toISOString().split('T')[0];
        }
        
        // D-day 계산
        const today = new Date();
        const settlement = new Date(settlementDate);
        const daysUntil = Math.ceil((settlement - today) / (1000 * 60 * 60 * 24));
        
        // 원본 데이터
        const original = {
            id: String(row[mapping.id] || `T${String(index + 1).padStart(7, '0')}`),
            counterparty: String(row[mapping.counterparty] || '거래처')
        };
        
        return {
            id: maskData(original.id, 'id'),  // 화면 표시용 = 마스킹
            counterparty: maskData(original.counterparty, 'counterparty'),  // 화면 표시용 = 마스킹
            maskedId: maskData(original.id, 'id'),
            maskedCounterparty: maskData(original.counterparty, 'counterparty'),
            originalId: original.id,  // 로컬 저장용 원본
            originalCounterparty: original.counterparty,  // 로컬 저장용 원본
            currency: currency,
            amount: Math.abs(amount),
            paymentDate: settlementDate,  // renderPositions()에서 사용
            settlementDate: settlementDate,
            type: type,
            krwAmount: Math.abs(amount) * rate,
            dday: daysUntil,  // renderPositions()에서 사용
            daysUntil: daysUntil,
            hedgeStatus: hedgeStatus
        };
    }).filter(p => p.amount > 0);
    
    console.log('✅ 데이터 변환 완료:', positions.length, '건');
    
    // KPI 계산
    const totalExposure = positions.reduce((sum, p) => sum + p.krwAmount, 0);
    const hedgedAmount = positions.reduce((sum, p) => {
        if (p.hedgeStatus === '전액헤지' || p.hedgeStatus === '부분헤지') {
            return sum + (p.hedgeStatus === '전액헤지' ? p.krwAmount : p.krwAmount * 0.5);
        }
        return sum;
    }, 0);
    
    const currentRatio = totalExposure > 0 ? (hedgedAmount / totalExposure * 100) : 0;
    const targetRatio = typeof userSettings !== 'undefined' && userSettings?.targetHedgeRatio || 70;
    
    const kpi = {
        totalExposure: totalExposure,
        hedgedAmount: hedgedAmount,
        currentHedgeRatio: Math.round(currentRatio * 10) / 10,
        targetHedgeRatio: targetRatio,
        gap: Math.round((currentRatio - targetRatio) * 10) / 10,
        unhedgedAmount: totalExposure - hedgedAmount
    };
    
    return { positions, kpi, mapping };
}

/**
 * 마스킹 확인 모달 표시
 */
function showMaskingConfirmationModal(result) {
    const modal = document.getElementById('columnMappingModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // 모달 내용 교체
    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">🔒 데이터 마스킹 확인</h2>
        <p class="text-sm text-gray-600 mb-6">
            개인정보 보호를 위해 거래처명과 거래 ID가 자동으로 마스킹되었습니다.<br>
            <strong class="text-blue-600">서버에는 마스킹된 데이터만 전송됩니다.</strong> 확인 후 계산을 진행하세요.
        </p>
        
        <!-- KPI 요약 -->
        <div class="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 class="font-bold text-sm mb-3">📊 분석 결과 요약</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">총 거래 건수:</span>
                    <span class="font-bold ml-2">${result.positions.length}건</span>
                </div>
                <div>
                    <span class="text-gray-600">총 노출액:</span>
                    <span class="font-bold ml-2 text-blue-600">${formatKRW(result.kpi.totalExposure)}</span>
                </div>
                <div>
                    <span class="text-gray-600">현재 헤지 비율:</span>
                    <span class="font-bold ml-2">${result.kpi.currentHedgeRatio}%</span>
                </div>
                <div>
                    <span class="text-gray-600">목표 대비:</span>
                    <span class="font-bold ml-2 ${result.kpi.gap < 0 ? 'text-red-600' : 'text-green-600'}">
                        ${result.kpi.gap > 0 ? '+' : ''}${result.kpi.gap}%p
                    </span>
                </div>
            </div>
        </div>
        
        <!-- 마스킹 데이터 미리보기 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6" style="max-height: 300px; overflow-y: auto;">
            <h3 class="font-bold text-sm mb-3">🔍 마스킹된 데이터 미리보기 (최대 5건)</h3>
            <table class="w-full text-xs">
                <thead class="bg-gray-200 sticky top-0">
                    <tr>
                        <th class="border px-2 py-1">거래 ID</th>
                        <th class="border px-2 py-1">거래처</th>
                        <th class="border px-2 py-1">통화</th>
                        <th class="border px-2 py-1">금액</th>
                        <th class="border px-2 py-1">결제일</th>
                        <th class="border px-2 py-1">상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.positions.slice(0, 5).map(p => `
                        <tr>
                            <td class="border px-2 py-1 font-mono text-blue-600">${p.maskedId}</td>
                            <td class="border px-2 py-1 font-mono text-blue-600">${p.maskedCounterparty}</td>
                            <td class="border px-2 py-1">${p.currency}</td>
                            <td class="border px-2 py-1 text-right">${p.amount.toLocaleString()}</td>
                            <td class="border px-2 py-1">${p.settlementDate}</td>
                            <td class="border px-2 py-1">${p.hedgeStatus}</td>
                        </tr>
                    `).join('')}
                    ${result.positions.length > 5 ? `
                        <tr>
                            <td colspan="6" class="border px-2 py-1 text-center text-gray-500">
                                ... 외 ${result.positions.length - 5}건
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        
        <!-- 안내 메시지 -->
        <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-4">
            <p class="text-xs text-yellow-800 mb-3">
                <strong>📋 데이터 형식 안내:</strong><br>
                현재 <strong class="text-blue-600">더존(ERP) 형식</strong>의 거래 데이터를 처리했습니다.<br>
                거래처명과 ID가 안전하게 마스킹되었습니다.
            </p>
        </div>

        <!-- 은행 데이터 추가 옵션 -->
        <div class="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-6">
            <div class="flex items-start gap-3">
                <input 
                    type="checkbox" 
                    id="includeBankData" 
                    class="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                >
                <div class="flex-1">
                    <label for="includeBankData" class="text-sm font-bold text-purple-900 cursor-pointer">
                        🏦 은행 잔고 데이터도 함께 전송하시겠습니까?
                    </label>
                    <p class="text-xs text-purple-700 mt-1">
                        은행 데이터를 추가하면 <strong>더 다양한 분석</strong>이 가능합니다:<br>
                        • 실시간 유동성 분석<br>
                        • 결제 예정일 대비 잔고 충분성<br>
                        • 통화별 보유 현금 분석<br>
                        • 최적 헤지 타이밍 제안<br>
                        <span class="text-purple-900 font-semibold mt-1 block">
                        ※ 은행 잔고도 안전하게 마스킹 처리되어 전송됩니다.
                        </span>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- 기존 안내 메시지 -->
        <div class="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
            <p class="text-xs text-green-800">
                <strong>✓ 자동 인식 완료:</strong> 모든 필수 컬럼이 자동으로 인식되었습니다.<br>
                <strong>✓ 데이터 마스킹:</strong> 거래처명과 ID가 안전하게 마스킹되었습니다.<br>
                <strong>✓ 로컬 저장:</strong> 원본 데이터는 브라우저에만 저장됩니다.
            </p>
        </div>
        
        <!-- 버튼 -->
        <div class="flex gap-3">
            <button 
                onclick="cancelMaskingConfirmation()" 
                class="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
            >
                취소
            </button>
            <button 
                onclick="confirmAndProcess()" 
                class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
                ✓ 확인 완료 - 계산 진행
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

/**
 * 마스킹 확인 취소
 */
function cancelMaskingConfirmation() {
    document.getElementById('columnMappingModal').classList.remove('active');
    processedPositions = null;
    processedKPI = null;
    
    // 파일 입력 초기화
    const fileInput = document.getElementById('excelFileInput');
    if (fileInput) fileInput.value = '';
    selectedFile = null;
    document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
    document.getElementById('uploadBtn').disabled = true;
}

/**
 * 확인 후 데이터 처리
 */
async function confirmAndProcess() {
    if (!processedPositions || !processedKPI) {
        alert('⚠️ 처리된 데이터가 없습니다.');
        return;
    }
    
    try {
        console.log('🚀 데이터 처리 시작...');
        
        // 은행 데이터 포함 여부 확인
        const includeBankData = document.getElementById('includeBankData')?.checked || false;
        console.log('🏦 은행 데이터 포함:', includeBankData);
        
        // 마스킹된 데이터로 변환 (서버 전송용)
        const maskedPositions = processedPositions.map(p => ({
            id: p.maskedId,
            counterparty: p.maskedCounterparty,
            currency: p.currency,
            amount: p.amount,
            settlementDate: p.settlementDate,
            type: p.type,
            krwAmount: p.krwAmount,
            daysUntil: p.daysUntil,
            hedgeStatus: p.hedgeStatus
        }));
        
        // 은행 데이터 생성 (포함하는 경우)
        let bankData = null;
        if (includeBankData) {
            bankData = generateMaskedBankData(processedPositions);
            console.log('🏦 은행 데이터 생성:', bankData);
        }
        
        // 1. 로컬 브라우저 저장 (즉시)
        console.log('💾 브라우저 로컬 스토리지 저장...');
        localStorage.setItem('hedge_positions', JSON.stringify(processedPositions));
        localStorage.setItem('hedge_kpi', JSON.stringify(processedKPI));
        if (bankData) {
            localStorage.setItem('hedge_bank_data', JSON.stringify(bankData));
        }
        
        // 2. UI 업데이트 (즉시 - 로딩 해제)
        console.log('🎨 UI 업데이트 시작...');
        console.log('데이터 샘플:', processedPositions[0]);
        
        // processedPositions는 이미 마스킹된 데이터 (id, counterparty가 마스킹됨)
        if (typeof currentPositions !== 'undefined') {
            currentPositions = processedPositions;
            console.log('✅ currentPositions 업데이트:', currentPositions.length, '건');
        }
        if (typeof currentKPI !== 'undefined') {
            currentKPI = processedKPI;
            console.log('✅ currentKPI 업데이트:', currentKPI);
        }
        
        // 전역 window 스코프에서 함수 호출
        if (typeof window.renderPositions === 'function') {
            console.log('📊 window.renderPositions 호출, 데이터:', processedPositions.length, '건');
            window.renderPositions(processedPositions);
        } else if (typeof renderPositions === 'function') {
            console.log('📊 renderPositions 호출, 데이터:', processedPositions.length, '건');
            renderPositions(processedPositions);
        } else {
            console.error('❌ renderPositions 함수를 찾을 수 없습니다!');
        }
        
        if (typeof window.renderKPI === 'function') {
            console.log('📈 window.renderKPI 호출');
            window.renderKPI(processedKPI);
        } else if (typeof renderKPI === 'function') {
            console.log('📈 renderKPI 호출');
            renderKPI(processedKPI);
        } else {
            console.error('❌ renderKPI 함수를 찾을 수 없습니다!');
        }
        
        const tradeCountEl = document.getElementById('tradeCount');
        if (tradeCountEl) {
            tradeCountEl.textContent = `${processedPositions.length}건`;
            console.log('✅ tradeCount 업데이트:', processedPositions.length, '건');
        } else {
            console.warn('⚠️ tradeCount 엘리먼트를 찾을 수 없습니다');
        }
        
        // 모달 닫기 (로딩 해제)
        document.getElementById('columnMappingModal').classList.remove('active');
        
        console.log('✅ 데이터 로드 완료! 화면에 표시됨');
        
        // 3. 백그라운드 작업: 로컬 폴더 저장 (비동기 - UI 블로킹 없음)
        setTimeout(async () => {
            try {
                console.log('📁 백그라운드: 로컬 폴더 저장 시도...');
                await saveToLocalFolder({
                    originalFile: selectedFile,  // 원본 엑셀 파일
                    positions: processedPositions,
                    maskedPositions: maskedPositions,
                    kpi: processedKPI,
                    timestamp: new Date().toISOString()
                });
                console.log('✅ 로컬 폴더 저장 완료');
            } catch (folderError) {
                console.warn('⚠️ 로컬 폴더 저장 실패:', folderError.message);
            }
        }, 100);
        
        // 4. 백그라운드 작업: 서버 전송 (비동기 - UI 블로킹 없음)
        setTimeout(async () => {
            try {
                console.log('🌐 백그라운드: 서버로 데이터 전송...');
                const API_BASE = window.location.origin;
                
                const payload = {
                    positions: maskedPositions,
                    maskedPositions: maskedPositions,
                    kpi: processedKPI,
                    timestamp: new Date().toISOString(),
                    source: 'excel_upload',
                    customerId: 'default'  // 나중에 로그인 시스템으로 교체
                };
                
                // 은행 데이터 포함
                if (bankData) {
                    payload.bankData = bankData;
                    payload.includeBankData = true;
                    console.log('🏦 은행 데이터 포함하여 전송');
                }
                
                const response = await fetch(`${API_BASE}/api/hedge/positions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ 서버 전송 완료:', result);
                } else {
                    console.warn('⚠️ 서버 응답 오류:', response.status);
                }
            } catch (serverError) {
                console.warn('⚠️ 서버 전송 실패 (로컬 저장은 완료됨):', serverError.message);
            }
        }, 200);
        
        // 파일 입력 초기화
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) fileInput.value = '';
        selectedFile = null;
        document.getElementById('selectedFileName').textContent = '선택된 파일 없음';
        document.getElementById('uploadBtn').disabled = true;
        
        // 성공 메시지
        alert(`✅ 데이터 처리 완료!\n\n처리된 거래: ${maskedPositions.length}건\n총 노출액: ${formatKRW(processedKPI.totalExposure)}\n현재 헤지 비율: ${processedKPI.currentHedgeRatio}%\n목표 대비: ${processedKPI.gap > 0 ? '+' : ''}${processedKPI.gap}%p\n\n✓ 브라우저 저장: 완료\n✓ 로컬 폴더/서버 저장: 백그라운드 진행중\n※ 모든 데이터가 마스킹 처리되었습니다.`);
        
        // 데이터 초기화
        processedPositions = null;
        processedKPI = null;
        
        console.log('✅ 모든 처리 완료');
        
    } catch (error) {
        console.error('❌ 데이터 처리 오류:', error);
        alert(`⚠️ 데이터 처리 실패\n\n${error.message}`);
    }
}

/**
 * 로컬 폴더에 자동 저장 (강제 폴더 구조)
 * Downloads/HEDGEFREEDOM/ 에 모든 데이터 저장
 */
async function saveToLocalFolder(data) {
    // File System Access API 지원 확인
    if (!('showDirectoryPicker' in window)) {
        console.warn('⚠️ 브라우저가 로컬 폴더 저장을 지원하지 않습니다.');
        return false;
    }
    
    try {
        // 전역 폴더 핸들 가져오기 또는 생성
        const downloadsHandle = await getOrCreateDownloadsHandle();
        
        if (!downloadsHandle) {
            console.warn('⚠️ 폴더 핸들을 가져올 수 없습니다.');
            return false;
        }
        
        // HEDGEFREEDOM 폴더 강제 생성
        const hedgeFolder = await downloadsHandle.getDirectoryHandle('HEDGEFREEDOM', { create: true });
        console.log('📁 HEDGEFREEDOM 폴더 확인/생성 완료');
        
        // 하위 폴더 구조 강제 생성
        const folders = {
            uploads: await hedgeFolder.getDirectoryHandle('uploads', { create: true }),      // 업로드된 원본 엑셀
            masked: await hedgeFolder.getDirectoryHandle('masked', { create: true }),        // 마스킹된 데이터
            reports: await hedgeFolder.getDirectoryHandle('reports', { create: true }),      // 생성된 보고서
            positions: await hedgeFolder.getDirectoryHandle('positions', { create: true }),  // 포지션 데이터
            backup: await hedgeFolder.getDirectoryHandle('backup', { create: true }),        // 일일 백업
            kpi: await hedgeFolder.getDirectoryHandle('kpi', { create: true })               // KPI 데이터
        };
        console.log('✅ 하위 폴더 구조 생성 완료:', Object.keys(folders).join(', '));
        
        // 타임스탬프 생성
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        // 0. 원본 업로드 파일 저장 (uploads 폴더)
        if (data.originalFile) {
            const originalFileName = data.originalFile.name;
            const fileExtension = originalFileName.split('.').pop();
            const uploadFile = await folders.uploads.getFileHandle(
                `upload_${dateStr}_${timeStr}.${fileExtension}`, 
                { create: true }
            );
            const uploadWritable = await uploadFile.createWritable();
            await uploadWritable.write(data.originalFile);
            await uploadWritable.close();
            console.log('✅ 원본 엑셀 파일 저장:', `upload_${dateStr}_${timeStr}.${fileExtension}`);
        }
        
        // 1. 원본 데이터 저장 (positions 폴더)
        const positionsFile = await folders.positions.getFileHandle(
            `positions_${dateStr}_${timeStr}.json`, 
            { create: true }
        );
        const positionsWritable = await positionsFile.createWritable();
        await positionsWritable.write(JSON.stringify({
            timestamp: data.timestamp,
            positions: data.positions,
            count: data.positions.length
        }, null, 2));
        await positionsWritable.close();
        console.log('✅ 포지션 데이터 저장:', `positions_${dateStr}_${timeStr}.json`);
        
        // 2. 마스킹된 데이터 저장 (masked 폴더)
        const maskedFile = await folders.masked.getFileHandle(
            `masked_${dateStr}_${timeStr}.json`, 
            { create: true }
        );
        const maskedWritable = await maskedFile.createWritable();
        await maskedWritable.write(JSON.stringify({
            timestamp: data.timestamp,
            maskedPositions: data.maskedPositions,
            count: data.maskedPositions.length,
            note: '이 데이터는 개인정보 보호를 위해 마스킹 처리되었습니다.'
        }, null, 2));
        await maskedWritable.close();
        console.log('✅ 마스킹 데이터 저장:', `masked_${dateStr}_${timeStr}.json`);
        
        // 3. KPI 데이터 저장 (kpi 폴더)
        const kpiFile = await folders.kpi.getFileHandle(
            `kpi_${dateStr}_${timeStr}.json`, 
            { create: true }
        );
        const kpiWritable = await kpiFile.createWritable();
        await kpiWritable.write(JSON.stringify({
            timestamp: data.timestamp,
            kpi: data.kpi
        }, null, 2));
        await kpiWritable.close();
        console.log('✅ KPI 데이터 저장:', `kpi_${dateStr}_${timeStr}.json`);
        
        // 4. 일일 백업 (backup 폴더 - 하루에 한 번)
        const backupFile = await folders.backup.getFileHandle(
            `backup_${dateStr}.json`, 
            { create: true }
        );
        const backupWritable = await backupFile.createWritable();
        await backupWritable.write(JSON.stringify({
            date: dateStr,
            lastUpdate: data.timestamp,
            positions: data.positions,
            maskedPositions: data.maskedPositions,
            kpi: data.kpi
        }, null, 2));
        await backupWritable.close();
        console.log('✅ 일일 백업 저장:', `backup_${dateStr}.json`);
        
        console.log('🎉 모든 데이터 저장 완료!');
        
        // 폴더 설정 완료 플래그 저장
        localStorage.setItem('hedge_folder_configured', 'true');
        
        return true;
        
    } catch (error) {
        console.error('❌ 로컬 폴더 저장 오류:', error);
        if (error.name === 'AbortError') {
            console.warn('⚠️ 사용자가 폴더 선택을 취소했습니다.');
        }
        return false;
    }
}

/**
 * Downloads 폴더 핸들 가져오기 또는 생성
 */
async function getOrCreateDownloadsHandle() {
    // 저장된 핸들이 있는지 확인 (IndexedDB 사용)
    const db = await openHandleDB();
    let handle = await loadHandleFromDB(db);
    
    if (!handle) {
        // 처음 사용 - Downloads 폴더 선택 요청
        console.log('📁 Downloads 폴더를 선택해주세요 (최초 1회만)');
        
        try {
            handle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'downloads'
            });
            
            // 핸들 저장
            await saveHandleToDB(db, handle);
            console.log('✅ Downloads 폴더 핸들 저장됨:', handle.name);
            
            // 설정 완료 표시
            showFolderConfigSuccess();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⚠️ 폴더 선택이 취소되었습니다.');
                return null;
            }
            throw error;
        }
    } else {
        console.log('✅ 저장된 폴더 핸들 사용:', handle.name);
    }
    
    return handle;
}

/**
 * 폴더 설정 완료 알림
 */
function showFolderConfigSuccess() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
    `;
    message.innerHTML = `
        ✅ 폴더 설정 완료!<br>
        <small>앞으로 자동으로 저장됩니다.</small>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.transition = 'opacity 0.5s';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

/**
 * 페이지 로드 시 폴더 자동 설정 확인
 */
async function checkAndSetupFolder() {
    // File System Access API 미지원 브라우저는 스킵
    if (!('showDirectoryPicker' in window)) {
        return;
    }
    
    // 이미 설정된 경우 스킵
    const configured = localStorage.getItem('hedge_folder_configured');
    if (configured === 'true') {
        console.log('✅ 폴더 이미 설정됨');
        return;
    }
    
    // 최초 설정 요청
    const userConfirm = confirm(
        '📁 HedgeFreedom 로컬 저장 설정\n\n' +
        '데이터를 안전하게 보관하기 위해\n' +
        'Downloads 폴더를 선택해주세요.\n\n' +
        '✓ 최초 1회만 선택\n' +
        '✓ HEDGEFREEDOM 폴더 자동 생성\n' +
        '✓ 이후 자동 저장\n\n' +
        '지금 설정하시겠습니까?'
    );
    
    if (userConfirm) {
        try {
            await getOrCreateDownloadsHandle();
        } catch (error) {
            console.warn('⚠️ 폴더 설정 실패:', error);
        }
    }
}

/**
 * IndexedDB 열기 (핸들 저장용)
 */
function openHandleDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HedgeFreedomDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };
    });
}

/**
 * IndexedDB에서 핸들 로드
 */
async function loadHandleFromDB(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['handles'], 'readonly');
        const store = transaction.objectStore('handles');
        const request = store.get('downloadsFolder');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * IndexedDB에 핸들 저장
 */
async function saveHandleToDB(db, handle) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['handles'], 'readwrite');
        const store = transaction.objectStore('handles');
        const request = store.put(handle, 'downloadsFolder');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * 수동 매핑 모달 표시 (자동 인식 실패 시)
 */
function showManualMappingModal(autoMapping) {
    // 기존 컬럼 매핑 모달 재사용
    showColumnMappingModal();
    
    // 자동 인식된 값 미리 선택
    Object.keys(autoMapping).forEach(field => {
        const select = document.getElementById(`map_${field}`);
        if (select && autoMapping[field] !== null) {
            select.value = autoMapping[field];
        }
    });
}

// Helper: formatKRW
function formatKRW(amount) {
    if (!amount) return '0원';
    const billion = Math.floor(amount / 100000000);
    const million = Math.floor((amount % 100000000) / 10000);
    
    if (billion > 0) {
        return million > 0 ? `${billion}억 ${million}만원` : `${billion}억원`;
    }
    return `${million}만원`;
}
