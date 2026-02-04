/**
 * 📊 데이터 프로비넌스 그래프 (Data Provenance Graph)
 * 
 * 데이터의 출처, 변환 과정, 품질을 추적하여 감사 추적 및 규제 준수를 지원합니다.
 * 
 * 주요 기능:
 * - 파일 메타데이터 기록
 * - ERP 시스템 자동 탐지
 * - 컬럼 매핑 이력 추적
 * - 데이터 변환 단계 기록
 * - 사용자 승인 이력
 * - 품질 지표 계산
 */

class ProvenanceGraph {
    constructor() {
        this.nodes = [];  // 변환 단계별 노드
        this.edges = [];  // 노드 간 연결 (데이터 흐름)
        this.metadata = null;
        this.quality = null;
    }

    /**
     * 프로비넌스 그래프 초기화
     * @param {File} file - 원본 Excel 파일
     */
    async initialize(file) {
        // 파일 메타데이터 생성
        this.metadata = {
            source: {
                filename: file.name,
                fileSize: file.size,
                fileType: file.type,
                lastModified: new Date(file.lastModified).toISOString(),
                uploadedAt: new Date().toISOString(),
                checksum: await this._calculateChecksum(file)
            },
            system: {
                browser: this._detectBrowser(),
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            session: {
                sessionId: this._generateSessionId(),
                workspaceFolder: null,  // 나중에 설정
                customerId: null  // 나중에 설정
            }
        };

        // 첫 번째 노드: 원본 파일
        this.addNode({
            id: 'source',
            type: 'file-upload',
            timestamp: new Date().toISOString(),
            status: 'success',
            data: {
                filename: file.name,
                size: file.size,
                checksum: this.metadata.source.checksum
            }
        });

        return this;
    }

    /**
     * ERP 시스템 자동 탐지 및 기록
     * @param {Array<string>} headers - Excel 헤더 배열
     * @param {Object} mappingResults - AI 매칭 결과
     */
    detectERPSystem(headers, mappingResults) {
        const erpSignatures = {
            '더존': ['거래처코드명', '발생금액(외화)', '외화종류', '사업장'],
            '영림원': ['업체명', '외화잔액', '통화', '만기일'],
            'SAP': ['Customer', 'Amt in FC', 'Currency', 'Document Date'],
            '한컴': ['상대처명', '통화구분', '금액(외화)', '예정일'],
            '하나로': ['거래회사', '외화명', '외화수량', '정산예정일']
        };

        const detectedERP = {
            name: 'Unknown',
            confidence: 0,
            matchedColumns: []
        };

        // 각 ERP 시그니처와 비교
        for (const [erpName, signature] of Object.entries(erpSignatures)) {
            const matches = signature.filter(col => 
                headers.some(h => h.includes(col) || col.includes(h))
            );
            const confidence = matches.length / signature.length;

            if (confidence > detectedERP.confidence) {
                detectedERP.name = erpName;
                detectedERP.confidence = confidence;
                detectedERP.matchedColumns = matches;
            }
        }

        this.metadata.erp = detectedERP;

        this.addNode({
            id: 'erp-detection',
            type: 'analysis',
            timestamp: new Date().toISOString(),
            status: 'success',
            data: {
                erpSystem: detectedERP.name,
                confidence: detectedERP.confidence,
                matchedColumns: detectedERP.matchedColumns,
                totalHeaders: headers.length
            }
        });

        this.addEdge('source', 'erp-detection', 'analyzed');

        return detectedERP;
    }

    /**
     * 컬럼 매핑 이력 기록
     * @param {Object} mappingResults - AI 매칭 결과
     * @param {Object} columnMap - 최종 컬럼 매핑
     */
    recordColumnMapping(mappingResults, columnMap) {
        const mappingStats = {
            totalColumns: Object.keys(mappingResults || {}).length,
            highConfidence: 0,   // > 90%
            mediumConfidence: 0, // 50-90%
            lowConfidence: 0,    // < 50%
            methods: {
                exact: 0,
                fuzzy: 0,
                semantic: 0,
                api: 0,
                fallback: 0
            }
        };

        // 통계 계산
        for (const [header, result] of Object.entries(mappingResults || {})) {
            const confidence = result.confidence || 0;
            
            if (confidence >= 0.9) mappingStats.highConfidence++;
            else if (confidence >= 0.5) mappingStats.mediumConfidence++;
            else mappingStats.lowConfidence++;

            const method = result.method || 'fallback';
            if (mappingStats.methods[method] !== undefined) {
                mappingStats.methods[method]++;
            }
        }

        this.addNode({
            id: 'column-mapping',
            type: 'transformation',
            timestamp: new Date().toISOString(),
            status: mappingStats.lowConfidence > 0 ? 'warning' : 'success',
            data: {
                mappingResults: mappingResults,
                columnMap: columnMap,
                statistics: mappingStats
            }
        });

        this.addEdge('erp-detection', 'column-mapping', 'mapped');

        return mappingStats;
    }

    /**
     * 데이터 추출 과정 기록
     * @param {Array} originalData - 원본 데이터
     * @param {Array} extractedData - 추출된 데이터
     * @param {Object} extractionConfig - 추출 설정
     */
    recordExtraction(originalData, extractedData, extractionConfig) {
        const extractionStats = {
            originalRows: originalData.length,
            extractedRows: extractedData.length,
            originalColumns: originalData[0] ? Object.keys(originalData[0]).length : 0,
            extractedColumns: extractionConfig.requiredFields?.length || 0,
            optionalColumns: extractionConfig.optionalFields?.length || 0,
            excludedColumns: extractionConfig.excludedFields?.length || 0,
            dataReduction: this._calculateReductionRate(originalData, extractedData)
        };

        this.addNode({
            id: 'data-extraction',
            type: 'transformation',
            timestamp: new Date().toISOString(),
            status: 'success',
            data: {
                config: extractionConfig,
                statistics: extractionStats,
                extractedFields: extractionConfig.requiredFields,
                excludedFields: extractionConfig.excludedFields
            }
        });

        this.addEdge('column-mapping', 'data-extraction', 'extracted');

        return extractionStats;
    }

    /**
     * 사용자 승인 기록
     * @param {string} userId - 사용자 ID
     * @param {boolean} approved - 승인 여부
     * @param {string} comment - 승인 코멘트
     */
    recordUserApproval(userId, approved, comment = '') {
        this.addNode({
            id: 'user-approval',
            type: 'approval',
            timestamp: new Date().toISOString(),
            status: approved ? 'approved' : 'rejected',
            data: {
                userId: userId,
                approved: approved,
                comment: comment,
                reviewedAt: new Date().toISOString()
            }
        });

        this.addEdge('data-extraction', 'user-approval', 'reviewed');

        return this;
    }

    /**
     * 서버 전송 기록
     * @param {string} endpoint - 전송 엔드포인트
     * @param {boolean} success - 전송 성공 여부
     * @param {Object} response - 서버 응답
     */
    recordTransmission(endpoint, success, response = {}) {
        this.addNode({
            id: 'server-transmission',
            type: 'transmission',
            timestamp: new Date().toISOString(),
            status: success ? 'success' : 'failed',
            data: {
                endpoint: endpoint,
                success: success,
                response: response,
                transmittedAt: new Date().toISOString()
            }
        });

        this.addEdge('user-approval', 'server-transmission', 'transmitted');

        return this;
    }

    /**
     * 데이터 품질 지표 계산
     */
    calculateQuality() {
        const columnMappingNode = this.getNode('column-mapping');
        const extractionNode = this.getNode('data-extraction');

        if (!columnMappingNode || !extractionNode) {
            return null;
        }

        const mappingStats = columnMappingNode.data.statistics;
        const extractionStats = extractionNode.data.statistics;

        this.quality = {
            overall: 0,
            dimensions: {
                completeness: this._calculateCompleteness(extractionStats),
                accuracy: this._calculateAccuracy(mappingStats),
                consistency: this._calculateConsistency(),
                timeliness: this._calculateTimeliness()
            },
            issues: [],
            recommendations: []
        };

        // 전체 품질 점수 계산 (가중 평균)
        this.quality.overall = (
            this.quality.dimensions.completeness * 0.3 +
            this.quality.dimensions.accuracy * 0.4 +
            this.quality.dimensions.consistency * 0.2 +
            this.quality.dimensions.timeliness * 0.1
        );

        // 이슈 및 권장사항 생성
        this._generateQualityInsights();

        return this.quality;
    }

    /**
     * 노드 추가
     */
    addNode(node) {
        if (!node.id || !node.type) {
            throw new Error('Node must have id and type');
        }
        this.nodes.push(node);
    }

    /**
     * 엣지 추가 (노드 간 연결)
     */
    addEdge(fromId, toId, relationship) {
        this.edges.push({
            from: fromId,
            to: toId,
            relationship: relationship,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 특정 노드 조회
     */
    getNode(nodeId) {
        return this.nodes.find(n => n.id === nodeId);
    }

    /**
     * 전체 프로비넌스 그래프 반환
     */
    toJSON() {
        return {
            metadata: this.metadata,
            graph: {
                nodes: this.nodes,
                edges: this.edges
            },
            quality: this.quality,
            summary: this._generateSummary(),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Mermaid 다이어그램 생성 (시각화용)
     */
    toMermaid() {
        let diagram = 'graph LR\n';
        
        for (const edge of this.edges) {
            const fromNode = this.getNode(edge.from);
            const toNode = this.getNode(edge.to);
            
            diagram += `    ${edge.from}["${fromNode?.type || edge.from}"] `;
            diagram += `-->|${edge.relationship}| `;
            diagram += `${edge.to}["${toNode?.type || edge.to}"]\n`;
        }

        return diagram;
    }

    // ========== Private Methods ==========

    /**
     * 파일 체크섬 계산 (SHA-256)
     */
    async _calculateChecksum(file) {
        try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('체크섬 계산 실패:', error);
            return 'unknown';
        }
    }

    /**
     * 브라우저 탐지
     */
    _detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    /**
     * 세션 ID 생성
     */
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 데이터 감소율 계산
     */
    _calculateReductionRate(original, extracted) {
        if (!original.length || !extracted.length) return 0;
        
        const originalSize = JSON.stringify(original).length;
        const extractedSize = JSON.stringify(extracted).length;
        
        return ((originalSize - extractedSize) / originalSize * 100).toFixed(2);
    }

    /**
     * 완전성 계산 (필수 필드 존재 여부)
     */
    _calculateCompleteness(extractionStats) {
        if (!extractionStats) return 0;
        
        const expectedFields = extractionStats.extractedColumns;
        const actualFields = extractionStats.extractedColumns;
        
        return actualFields / Math.max(expectedFields, 1);
    }

    /**
     * 정확성 계산 (AI 매칭 신뢰도)
     */
    _calculateAccuracy(mappingStats) {
        if (!mappingStats || mappingStats.totalColumns === 0) return 0;
        
        const total = mappingStats.totalColumns;
        const high = mappingStats.highConfidence;
        const medium = mappingStats.mediumConfidence;
        
        return (high * 1.0 + medium * 0.7) / total;
    }

    /**
     * 일관성 계산
     */
    _calculateConsistency() {
        // 모든 필수 단계가 완료되었는지 확인
        const requiredSteps = ['source', 'erp-detection', 'column-mapping', 'data-extraction'];
        const completedSteps = requiredSteps.filter(step => this.getNode(step));
        
        return completedSteps.length / requiredSteps.length;
    }

    /**
     * 적시성 계산 (업로드부터 현재까지 시간)
     */
    _calculateTimeliness() {
        const sourceNode = this.getNode('source');
        if (!sourceNode) return 0;
        
        const uploadTime = new Date(sourceNode.timestamp);
        const now = new Date();
        const elapsedMinutes = (now - uploadTime) / 1000 / 60;
        
        // 5분 이내: 1.0, 30분 이상: 0.0
        if (elapsedMinutes <= 5) return 1.0;
        if (elapsedMinutes >= 30) return 0.0;
        return 1.0 - ((elapsedMinutes - 5) / 25);
    }

    /**
     * 품질 인사이트 생성
     */
    _generateQualityInsights() {
        const { dimensions } = this.quality;

        // 이슈 탐지
        if (dimensions.completeness < 0.8) {
            this.quality.issues.push({
                severity: 'high',
                type: 'completeness',
                message: '필수 데이터 필드가 누락되었습니다'
            });
        }

        if (dimensions.accuracy < 0.7) {
            this.quality.issues.push({
                severity: 'high',
                type: 'accuracy',
                message: 'AI 컬럼 매칭 신뢰도가 낮습니다'
            });
            this.quality.recommendations.push('수동으로 컬럼 매핑을 검토하세요');
        }

        if (dimensions.timeliness < 0.5) {
            this.quality.issues.push({
                severity: 'low',
                type: 'timeliness',
                message: '데이터 처리 시간이 지연되었습니다'
            });
        }

        // 권장사항
        const mappingNode = this.getNode('column-mapping');
        if (mappingNode?.data?.statistics?.lowConfidence > 0) {
            this.quality.recommendations.push(
                `${mappingNode.data.statistics.lowConfidence}개 컬럼의 매칭 신뢰도가 낮습니다. 검토가 필요합니다.`
            );
        }
    }

    /**
     * 요약 정보 생성
     */
    _generateSummary() {
        const source = this.getNode('source');
        const approval = this.getNode('user-approval');
        const transmission = this.getNode('server-transmission');

        return {
            filename: source?.data?.filename || 'Unknown',
            erpSystem: this.metadata?.erp?.name || 'Unknown',
            status: transmission?.status || approval?.status || 'processing',
            totalSteps: this.nodes.length,
            completedSteps: this.nodes.filter(n => n.status === 'success').length,
            processingTime: this._calculateProcessingTime(),
            dataQuality: this.quality?.overall || null
        };
    }

    /**
     * 전체 처리 시간 계산
     */
    _calculateProcessingTime() {
        if (this.nodes.length === 0) return 0;
        
        const firstNode = this.nodes[0];
        const lastNode = this.nodes[this.nodes.length - 1];
        
        const start = new Date(firstNode.timestamp);
        const end = new Date(lastNode.timestamp);
        
        return ((end - start) / 1000).toFixed(2); // 초 단위
    }
}

// 전역으로 노출
window.ProvenanceGraph = ProvenanceGraph;
