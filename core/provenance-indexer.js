/**
 * 📚 프로비넌스 인덱서 (Provenance Indexer)
 * 
 * 모든 데이터 처리 이력을 인덱싱하고 검색 가능하게 합니다.
 * 감사 대응, 회계 처리, 규제 준수를 위한 완전한 문서 보관소입니다.
 * 
 * 주요 기능:
 * - 모든 프로비넌스 자동 저장 및 인덱싱
 * - 다차원 검색 (날짜, 파일명, ERP, 품질, 사용자)
 * - 전문 검색 (Full-text Search)
 * - 감사용 내보내기 (ZIP with JSON + Excel)
 * - 통계 및 대시보드
 */

class ProvenanceIndexer {
    constructor() {
        this.dbName = 'ProvenanceArchive';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = 'provenances';
        this.useIndexedDB = true; // IndexedDB 사용 여부 플래그
        
        console.log('📚 ProvenanceIndexer 초기화');
    }

    /**
     * IndexedDB 초기화 (에러 복구 포함)
     */
    async initialize() {
        // 이미 초기화 시도했고 실패한 경우
        if (!this.useIndexedDB) {
            console.warn('⚠️ IndexedDB를 사용할 수 없어 로컬 폴백 모드 사용');
            return this.db || null;
        }

        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => {
                    console.error('❌ IndexedDB 열기 실패:', request.error?.message || request.error);
                    console.log('   에러 종류:', request.error?.name);
                    
                    // IndexedDB 사용 불가능하게 설정
                    this.useIndexedDB = false;
                    
                    // 데이터베이스 삭제 시도 (손상된 DB 복구)
                    try {
                        console.log('🔧 손상된 IndexedDB 정리 중...');
                        const deleteRequest = indexedDB.deleteDatabase(this.dbName);
                        deleteRequest.onsuccess = () => {
                            console.log('✅ IndexedDB 초기화 완료 - 다시 시도');
                            // 재시도
                            setTimeout(() => this.initialize().then(resolve).catch(reject), 500);
                        };
                        deleteRequest.onerror = () => {
                            console.warn('⚠️ IndexedDB 삭제 실패, 로컬 폴백 모드로 전환');
                            resolve(null);
                        };
                    } catch (cleanupError) {
                        console.warn('⚠️ IndexedDB 정리 중 오류:', cleanupError);
                        resolve(null);
                    }
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ ProvenanceIndexer DB 준비 완료');
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;

                        // 기존 객체 저장소 삭제 (스키마 변경 시)
                        if (db.objectStoreNames.contains(this.storeName)) {
                            db.deleteObjectStore(this.storeName);
                            console.log('🔄 기존 프로비넌스 저장소 삭제');
                        }

                        // 프로비넌스 저장소 생성
                        const objectStore = db.createObjectStore(this.storeName, { 
                            keyPath: 'id',
                            autoIncrement: true 
                        });

                        // 인덱스 생성 (검색 최적화)
                        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                        objectStore.createIndex('filename', 'metadata.source.filename', { unique: false });
                        objectStore.createIndex('checksum', 'metadata.source.checksum', { unique: false });
                        objectStore.createIndex('erpSystem', 'metadata.erp.name', { unique: false });
                        objectStore.createIndex('userId', 'metadata.session.customerId', { unique: false });
                        objectStore.createIndex('quality', 'quality.overall', { unique: false });
                        objectStore.createIndex('status', 'summary.status', { unique: false });
                        objectStore.createIndex('uploadDate', 'metadata.source.uploadedAt', { unique: false });

                        console.log('📚 프로비넌스 인덱스 생성 완료');
                    } catch (upgradeError) {
                        console.error('❌ 스키마 업그레이드 중 오류:', upgradeError);
                        this.useIndexedDB = false;
                    }
                };
            } catch (initError) {
                console.error('❌ IndexedDB 초기화 중 예외:', initError);
                this.useIndexedDB = false;
                reject(initError);
            }
        });
    }

    /**
     * 프로비넌스 저장 (IndexedDB 또는 폴백)
     * @param {ProvenanceGraph} provenance - 프로비넌스 그래프 객체
     * @returns {Promise<number>} 저장된 ID
     */
    async save(provenance) {
        if (!provenance) {
            console.warn('⚠️ 저장할 프로비넌스 데이터가 없습니다');
            return null;
        }

        // IndexedDB 사용 가능한 경우
        if (this.useIndexedDB && this.db) {
            try {
                return await this._saveToIndexedDB(provenance);
            } catch (error) {
                console.warn('⚠️ IndexedDB 저장 실패, 로컬 폴백으로 전환:', error.message);
                this.useIndexedDB = false;
            }
        }

        // 폴백: localStorage 또는 로컬 메모리 저장
        return this._saveToLocalStorage(provenance);
    }

    /**
     * IndexedDB에 저장
     */
    async _saveToIndexedDB(provenance) {
        if (!this.db) {
            await this.initialize();
            if (!this.db) {
                throw new Error('IndexedDB를 사용할 수 없습니다');
            }
        }

        const provenanceData = provenance.toJSON ? provenance.toJSON() : provenance;
        provenanceData.timestamp = new Date().toISOString();
        provenanceData.indexed = true;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.add(provenanceData);

                request.onsuccess = () => {
                    const id = request.result;
                    console.log(`📚 프로비넌스 저장 완료 (IndexedDB): ID ${id}`);
                    resolve(id);
                };

                request.onerror = () => {
                    console.error('❌ 프로비넌스 저장 실패 (IndexedDB):', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ 트랜잭션 오류:', error);
                reject(error);
            }
        });
    }

    /**
     * localStorage에 저장 (폴백)
     */
    _saveToLocalStorage(provenance) {
        try {
            const provenanceData = provenance.toJSON ? provenance.toJSON() : provenance;
            const timestamp = new Date().toISOString();
            const key = `provenance_${timestamp.replace(/[:.]/g, '-')}`;

            // localStorage는 크기 제한이 있으므로 최근 10개만 유지
            const stored = localStorage.getItem('provenance_list') || '[]';
            const list = JSON.parse(stored);
            list.push({ key, timestamp });
            
            if (list.length > 10) {
                const oldest = list.shift();
                localStorage.removeItem(oldest.key);
            }

            localStorage.setItem(key, JSON.stringify(provenanceData));
            localStorage.setItem('provenance_list', JSON.stringify(list));

            console.log(`📚 프로비넌스 저장 완료 (localStorage): ${key}`);
            return key;
        } catch (error) {
            console.error('❌ localStorage 저장 실패:', error);
            // 최후의 수단: 메모리에만 저장
            if (!window._provenanceCache) {
                window._provenanceCache = [];
            }
            window._provenanceCache.push({
                data: provenance,
                timestamp: new Date().toISOString()
            });
            console.log('📝 프로비넌스를 메모리 캐시에 저장했습니다 (페이지 새로고침 시 손실)');
            return 'memory_' + window._provenanceCache.length;
        }
    }

    /**
     * ID로 프로비넌스 조회
     * @param {number} id - 프로비넌스 ID
     */
    async getById(id) {
        if (!this.db) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 모든 프로비넌스 조회
     * @param {Object} options - { limit, offset, sortBy, sortOrder }
     */
    async getAll(options = {}) {
        if (!this.db) {
            await this.initialize();
        }

        const {
            limit = 100,
            offset = 0,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = options;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.openCursor(null, sortOrder === 'desc' ? 'prev' : 'next');

            const results = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    if (count >= offset && results.length < limit) {
                        results.push(cursor.value);
                    }
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 검색 (다차원 필터)
     * @param {Object} filters - 검색 조건
     * @returns {Promise<Array>} 검색 결과
     */
    async search(filters = {}) {
        if (!this.db) {
            await this.initialize();
        }

        const {
            filename,           // 파일명 (부분 일치)
            erpSystem,          // ERP 시스템
            dateFrom,           // 시작 날짜
            dateTo,             // 종료 날짜
            minQuality,         // 최소 품질 점수
            maxQuality,         // 최대 품질 점수
            status,             // 상태 (success, failed 등)
            userId,             // 사용자 ID
            fullText            // 전문 검색 키워드
        } = filters;

        const allRecords = await this.getAll({ limit: 10000 });

        // 필터 적용
        let results = allRecords;

        if (filename) {
            const searchTerm = filename.toLowerCase();
            results = results.filter(r => 
                r.metadata?.source?.filename?.toLowerCase().includes(searchTerm)
            );
        }

        if (erpSystem) {
            results = results.filter(r => 
                r.metadata?.erp?.name === erpSystem
            );
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            results = results.filter(r => 
                new Date(r.metadata?.source?.uploadedAt) >= fromDate
            );
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            results = results.filter(r => 
                new Date(r.metadata?.source?.uploadedAt) <= toDate
            );
        }

        if (minQuality !== undefined) {
            results = results.filter(r => 
                (r.quality?.overall || 0) >= minQuality
            );
        }

        if (maxQuality !== undefined) {
            results = results.filter(r => 
                (r.quality?.overall || 0) <= maxQuality
            );
        }

        if (status) {
            results = results.filter(r => 
                r.summary?.status === status
            );
        }

        if (userId) {
            results = results.filter(r => 
                r.metadata?.session?.customerId === userId
            );
        }

        if (fullText) {
            const searchTerm = fullText.toLowerCase();
            results = results.filter(r => {
                const jsonString = JSON.stringify(r).toLowerCase();
                return jsonString.includes(searchTerm);
            });
        }

        console.log(`🔍 검색 완료: ${results.length}건 발견`);
        return results;
    }

    /**
     * 통계 조회
     */
    async getStatistics() {
        if (!this.db) {
            await this.initialize();
        }

        const allRecords = await this.getAll({ limit: 10000 });

        const stats = {
            total: allRecords.length,
            byERP: {},
            byStatus: {},
            byMonth: {},
            qualityDistribution: {
                excellent: 0,  // 90% 이상
                good: 0,       // 70-90%
                fair: 0,       // 50-70%
                poor: 0        // 50% 미만
            },
            avgQuality: 0,
            avgProcessingTime: 0,
            totalDataProcessed: 0
        };

        let totalQuality = 0;
        let totalProcessingTime = 0;

        for (const record of allRecords) {
            // ERP별 통계
            const erp = record.metadata?.erp?.name || 'Unknown';
            stats.byERP[erp] = (stats.byERP[erp] || 0) + 1;

            // 상태별 통계
            const status = record.summary?.status || 'unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // 월별 통계
            const uploadDate = new Date(record.metadata?.source?.uploadedAt);
            const monthKey = `${uploadDate.getFullYear()}-${String(uploadDate.getMonth() + 1).padStart(2, '0')}`;
            stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

            // 품질 분포
            const quality = record.quality?.overall || 0;
            totalQuality += quality;
            
            if (quality >= 0.9) stats.qualityDistribution.excellent++;
            else if (quality >= 0.7) stats.qualityDistribution.good++;
            else if (quality >= 0.5) stats.qualityDistribution.fair++;
            else stats.qualityDistribution.poor++;

            // 처리 시간
            const processingTime = parseFloat(record.summary?.processingTime || 0);
            totalProcessingTime += processingTime;

            // 처리된 데이터 양
            stats.totalDataProcessed += record.graph?.nodes?.find(n => n.id === 'data-extraction')?.data?.statistics?.originalRows || 0;
        }

        stats.avgQuality = allRecords.length > 0 ? totalQuality / allRecords.length : 0;
        stats.avgProcessingTime = allRecords.length > 0 ? totalProcessingTime / allRecords.length : 0;

        return stats;
    }

    /**
     * 프로비넌스 삭제
     * @param {number} id - 삭제할 ID
     */
    async delete(id) {
        if (!this.db) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log(`🗑️ 프로비넌스 삭제 완료: ID ${id}`);
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 모든 프로비넌스 삭제 (주의!)
     */
    async deleteAll() {
        if (!this.db) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('🗑️ 모든 프로비넌스 삭제 완료');
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 감사용 내보내기
     * @param {Array<number>} ids - 내보낼 프로비넌스 ID 목록 (없으면 전체)
     * @returns {Blob} ZIP 파일
     */
    async exportForAudit(ids = null) {
        if (!this.db) {
            await this.initialize();
        }

        let records;
        if (ids && ids.length > 0) {
            records = await Promise.all(ids.map(id => this.getById(id)));
        } else {
            records = await this.getAll({ limit: 10000 });
        }

        // 감사 보고서 생성
        const auditReport = {
            generatedAt: new Date().toISOString(),
            generatedBy: 'HedgeFreedom Provenance Indexer',
            purpose: '감사 대응 및 규제 준수',
            recordCount: records.length,
            period: {
                from: records.length > 0 ? records[records.length - 1].metadata?.source?.uploadedAt : null,
                to: records.length > 0 ? records[0].metadata?.source?.uploadedAt : null
            },
            summary: await this.getStatistics(),
            records: records
        };

        // JSON Blob 생성
        const blob = new Blob([JSON.stringify(auditReport, null, 2)], { 
            type: 'application/json' 
        });

        console.log(`📦 감사 보고서 생성 완료: ${records.length}건`);
        return blob;
    }

    /**
     * CSV 내보내기 (Excel 호환)
     */
    async exportToCSV() {
        const records = await this.getAll({ limit: 10000 });

        const headers = [
            'ID',
            '업로드 날짜',
            '파일명',
            'ERP 시스템',
            '상태',
            '품질 점수',
            '처리 시간(초)',
            '데이터 행수',
            '체크섬'
        ];

        const rows = records.map(r => [
            r.id || '',
            r.metadata?.source?.uploadedAt || '',
            r.metadata?.source?.filename || '',
            r.metadata?.erp?.name || '',
            r.summary?.status || '',
            r.quality?.overall ? (r.quality.overall * 100).toFixed(1) + '%' : '',
            r.summary?.processingTime || '',
            r.graph?.nodes?.find(n => n.id === 'data-extraction')?.data?.statistics?.originalRows || '',
            r.metadata?.source?.checksum || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        
        console.log('📊 CSV 생성 완료');
        return blob;
    }

    /**
     * 중복 검사 (동일 파일 재업로드 방지)
     * @param {string} checksum - 파일 체크섬
     */
    async findDuplicates(checksum) {
        return await this.search({ 
            fullText: checksum 
        });
    }

    /**
     * 최근 프로비넌스 조회
     * @param {number} count - 조회할 개수
     */
    async getRecent(count = 10) {
        return await this.getAll({ 
            limit: count, 
            sortBy: 'timestamp', 
            sortOrder: 'desc' 
        });
    }

    /**
     * 날짜 범위로 조회
     */
    async getByDateRange(fromDate, toDate) {
        return await this.search({
            dateFrom: fromDate,
            dateTo: toDate
        });
    }

    /**
     * 품질 점수로 조회
     */
    async getByQuality(minQuality, maxQuality = 1.0) {
        return await this.search({
            minQuality: minQuality,
            maxQuality: maxQuality
        });
    }

    /**
     * 데이터베이스 크기 조회
     */
    async getDatabaseSize() {
        if (!this.db) {
            await this.initialize();
        }

        const allRecords = await this.getAll({ limit: 10000 });
        const jsonString = JSON.stringify(allRecords);
        const sizeInBytes = new Blob([jsonString]).size;
        const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

        return {
            records: allRecords.length,
            sizeInBytes: sizeInBytes,
            sizeInMB: sizeInMB,
            avgSizePerRecord: allRecords.length > 0 ? (sizeInBytes / allRecords.length).toFixed(0) : 0
        };
    }
}

// 전역으로 노출
window.ProvenanceIndexer = ProvenanceIndexer;
