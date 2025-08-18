import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/Button';
import { ArrowLeftIcon } from '../../assets';
import CategorySelectModal from './components/CategorySelectModal';
import StepSelectModal from './components/StepSelectModal';
import BackgroundSelectModal from './components/BackgroundSelectModal';
import { iconList, getStepBackground } from './constants';
import type { 
    GridItem, 
    GridSection,
    Step, 
    TextItem, 
    IconItem,
    Category, 
    RecommendationTab, 
    ActiveTab 
} from './types';
import './TemplateEditPage.css';


const TemplateEditPage = () => {
    const { id, presetId } = useParams<{ id?: string; presetId?: string }>(); // URL 파라미터들
    const navigate = useNavigate();
    const location = useLocation();
    const dragRef = useRef<HTMLDivElement>(null);
        
    // location.state에서 stepObjList와 stepTextList 받아오기
    const { stepObjList, stepTextList } = location.state || {};
    
    // 수정 모드인지 확인 (URL에 id가 있고 'new'가 아닌 경우)
    const isEditMode = id && id !== 'new' && !isNaN(Number(id));
    
    // 받아온 데이터를 steps와 textItems로 변환하는 함수
    const convertDataToSteps = (stepObjList: any, stepTextList: any) => {
        
        if (!stepObjList && !stepTextList) return null;
        
        const convertedSteps: Step[] = [];
        const convertedTextItems: TextItem[] = [];
        
        // stepsList 구조에 맞게 데이터 처리
        let stepsData: any[] = [];
        
        if (Array.isArray(stepObjList)) {
            // stepObjList가 stepsList인 경우 (템플릿 데이터에서 온 경우)
            stepsData = stepObjList;
        } else if (stepObjList && typeof stepObjList === 'object') {
            // 단일 스텝 데이터인 경우
            stepsData = [stepObjList];
        }
        
        // 스텝 데이터가 없으면 기본 스텝 1개 생성
        if (stepsData.length === 0) {
            stepsData = [{ stepObjList: [], stepTextList: [] }];
        }
        
        stepsData.forEach((stepData: any, stepIndex: number) => {
            const stepId = `step${stepIndex + 1}`;
            // Step 생성
            const newStep: Step = {
                id: stepId,
                name: `스텝 ${stepIndex + 1}`,
                grid: Array(8).fill(null).map(() => Array(8).fill(null)),
                sections: getStepSections(stepIndex + 1)
            };
            
            // stepObjList 처리 - 다양한 데이터 구조에 대응
            let objList: any[] = [];
            if (stepData.stepObjList && Array.isArray(stepData.stepObjList)) {
                objList = stepData.stepObjList;
            } else if (stepData.objList && Array.isArray(stepData.objList)) {
                objList = stepData.objList;
            } else if (Array.isArray(stepData)) {
                objList = stepData;
            }
            
            objList.forEach((obj: any, objIndex: number) => {
                
                // 좌표를 그리드 인덱스로 변환 (다양한 좌표 필드명 대응)
                const objX = obj.objX || obj.x || 0;
                const objY = obj.objY || obj.y || 0;
                const gridX = Math.floor(objX / 50);
                const gridY = Math.floor(objY / 50);
                
                if (gridX >= 0 && gridX < 8 && gridY >= 0 && gridY < 8) {
                    const gridItem = {
                        type: 'object' as const,
                        id: `obj_${stepIndex}_${objIndex}`,
                        label: obj.objNm || obj.label || obj.name || `오브젝트${objIndex}`,
                        x: gridX,
                        y: gridY,
                        content: obj.content || '',
                        stepId: `step${stepIndex + 1}`
                    };
                    
                    newStep.grid[gridY][gridX] = gridItem;
                }
            });
            
            convertedSteps.push(newStep);
            
            // stepTextList 처리
            let textList: any[] = [];
            if (stepData.stepTextList && Array.isArray(stepData.stepTextList)) {
                textList = stepData.stepTextList;
            } else if (stepData.textList && Array.isArray(stepData.textList)) {
                textList = stepData.textList;
            }
            
            textList.forEach((textData: any, textIndex: number) => {
                convertedTextItems.push({
                    id: `text_${stepIndex}_${textIndex}`,
                    content: textData.text || textData.content || '',
                    x: textData.stepTextX || textData.x || 0,
                    y: textData.stepTextY || textData.y || 0,
                    isEditing: false,
                    fontSize: 14,
                    color: '#000000'
                });
            });
        });
        
        return { steps: convertedSteps, textItems: convertedTextItems };
    };

    // 컴포넌트 마운트 시 기존 템플릿 데이터 로드
    useEffect(() => {
        const loadTemplateData = async (templateNo: number) => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('토큰이 없습니다');
                    return;
                }

                const response = await fetch('http://localhost:8080/temp/getDetailData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ templateNo })
                });

                if (!response.ok) {
                    throw new Error('템플릿 데이터 로드 실패');
                }

                const data = await response.json();

                // 응답 데이터로 상태 초기화
                if (data && data.templateData) {
                    const templateData = data.templateData;
                    
                    // 템플릿명 설정
                    if (templateData.templateNm) {
                        setTemplateName(templateData.templateNm);
                    }
                    
                    // 카테고리 설정 (cateNo를 카테고리명으로 변환)
                    if (templateData.cateNo) {
                        const categoryMap: { [key: number]: Category } = {
                            1: '업무',
                            2: '생활', 
                            3: '여행'
                        };
                        const category = categoryMap[templateData.cateNo] || '여행';
                        setCurrentCategory(category);
                        
                        // 배경 이미지도 카테고리에 맞게 설정
                        const stepCount = templateData.stepCount || 1;
                        const newBackground = getStepBackground(category, stepCount);
                        setBackgroundImage(newBackground);
                    }
                    
                    // 스텝 수 설정 (stepCount가 없으면 1로 기본 설정)
                    const stepCount = templateData.stepCount || 1;
                    setCurrentStepCount(stepCount);
                        
                    // stepsList가 있는 경우 데이터를 포함한 스텝 생성, 없으면 빈 스텝 생성
                    let finalSteps: Step[] = [];
                    let finalTextItems: TextItem[] = [];
                    let finalObjectItems: any[] = [];
                        
                        if (templateData.stepsList) {
                            
                            // stepsList가 배열인 경우 (각 스텝별 데이터)
                            if (Array.isArray(templateData.stepsList)) {
                                templateData.stepsList.forEach((stepData: any, stepIndex: number) => {
                                    const stepId = `step${stepIndex + 1}`;
                                    
                                    // 기본 스텝 구조 생성
                                    const newStep: Step = {
                                        id: stepId,
                                        name: `스텝 ${stepIndex + 1}`,
                                        grid: Array(8).fill(null).map(() => Array(8).fill(null)),
                                        sections: getStepSections(stepIndex + 1)
                                    };
                                    
                                    // stepObjList 처리
                                    if (stepData.stepObjList && Array.isArray(stepData.stepObjList)) {
                                        
                                        stepData.stepObjList.forEach((obj: any, objIndex: number) => {
                                            
                                            const objX = obj.objX || 0;
                                            const objY = obj.objY || 0;
                                            const objNm = obj.objNm || `오브젝트${objIndex}`;
                                            const cateNo = obj.cateNo || 1;
                                            
                                            // 퍼센트 좌표로 오브젝트 아이템 생성
                                            const absoluteX = objX;
                                            const absoluteY = objY;
                                            
                                            // 카테고리별 이미지 매핑
                                            const getCategoryImage = (cateNo: number, label: string) => {
                                                const categoryMap = {
                                                    1: '업무',
                                                    2: '일상', 
                                                    3: '여행'
                                                };
                                                
                                                const categoryName = categoryMap[cateNo as keyof typeof categoryMap] || '업무';
                                                
                                                // label에 해당하는 이미지 찾기
                                                try {
                                                    return `/1. 오브젝트/${categoryName}/100px/${label}.png`;
                                                } catch (error) {
                                                    console.warn(`이미지를 찾을 수 없습니다: ${label}.png in ${categoryName}`);
                                                    // 기본 이미지 반환
                                                    return `/1. 오브젝트/${categoryName}/100px/간식.png`;
                                                }
                                            };

                                            const objectItem = {
                                                id: `obj_${stepIndex}_${objIndex}`,
                                                label: objNm,
                                                x: absoluteX,
                                                y: absoluteY,
                                                category: cateNo,
                                                cateNo: cateNo,
                                                type: 'object',
                                                content: getCategoryImage(cateNo, objNm)
                                            };
                                            
                                            finalObjectItems.push(objectItem);
                                        });
                                    }
                                    
                                    finalSteps.push(newStep);
                                    
                                    // stepTextList 처리
                                    if (stepData.stepTextList && Array.isArray(stepData.stepTextList)) {
                                        
                                        stepData.stepTextList.forEach((textData: any, textIndex: number) => {
                                            const textItem = {
                                                id: `text_${stepIndex}_${textIndex}`,
                                                content: textData.text || '',
                                                x: textData.stepTextX || 0,
                                                y: textData.stepTextY || 0,
                                                isEditing: false,
                                                fontSize: 14,
                                                color: '#000000'
                                            };
                                            
                                            finalTextItems.push(textItem);
                                        });
                                    }
                                });
                            } 
                            // stepsList가 객체인 경우 (data.templateData.stepsList.stepObjList 형태)
                            else if (typeof templateData.stepsList === 'object') {
                                
                                // 기본 스텝 1개 생성
                                const newStep: Step = {
                                    id: 'step1',
                                    name: '스텝 1',
                                    grid: Array(8).fill(null).map(() => Array(8).fill(null)),
                                    sections: getStepSections(1)
                                };
                                
                                // stepObjList 처리
                                if (templateData.stepsList.stepObjList && Array.isArray(templateData.stepsList.stepObjList)) {
                                    
                                    templateData.stepsList.stepObjList.forEach((obj: any, objIndex: number) => {
                                        
                                        const objX = obj.objX || 0;
                                        const objY = obj.objY || 0;
                                        const objNm = obj.objNm || `오브젝트${objIndex}`;
                                        const cateNo = obj.cateNo || 1;
                                        
                                        // 퍼센트 좌표로 오브젝트 아이템 생성
                                        const absoluteX = objX;
                                        const absoluteY = objY;
                                        
                                        // 카테고리별 이미지 매핑
                                        const getCategoryImage = (cateNo: number, label: string) => {
                                            const categoryMap = {
                                                1: '업무',
                                                2: '일상', 
                                                3: '여행'
                                            };
                                            
                                            const categoryName = categoryMap[cateNo as keyof typeof categoryMap] || '업무';
                                            
                                            // label에 해당하는 이미지 찾기
                                            try {
                                                return `/1. 오브젝트/${categoryName}/100px/${label}.png`;
                                            } catch (error) {
                                                console.warn(`이미지를 찾을 수 없습니다: ${label}.png in ${categoryName}`);
                                                // 기본 이미지 반환
                                                return `/1. 오브젝트/${categoryName}/100px/간식.png`;
                                            }
                                        };

                                        const objectItem = {
                                            id: `obj_0_${objIndex}`,
                                            label: objNm,
                                            x: absoluteX,
                                            y: absoluteY,
                                            category: cateNo,
                                            cateNo: cateNo,
                                            type: 'object',
                                            content: getCategoryImage(cateNo, objNm)
                                        };
                                        
                                        finalObjectItems.push(objectItem);
                                    });
                                }
                                
                                finalSteps.push(newStep);
                                
                                // stepTextList 처리
                                if (templateData.stepsList.stepTextList && Array.isArray(templateData.stepsList.stepTextList)) {
                                    
                                    templateData.stepsList.stepTextList.forEach((textData: any, textIndex: number) => {
                                        const textItem = {
                                            id: `text_0_${textIndex}`,
                                            content: textData.text || '',
                                            x: textData.stepTextX || 0,
                                            y: textData.stepTextY || 0,
                                            isEditing: false,
                                            fontSize: 14,
                                            color: '#000000'
                                        };
                                        
                                        finalTextItems.push(textItem);
                                    });
                                }
                            }
                        } else {
                            // stepsList가 없으면 빈 스텝들 생성
                            finalSteps = Array.from({ length: stepCount }, (_, index) => ({
                                id: `step${index + 1}`,
                                name: `스텝 ${index + 1}`,
                                grid: Array(8).fill(null).map(() => Array(8).fill(null)),
                                sections: getStepSections(index + 1)
                            }));
                        }
                        
                    setSteps(finalSteps);
                    setTextItems(finalTextItems);
                    setObjectItems(finalObjectItems);
                    setSelectedStep('step1');
                    setSelectedStepId('step1');
                        
                        finalSteps.forEach((step, _index) => {
                            const _itemCount = step.grid.flat().filter(item => item !== null).length;
                        });
                    }
                
            } catch (error) {
                console.error('템플릿 데이터 로드 오류:', error);
            }
        };

        if (id && id !== 'new' && !presetId && !isNaN(Number(id))) {
            // id가 숫자이고 'new'가 아니며 presetId가 없을 때만 기존 템플릿 로드
            loadTemplateData(Number(id));
        }
        
        // location.state에서 받아온 데이터가 있는 경우 초기 상태 설정
        if (stepObjList || stepTextList) {
            
            const convertedData = convertDataToSteps(stepObjList, stepTextList);
            
            if (convertedData) {
                
                setSteps(convertedData.steps);
                setTextItems(convertedData.textItems);
                setCurrentStepCount(convertedData.steps.length);
                setSelectedStep(convertedData.steps[0]?.id || 'step1');
            } else {
                console.log('convertedData가 null입니다');
            }
        } else {
            console.log('stepObjList와 stepTextList가 모두 없습니다');
        }
    }, [id, presetId, stepObjList, stepTextList]);

    // 스텝별 그리드 섹션 정의 (요구사항에 맞춤)
    const getStepSections = (stepNumber: number): GridSection[] => {
        switch (stepNumber) {
            case 1:
                // 스텝1: 단일 영역
                return [{
                    id: 'main',
                    x: 35,
                    y: 30,
                    width: 30,
                    height: 40
                }];
            case 2:
                // 스텝2: 2개 영역
                return [
                    {
                        id: 'area-1',
                        x: 30,
                        y: 25,
                        width: 20,
                        height: 50
                    },
                    {
                        id: 'area-2',
                        x: 55,
                        y: 25,
                        width: 20,
                        height: 50
                    }
                ];
            case 3:
                // 스텝3: 3개 영역
                return [
                    {
                        id: 'area-1',
                        x: 25,
                        y: 25,
                        width: 20,
                        height: 25
                    },
                    {
                        id: 'area-2',
                        x: 25,
                        y: 52,
                        width: 20,
                        height: 25
                    },
                    {
                        id: 'area-3',
                        x: 50,
                        y: 30,
                        width: 20,
                        height: 50
                    }
                ];
            case 4:
                // 스텝4: 4개 영역
                return [
                    {
                        id: 'area-1',
                        x: 28,
                        y: 25,
                        width: 20,
                        height: 25
                    },
                    {
                        id: 'area-2',
                        x: 54,
                        y: 25,
                        width: 20,
                        height: 25
                    },
                    {
                        id: 'area-3',
                        x: 28,
                        y: 52,
                        width: 20,
                        height: 25
                    },
                    {
                        id: 'area-4',
                        x: 54,
                        y: 52,
                        width: 20,
                        height: 25
                    }
                ];
            default:
                return [];
        }
    };

    // 상태 관리 - 기본으로 1개 스텝만 생성
    const [steps, setSteps] = useState<Step[]>([
        { 
            id: 'step1', 
            name: '스텝 1', 
            grid: Array(8).fill(null).map(() => Array(8).fill(null)),
            sections: getStepSections(1)
        }
    ]);
    const [currentStepCount, setCurrentStepCount] = useState(1);
    const [selectedStep, setSelectedStep] = useState<string>('step1');
    const [selectedElement, _setSelectedElement] = useState<GridItem | null>(null);
    const [_draggedItem, setDraggedItem] = useState<GridItem | null>(null);
    const [_dragOverPosition, setDragOverPosition] = useState<{x: number, y: number} | null>(null);
    const [currentCategory, setCurrentCategory] = useState<Category>('여행'); // 상단 카테고리 선택 (저장 시 사용)
    const [objectCategory, setObjectCategory] = useState<Category>('여행'); // 우측 오브젝트 선택용 카테고리
    const [backgroundImage, setBackgroundImage] = useState('/cate-1-step-1.svg');
    
    const [_showGrid, setShowGrid] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('preparations');
    const [recommendationTab, setRecommendationTab] = useState<RecommendationTab>('recommended');
    
    // 텍스트 속성 패널 상태
    const [selectedTextItem, setSelectedTextItem] = useState<string | null>(null);
    const [selectedObjectItem, setSelectedObjectItem] = useState<GridItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [templateName, setTemplateName] = useState(() => {
        // 새 템플릿 또는 프리셋 기반 새 템플릿인 경우
        if (id === 'new' || presetId || !id || id === undefined || id === 'undefined') {
            return '새 템플릿';
        }
        // 기존 템플릿 편집인 경우
        return `템플릿 ${id}`;
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [textItems, setTextItems] = useState<TextItem[]>([]);
    
    // 오브젝트 아이템들을 절대 좌표로 관리
    const [objectItems, setObjectItems] = useState<{
        id: string;
        label: string;
        x: number;
        y: number;
        category: number;
        cateNo: number;
        type: string;
        content: string;
    }[]>([]);
    
    // 모달 상태
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStepModal, setShowStepModal] = useState(false);
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    
    // 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState<{show: boolean, x: number, y: number, item: GridItem | null}>({
        show: false,
        x: 0,
        y: 0,
        item: null
    });

    // 스텝 선택 상태
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    
    // 객체 복제/삭제, 드래그 앤 드롭, 호버 효과, 선택 표시를 위한 상태들
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuObject, setContextMenuObject] = useState<GridItem | null>(null);
    const [showContextMenu, setShowContextMenu] = useState(false);
    
    // 드래그 앤 드롭 상태
    const [draggedObject, setDraggedObject] = useState<GridItem | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // objectItems 드래그 상태
    const [draggedObjectItem, setDraggedObjectItem] = useState<any | null>(null);
    const [isDraggingObjectItem, setIsDraggingObjectItem] = useState(false);
    
    // 호버 상태
    const [hoveredObject, setHoveredObject] = useState<string | null>(null);
    
    // 선택된 객체
    const [selectedObject, setSelectedObject] = useState<string | null>(null);

    // 스텝 선택 핸들러
    const handleStepSelect = (stepId: string) => {
        setSelectedStepId(stepId);
        setSelectedStep(stepId);
    };


    // 필터링된 아이콘 리스트
    const filteredIconList = iconList.filter(icon => {
        // 검색어 필터링
        const matchesSearch = searchTerm === '' || 
            icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            icon.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;
        
        // 카테고리 필터링 (추천, 전체 탭 모두 적용) - 우측 오브젝트 카테고리 사용
        return icon.category === objectCategory;
    });

    // 상단 카테고리 변경 (템플릿 전체 카테고리)
    const changeCategory = (category: Category) => {
        setCurrentCategory(category);
    };

    // 우측 오브젝트 카테고리 변경 (오브젝트 선택용)
    const changeObjectCategory = (category: Category) => {
        setObjectCategory(category);
    };

    // 스텝 변경 - 선택한 개수만큼 스텝들을 생성
    const changeStep = (stepNumber: number) => {
        setCurrentStepCount(stepNumber);
        
        // 선택한 개수만큼 스텝들을 생성
        const newSteps: Step[] = Array.from({ length: stepNumber }, (_, index) => ({
            id: `step${index + 1}`,
            name: `스텝 ${index + 1}`,
            grid: Array(8).fill(null).map(() => Array(8).fill(null)),
            sections: getStepSections(stepNumber) // 선택한 번호의 그리드 구성을 모든 스텝에 적용
        }));
        
        setSteps(newSteps);
        setSelectedStep('step1');
        setSelectedStepId('step1');
        
        // 스텝 변경 시 배경 이미지 자동 변경
        const newBackground = getStepBackground(currentCategory, stepNumber);
        setBackgroundImage(newBackground);
        
        // 스텝 변경 시 텍스트 박스 재배치 (기존 텍스트 보존)
        const { maxCount } = getTextPositionsAndLimit(stepNumber);
        
        // 기존 텍스트들을 새로운 스텝 구조에 맞게 재배치
        setTextItems(prev => {
            // 기존 텍스트들을 최대 개수만큼만 유지
            const preservedTexts = prev.slice(0, maxCount);
            
            // 새로운 위치 정보로 업데이트
            const { positions } = getTextPositionsAndLimit(stepNumber);
            return preservedTexts.map((textItem, index) => ({
                ...textItem,
                x: positions[index] ? parseFloat(positions[index].x) : textItem.x,
                y: positions[index] ? parseFloat(positions[index].y) : textItem.y
            }));
        });
    };

    // 배경 변경
    const changeBackground = (backgroundPath: string) => {
        setBackgroundImage(backgroundPath);
    };

    // 스텝 선택
    const _selectStep = (stepId: string) => {
        setSelectedStep(stepId);
        setSelectedStepId(stepId);
    };

    // 아이콘 드래그 앤 드롭 핸들러 수정
    const _handleDrop = (e: React.DragEvent, stepId: string, sectionId: string, colIndex: number, rowIndex: number) => {
        e.preventDefault();
        
        try {
            const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
            
            // 선택된 스텝에 아이콘 배치
            if (selectedStepId === stepId) {
                const newGrid = [...steps.find(step => step.id === stepId)?.grid || []];
                
                // 기존 그리드가 없으면 생성
                if (newGrid.length === 0) {
                    newGrid.push(Array(8).fill(null));
                }
                
                // 아이콘 배치
                if (newGrid[rowIndex] && newGrid[rowIndex][colIndex] === null) {
                    // 카테고리를 번호로 매핑
                    const getCateNoFromCategory = (category: string): number => {
                        switch (category) {
                            case '업무': return 1;
                            case '생활': return 2;
                            case '여행': return 3;
                            default: return 3;
                        }
                    };
                    
                    newGrid[rowIndex][colIndex] = {
                        ...itemData,
                        sectionId: sectionId,
                        stepId: stepId,
                        cateNo: getCateNoFromCategory(itemData.category) // 카테고리 번호 추가
                    };
                    
                    // 스텝 업데이트
                    setSteps(prev => prev.map(step => 
                    step.id === stepId 
                            ? { ...step, grid: newGrid }
                        : step
                    ));
                }
            } else {
                alert('먼저 스텝을 선택해주세요!');
            }
        } catch (error) {
            console.error('드롭 처리 오류:', error);
        }
    };

    // 아이콘 드래그 시작 (기존 함수 제거)
    const _handleIconDragStart = (e: React.DragEvent, item: GridItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
    };

    // 아이콘 드래그 오버
    const _handleDragOver = (e: React.DragEvent, _colIndex: number, _rowIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // 드래그 종료 (기존 함수 제거)
    const _handleIconDragEnd = () => {
        setDraggedItem(null);
        setDragOverPosition(null);
        setShowGrid(false);
    };

    // 오브젝트 우클릭
    const handleObjectRightClick = (e: React.MouseEvent, item: GridItem) => {
        e.preventDefault();
        
        // 첫 번째 컨텍스트 메뉴 시스템
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            item
        });
        
        // 두 번째 컨텍스트 메뉴 시스템도 설정
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuObject(item);
        setShowContextMenu(true);
    };

    // 컨텍스트 메뉴 닫기
    const closeContextMenu = () => {
        setContextMenu({
            show: false,
            x: 0,
            y: 0,
            item: null
        });
        
        // 두 번째 컨텍스트 메뉴 시스템도 닫기
        setShowContextMenu(false);
        setContextMenuObject(null);
    };

    // 오브젝트 복제
    const duplicateObject = (item: GridItem) => {
        const newItem: GridItem = {
            ...item,
            id: `${item.id}_copy_${Date.now()}`,
            x: Math.min(item.x + 10, 90), // 원본에서 10% 오른쪽으로 이동, 경계 체크
            y: Math.min(item.y + 10, 90)  // 원본에서 10% 아래로 이동, 경계 체크
        };
        
        // 현재 선택된 스텝에 복제된 아이템 추가
        const currentStep = steps.find(step => step.id === selectedStep);
        if (currentStep) {
                        setSteps(prevSteps => 
                            prevSteps.map(step => 
                                step.id === selectedStep 
                                    ? {
                                        ...step,
                            items: [...(step.items || []), newItem]
                                    }
                                    : step
                            )
                        );
        }
        
        // 컨텍스트 메뉴 닫기
        closeContextMenu();
        setShowContextMenu(false);
        setContextMenuObject(null);
    };

    // 오브젝트 삭제
    const deleteObject = (item: GridItem) => {
        setSteps(prevSteps => 
            prevSteps.map(step => ({
                        ...step,
                items: step.items?.filter(stepItem => stepItem.id !== item.id) || []
            }))
        );
        
        // 컨텍스트 메뉴 닫기
        closeContextMenu();
        setShowContextMenu(false);
        setContextMenuObject(null);
    };

    // 오브젝트 배치 가능 여부 확인
    const _canPlaceObject = (x: number, y: number) => {
        const currentStep = steps.find(step => step.id === selectedStep);
        if (currentStep && currentStep.grid[y] && currentStep.grid[y][x] === null) {
            return true;
        }
        return false;
    };

    // objectItems 드래그 핸들러들
    const handleObjectDragStart = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        setDraggedObjectItem(item);
        setIsDraggingObjectItem(true);
        
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleObjectDragMove = (e: MouseEvent) => {
        if (!isDraggingObjectItem || !draggedObjectItem) return;
        
        const canvas = document.querySelector('.canvas-container');
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const newX = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100;
        const newY = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;
        
        // 경계 체크
        const clampedX = Math.max(0, Math.min(100, newX));
        const clampedY = Math.max(0, Math.min(100, newY));
        
        setObjectItems(prev => 
            prev.map(obj => 
                obj.id === draggedObjectItem.id 
                    ? { ...obj, x: clampedX, y: clampedY }
                    : obj
            )
        );
    };

    const handleObjectDragEnd = () => {
        setIsDraggingObjectItem(false);
        setDraggedObjectItem(null);
    };

    const handleObjectItemRightClick = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuObject(item);
        setShowContextMenu(true);
    };

    const duplicateObjectItem = (item: any) => {
        const newItem = {
            ...item,
            id: `${item.id}_copy_${Date.now()}`,
            x: Math.min(item.x + 5, 95),
            y: Math.min(item.y + 5, 95)
        };
        
        setObjectItems(prev => [...prev, newItem]);
        setShowContextMenu(false);
    };

    const deleteObjectItem = (item: any) => {
        setObjectItems(prev => prev.filter(obj => obj.id !== item.id));
        setShowContextMenu(false);
    };

    // 템플릿 이름 편집 핸들러
    const handleNameEdit = () => {
        setIsEditingName(true);
    };

    // Canvas API를 사용한 캡처 함수
    const canvasCapture = async (): Promise<string | null> => {
        if (!dragRef.current) {
            console.error('dragRef가 없습니다.');
            return null;
        }

        try {
            // 고정된 캔버스 크기 사용 (편집 영역과 동일)
            const canvasWidth = 800; // 편집 영역의 실제 너비
            const canvasHeight = 800; // 편집 영역의 실제 높이 (h-[800px])

            // 캔버스 생성
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Canvas 2D 컨텍스트를 가져올 수 없습니다.');
                return null;
            }

            // 실제 편집 영역과 동일한 크기로 설정
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // 고품질 렌더링 설정
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 캔버스 전체 배경을 흰색으로 칠하기 (편집 영역 배경색과 동일)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // 배경 이미지 그리기 (중앙에 배치, 여백 유지)
            if (backgroundImage) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = backgroundImage;
                });
                
                // 배경 이미지를 object-contain 방식으로 중앙에 배치 (편집 영역과 동일)
                const imgAspect = img.width / img.height;
                const canvasAspect = canvasWidth / canvasHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                    // 이미지가 더 넓음 - 너비를 캔버스에 맞추고 높이는 비례적으로
                    drawWidth = canvasWidth;
                    drawHeight = canvasWidth / imgAspect;
                    drawX = 0;
                    drawY = (canvasHeight - drawHeight) / 2;
                } else {
                    // 이미지가 더 높음 - 높이를 캔버스에 맞추고 너비는 비례적으로
                    drawWidth = canvasHeight * imgAspect;
                    drawHeight = canvasHeight;
                    drawX = (canvasWidth - drawWidth) / 2;
                    drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            }

            // 현재 스텝 정보 가져오기
            const currentStep = steps.find(step => step.id === selectedStep);
            if (currentStep && ctx) {
                
                // 그리드 섹션 그리기 (편집 모드가 아닐 때는 표시하지 않음)
                if (false && currentStep.sections) { // 미리보기에서는 그리드 표시 안함
                    currentStep.sections.forEach((section, index) => {
                        const x = (section.x / 100) * canvasWidth;
                        const y = (section.y / 100) * canvasHeight;
                        const width = (section.width / 100) * canvasWidth;
                        const height = (section.height / 100) * canvasHeight;
                        
                        // 섹션 테두리만 그리기 (배경은 투명)
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, width, height);
                    });
                }

                // 텍스트 아이템 그리기 (접힌 상태로만 표시)
                if (textItems.length > 0) {
                    textItems.forEach((item, index) => {
                        const x = (Number(item.x) / 100) * canvasWidth;
                        const y = (Number(item.y) / 100) * canvasHeight;
                        
                        if (!isNaN(x) && !isNaN(y)) {
                            // 미리보기용 텍스트 배경 박스 그리기 (일반 사각형, 둥근 테두리)
                            const boxHeight = 140;
                            const boxWidth = 240;
                            const borderRadius = 8;
                            
                            // 둥근 사각형 그리기 함수
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                            ctx.beginPath();
                            ctx.roundRect(x, y, boxWidth, boxHeight, borderRadius);
                            ctx.fill();
                            
                            // 텍스트 그리기 (편집 페이지와 동일한 방식)
                            ctx.fillStyle = '#ffffff';
                            ctx.font = `${item.fontSize}px Arial`;
                            ctx.textAlign = 'left';
                            
                            // 텍스트를 줄바꿈과 함께 표시 (편집 페이지와 동일)
                            const content = item.content || '';
                            const lines = content.split('\n'); // 줄바꿈 기준으로 분할
                            let currentY = y + item.fontSize + 10;
                            const lineHeight = item.fontSize * 1.4;
                            const maxWidth = 220; // 텍스트박스 너비에 맞춤
                            const maxDisplayLines = item.isExpanded ? 6 : 3; // 확장 상태에 따른 줄 수
                            let totalLinesDrawn = 0;
                            
                            for (let lineIndex = 0; lineIndex < lines.length && totalLinesDrawn < maxDisplayLines; lineIndex++) {
                                const textLine = lines[lineIndex];
                                
                                if (!textLine.trim()) {
                                    // 빈 줄 처리
                                    currentY += lineHeight;
                                    totalLinesDrawn++;
                                    continue;
                                }
                                
                                // 긴 줄을 단어 단위로 wrap
                                const words = textLine.split(' ');
                                let currentLine = '';
                                
                                for (let i = 0; i < words.length && totalLinesDrawn < maxDisplayLines; i++) {
                                    const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
                                    const metrics = ctx.measureText(testLine);
                                    
                                    if (metrics.width > maxWidth && currentLine) {
                                        // 현재 줄 그리기
                                        ctx.fillText(currentLine, x + 10, currentY);
                                        currentY += lineHeight;
                                        totalLinesDrawn++;
                                        currentLine = words[i];
                                    } else {
                                        currentLine = testLine;
                                    }
                                }
                                
                                // 마지막 단어들 그리기
                                if (currentLine && totalLinesDrawn < maxDisplayLines) {
                                    ctx.fillText(currentLine, x + 10, currentY);
                                    currentY += lineHeight;
                                    totalLinesDrawn++;
                                }
                            }
                            
                            // 숨겨진 텍스트가 있으면 "더보기" 상태 표시 (확장되지 않은 경우만)
                            if (!item.isExpanded && (lines.length > 3 || content.length > 60)) {
                                // "더보기" 버튼 영역 표시 (실제 버튼은 표시하지 않음)
                                ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
                                ctx.fillRect(x + boxWidth - 50, y + boxHeight - 25, 45, 20);
                                ctx.fillStyle = '#ffffff';
                                ctx.font = '10px Arial';
                                ctx.textAlign = 'center';
                                ctx.fillText('더보기', x + boxWidth - 27, y + boxHeight - 12);
                                ctx.textAlign = 'left'; // 원래대로 복원
                            }
                        }
                    });
                }

                // 그리드에 배치된 오브젝트 그리기 (새로운 items 구조 사용)
                if (currentStep && currentStep.items && currentStep.items.length > 0) {
                    
                    // 모든 아이콘을 동시에 처리 (자유 배치)
                    const drawPromises = currentStep.items.map(async (item, _index) => {
                        if (item) {
                            
                            // 캔버스 전체 영역에서의 절대 위치 계산
                            const x = (item.x / 100) * canvasWidth;
                            const y = (item.y / 100) * canvasHeight;
                            
                            if (item.type === 'object') {
                                try {
                                    const img = new Image();
                                    img.crossOrigin = 'anonymous';
                                    
                                    // Promise로 이미지 로딩 기다리기
                                    await new Promise((resolve, reject) => {
                                        img.onload = resolve;
                                        img.onerror = reject;
                                        img.src = item.content;
                                    });
                                    
                                    // 아이콘 크기 설정 (80px로 더 확대)
                                    const iconWidth = 100;
                                    const iconHeight = 100;
                                    const iconX = x - iconWidth / 2;
                                    const iconY = y - iconHeight / 2;
                                    
                                    ctx.drawImage(img, iconX, iconY, iconWidth, iconHeight);
                                    
                                    // 아이콘 라벨도 미리보기에 그리기
                                    const label = item.label || '아이콘';
                                    const labelY = iconY + iconHeight + 20; // 아이콘 아래 20px
                                    
                                    // 라벨 배경 (검은색 둥근 사각형)
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                    const labelPadding = 8;
                                    const labelHeight = 20;
                                    const labelWidth = ctx.measureText(label).width + (labelPadding * 2);
                                    const labelX = x - labelWidth / 2;
                                    
                                    ctx.beginPath();
                                    ctx.roundRect(labelX, labelY - 16, labelWidth, labelHeight, 4);
                                    ctx.fill();
                                    
                                    // 라벨 텍스트 (흰색)
                                    ctx.fillStyle = '#ffffff';
                                    ctx.font = '12px Arial';
                                    ctx.textAlign = 'center';
                                    ctx.fillText(label, x, labelY - 4);
                                    
                                } catch (error) {
                                    console.error('아이콘 로드 실패, 대체 표시:', item.content, error);
                                    // 이미지 로드 실패 시 대체 표시
                                    if (ctx) {
                                        ctx.fillStyle = '#3b82f6';
                                        ctx.fillRect(x - 40, y - 40, 80, 80);
                                        
                                        ctx.fillStyle = '#ffffff';
                                        ctx.font = '20px Arial';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(item.label || '📦', x, y + 8);
                                    }
                                    
                                    // 대체 표시에도 라벨 추가
                                    if (ctx) {
                                        const label = item.label || '아이콘';
                                        const labelY = y + 40 + 20; // 아이콘 아래 20px
                                        
                                        // 라벨 배경 (검은색 둥근 사각형)
                                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                        const labelPadding = 8;
                                        const labelHeight = 20;
                                        const labelWidth = ctx.measureText(label).width + (labelPadding * 2);
                                        const labelX = x - labelWidth / 2;
                                        
                                        ctx.beginPath();
                                        ctx.roundRect(labelX, labelY - 16, labelWidth, labelHeight, 4);
                                        ctx.fill();
                                        
                                        // 라벨 텍스트 (흰색)
                                        ctx.fillStyle = '#ffffff';
                                        ctx.font = '12px Arial';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(label, x, labelY - 4);
                                    }
                                }
                            } else {
                                // 텍스트 오브젝트 그리기
                                ctx.fillStyle = '#000000';
                                ctx.fillRect(x - 20, y - 20, 40, 40);
                                
                                ctx.fillStyle = '#ffffff';
                                ctx.font = '12px Arial';
                                ctx.textAlign = 'center';
                                ctx.fillText(item.content, x, y + 4);
                            }
                        }
                    });
                    
                    // 모든 아이콘 그리기 완료 대기
                    await Promise.all(drawPromises);
                }

                // objectItems 그리기 (별도로 관리되는 오브젝트들)
                if (objectItems && objectItems.length > 0) {
                    
                    const objectDrawPromises = objectItems.map(async (item, _index) => {
                        if (item) {
                            
                            // 캔버스 전체 영역에서의 절대 위치 계산
                            const x = (item.x / 100) * canvasWidth;
                            const y = (item.y / 100) * canvasHeight;
                            
                            if (item.type === 'object') {
                                try {
                                    const img = new Image();
                                    img.crossOrigin = 'anonymous';
                                    
                                    // Promise로 이미지 로딩 기다리기
                                    await new Promise((resolve, reject) => {
                                        img.onload = resolve;
                                        img.onerror = (e) => {
                                            console.error('objectItem 이미지 로드 실패:', item.content);
                                            reject(e);
                                        };
                                        img.src = item.content;
                                    });
                                    
                                    // 아이콘 크기 설정 (60px, 편집 화면과 동일)
                                    const iconWidth = 60;
                                    const iconHeight = 60;
                                    const iconX = x - iconWidth / 2;
                                    const iconY = y - iconHeight / 2;
                                    
                                    ctx.drawImage(img, iconX, iconY, iconWidth, iconHeight);
                                    
                                    // 아이콘 라벨도 미리보기에 그리기
                                    const label = item.label || '오브젝트';
                                    const labelY = iconY + iconHeight + 10; // 아이콘 아래 10px
                                    
                                    // 라벨 배경 (검은색 둥근 사각형)
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                    const labelPadding = 6;
                                    const labelHeight = 16;
                                    const labelWidth = ctx.measureText(label).width + (labelPadding * 2);
                                    const labelX = x - labelWidth / 2;
                                    
                                    ctx.beginPath();
                                    ctx.roundRect(labelX, labelY - 12, labelWidth, labelHeight, 4);
                                    ctx.fill();
                                    
                                    // 라벨 텍스트 (흰색)
                                    ctx.fillStyle = '#ffffff';
                                    ctx.font = '10px Arial';
                                    ctx.textAlign = 'center';
                                    ctx.fillText(label, x, labelY - 4);
                                    
                                } catch (error) {
                                    console.error(`objectItem ${index} 그리기 실패:`, error);
                                }
                            }
                        }
                    });
                    
                    // 모든 objectItems 그리기 완료 대기
                    await Promise.all(objectDrawPromises);
                }
            }

            const dataURL = canvas.toDataURL('image/png', 1.0);
            
            return dataURL;
        } catch (error) {
            console.error('Canvas API 캡처 오류:', error);
            return null;
        }
    };

    // 텍스트 위치를 픽셀로 변환하는 함수
    const _convertTextPositionToPixels = (textItem: TextItem, targetWidth: number, targetHeight: number) => {
        let x = Number(textItem.x);
        let y = Number(textItem.y);
        
        // 만약 x, y가 퍼센트 문자열이라면 픽셀로 변환
        if (isNaN(x) && typeof textItem.x === 'string' && textItem.x.includes('%')) {
            x = (parseFloat(textItem.x) / 100) * targetWidth;
        }
        if (isNaN(y) && typeof textItem.y === 'string' && textItem.y.includes('%')) {
            y = (parseFloat(textItem.y) / 100) * targetHeight;
        }
        
        return { x, y };
    };

    // 미리보기 핸들러
    const handlePreview = async () => {
        try {
            
            const capturedImage = await canvasCapture();
            if (capturedImage) {
                setPreviewImage(capturedImage);
                setShowPreviewModal(true);
            } else {
                alert('미리보기 생성에 실패했습니다.');
            }
        } catch (error) {
            alert('미리보기 생성 중 오류가 발생했습니다.');
        }
    };

    const handleNameSave = () => {
        setIsEditingName(false);
    };

    const handleNameKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSave();
        } else if (e.key === 'Escape') {
            setIsEditingName(false);
        }
    };

    // 섹션 제목 편집 핸들러
    const handleSectionNameEdit = (sectionId: string, currentName: string) => {
        setEditingSectionId(sectionId);
        setEditingSectionName(currentName);
    };

    const handleSectionNameSave = () => {
        if (editingSectionId && editingSectionName.trim()) {
            setSteps(prevSteps => 
                prevSteps.map(step => ({
                    ...step,
                    sections: step.sections.map(section => 
                        section.id === editingSectionId 
                            ? { ...section, customName: editingSectionName.trim() }
                            : section
                    )
                }))
            );
        }
        setEditingSectionId(null);
        setEditingSectionName('');
    };

    const handleSectionNameKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSectionNameSave();
        } else if (e.key === 'Escape') {
            setEditingSectionId(null);
            setEditingSectionName('');
        }
    };

    // 섹션 기본 이름 가져오기
    const getDefaultSectionName = (sectionId: string) => {
        const names: { [key: string]: string } = {
            'main': '6×6 메인공간',
            'area-1': '6×3 좌측구역',
            'area-2': '6×3 우측구역',
            'area-3': '3×3 우측구역',
            'area-4': '3×3 하단우측',
            'top-left': '3×3 상단좌측',
            'bottom-left': '3×3 하단좌측',
            'right': '6×3 우측구역',
            'top-right': '3×3 상단우측',
            'bottom-right': '3×3 하단우측',
        };
        return names[sectionId] || sectionId;
    };

    // 동적 텍스트 박스 위치 계산 (아코디언 방식)
    const calculateTextPositions = () => {
        const { positions: basePositions } = getTextPositionsAndLimit(currentStepCount);
        const calculatedPositions: Array<{x: number, y: number}> = [];
        
        // 영역별로 그룹화 (같은 x 좌표를 가진 것들)
        const groups: {[key: string]: Array<{index: number, baseY: number}>} = {};
        
        basePositions.forEach((pos, index) => {
            const key = pos.x;
            if (!groups[key]) groups[key] = [];
            groups[key].push({ index, baseY: parseFloat(pos.y) });
        });
        
        // 각 그룹별로 누적 높이 계산
        Object.keys(groups).forEach(xPos => {
            const group = groups[xPos];
            let currentY = group[0].baseY;
            
            group.forEach((item, groupIndex) => {
                const textItem = textItems[item.index];
                const baseHeight = 15; // 기본 텍스트 박스 높이 (%)
                const margin = 3; // 박스 간 여백 (%)
                
                calculatedPositions[item.index] = {
                    x: parseFloat(xPos),
                    y: currentY
                };
                
                // 다음 박스 위치 계산 (현재 박스가 확장되었는지 확인)
                const expandedHeight = textItem?.isExpanded ? baseHeight * 1.5 : baseHeight;
                currentY += expandedHeight + margin;
            });
        });
        
        return calculatedPositions;
    };

    // 스텝별 텍스트 박스 위치 및 최대 개수 설정 (기본 위치)
    const getTextPositionsAndLimit = (stepNumber: number) => {
        switch (stepNumber) {
            case 1:
                // 스텝1: 왼쪽 상단에 2개
                return {
                    positions: [
                        { x: '7.5%', y: '15%' },   // 왼쪽 상단 1번째
                        { x: '7.5%', y: '35%' }    // 왼쪽 상단 2번째
                    ],
                    maxCount: 2
                };
            case 2:
                // 스텝2: 왼쪽 상단 2개 + 오른쪽 상단 2개 (총 4개)
                return {
                    positions: [
                        // 스텝1 - 왼쪽 상단
                        { x: '7.5%', y: '15%' },   // 왼쪽 상단 1번째
                        { x: '7.5%', y: '35%' },   // 왼쪽 상단 2번째
                        // 스텝2 - 오른쪽 상단
                        { x: '72.5%', y: '15%' },  // 오른쪽 상단 1번째
                        { x: '72.5%', y: '35%' }   // 오른쪽 상단 2번째
                    ],
                    maxCount: 4
                };
            case 3:
                // 스텝3: 왼쪽 상단 2개 + 오른쪽 상단 2개 + 왼쪽 하단 2개 (총 6개)
                return {
                    positions: [
                        // 스텝1 - 왼쪽 상단
                        { x: '7.5%', y: '12%' },   // 왼쪽 상단 1번째
                        { x: '7.5%', y: '28%' },   // 왼쪽 상단 2번째
                        // 스텝2 - 오른쪽 상단
                        { x: '72.5%', y: '12%' },  // 오른쪽 상단 1번째
                        { x: '72.5%', y: '28%' },  // 오른쪽 상단 2번째
                        // 스텝3 - 왼쪽 하단
                        { x: '7.5%', y: '50%' },   // 왼쪽 하단 1번째
                        { x: '7.5%', y: '66%' }    // 왼쪽 하단 2번째
                    ],
                    maxCount: 6
                };
            case 4:
                // 스텝4: 4각지에 각각 2개씩 (총 8개)
                return {
                    positions: [
                        // 스텝1 - 왼쪽 상단
                        { x: '7.5%', y: '10%' },   // 왼쪽 상단 1번째
                        { x: '7.5%', y: '26%' },   // 왼쪽 상단 2번째
                        // 스텝2 - 오른쪽 상단
                        { x: '72.5%', y: '10%' },  // 오른쪽 상단 1번째
                        { x: '72.5%', y: '26%' },  // 오른쪽 상단 2번째
                        // 스텝3 - 왼쪽 하단
                        { x: '7.5%', y: '50%' },   // 왼쪽 하단 1번째
                        { x: '7.5%', y: '66%' },   // 왼쪽 하단 2번째
                        // 스텝4 - 오른쪽 하단
                        { x: '72.5%', y: '50%' },  // 오른쪽 하단 1번째
                        { x: '72.5%', y: '66%' }   // 오른쪽 하단 2번째
                    ],
                    maxCount: 8
                };
            default:
                return {
                    positions: [
                        { x: '7.5%', y: '15%' },   // 왼쪽 상단 1번째
                        { x: '7.5%', y: '35%' }    // 왼쪽 상단 2번째
                    ],
                    maxCount: 2
                };
        }
    };

    // 텍스트 추가 핸들러 수정 - 스텝별 정해진 위치에 배치
    const handleAddText = () => {
        // 속성 탭으로 이동
        setActiveTab('attributes');
        
        // 텍스트 박스 탭으로 전환
        if (textItems.length > 0) {
            setSelectedTextItem(textItems[0].id);
        } else {
            // 텍스트가 없으면 일단 선택 상태로 만들어서 텍스트 박스 탭이 보이도록
            setSelectedTextItem('placeholder');
        }
        setSelectedObjectItem(null);
    };

    // 텍스트 편집 시작
    const handleTextEdit = (textId: string) => {
        setTextItems(prev => 
            prev.map(item => 
                item.id === textId 
                    ? { ...item, isEditing: true }
                    : { ...item, isEditing: false }
            )
        );
    };

    // 텍스트 편집 완료
    const handleTextSave = (textId: string, newContent: string) => {
        setTextItems(prev => 
            prev.map(item => 
                item.id === textId 
                    ? { ...item, content: newContent.trim(), isEditing: false }
                    : item
            )
        );
    };

    // 텍스트 삭제
    const handleTextDelete = (textId: string) => {
        setTextItems(prev => prev.filter(item => item.id !== textId));
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCategoryModal(false);
                setShowStepModal(false);
                setShowBackgroundModal(false);
                closeContextMenu();
                if (isEditingName) {
                    setIsEditingName(false);
                }
                if (editingSectionId) {
                    setEditingSectionId(null);
                    setEditingSectionName('');
                }
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isEditingName, editingSectionId]);

    // ESC 키로 텍스트박스 접기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setTextItems(prev => 
                    prev.map(item => ({ ...item, isExpanded: false }))
                );
            }
        };
        
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // 드래그 시작 핸들러
    const handleDragStart = useCallback((e: React.MouseEvent, object: GridItem) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!dragRef.current) return;
        
        const rect = dragRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - (object.x / 100 * rect.width);
        const offsetY = e.clientY - rect.top - (object.y / 100 * rect.height);
        
        setDragOffset({ x: offsetX, y: offsetY });
        setDraggedObject(object);
        setSelectedObject(object.id);
        setIsDragging(true);
    }, []);
    
    // 드래그 이동 핸들러 - 매우 부드럽고 빠른 반응
    const handleDragMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !draggedObject || !dragRef.current) return;
        
        const rect = dragRef.current.getBoundingClientRect();
        const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
        
        // 경계 제한을 더 부드럽게
        const boundedX = Math.max(1, Math.min(newX, 99));
        const boundedY = Math.max(1, Math.min(newY, 99));
        
        // 즉시 업데이트 (requestAnimationFrame 제거하여 더 빠른 반응)
        setSteps(prev => prev.map(step => ({
            ...step,
            items: (step.items || []).map(item => 
                item.id === draggedObject.id 
                    ? { ...item, x: boundedX, y: boundedY }
                    : item
            )
        })));
    }, [isDragging, draggedObject, dragOffset]);
    
    // 드래그 종료 핸들러
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDraggedObject(null);
        setDragOffset({ x: 0, y: 0 });
    }, []);
    
    // 캔버스 클릭 시 가운데에 아이콘 추가
    const handleCanvasClick = (e: React.MouseEvent) => {
        // 컨텍스트 메뉴 닫기
        closeContextMenu();
        
        // 텍스트박스가 아닌 영역 클릭 시 모든 텍스트박스를 접힌 상태로
        if (!(e.target as HTMLElement).closest('.text-item-container')) {
            setTextItems(prev => 
                prev.map(item => ({ ...item, isExpanded: false }))
            );
        }
        
        // 선택된 아이콘이 있으면 가운데에 추가
        if (selectedElement && selectedElement.type === 'object') {
            const rect = dragRef.current?.getBoundingClientRect();
            if (rect) {
                // 캔버스 가운데 위치 계산
                const centerX = 50; // 50% (가운데)
                const centerY = 50; // 50% (가운데)
                
                const newItem: GridItem = {
                    ...selectedElement,
                    id: selectedElement.type + '-' + Date.now(),
                    x: centerX,
                    y: centerY,
                    stepId: selectedStepId || selectedStep,
                    sectionId: 'background',
                    // cateNo가 없는 경우 category에서 추가
                    cateNo: selectedElement.cateNo || (() => {
                        switch (selectedElement.category) {
                            case '업무': return 1;
                            case '생활': return 2;
                            case '여행': return 3;
                            default: return 3;
                        }
                    })()
                };
                
                // 현재 선택된 스텝에 아이템 추가
                if (selectedStepId) {
                    setSteps(prev => prev.map(step => 
                        step.id === selectedStepId 
                            ? { ...step, items: [...(step.items || []), newItem] }
                            : step
                    ));
                } else {
                    // 스텝이 선택되지 않았으면 첫 번째 스텝에 추가
                    setSteps(prev => prev.map((step, index) => 
                        index === 0 
                            ? { ...step, items: [...(step.items || []), newItem] }
                            : step
                    ));
                }
            }
        }
    };
    
    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        // 초기 스텝 설정 (컴포넌트 마운트 시에만 실행)
        const initialSteps: Step[] = [{
            id: 'step1',
            name: '스텝 1 구성',
            grid: Array(8).fill(null).map(() => Array(8).fill(null)),
            sections: getStepSections(1)
        }];
        
        setSteps(initialSteps);
        setSelectedStep('step1');
        setSelectedStepId('step1');
        
    }, []); // currentCategory 의존성 제거

    // objectItems 드래그 이벤트 리스너
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingObjectItem) {
                handleObjectDragMove(e);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingObjectItem) {
                handleObjectDragEnd();
            }
        };

        if (isDraggingObjectItem) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingObjectItem, draggedObjectItem, dragOffset]);

    // 데이터 정리 및 보안 검증 함수
    const sanitizeData = (data: any): any => {
        if (typeof data === 'string') {
            // JSON 문자열인지 확인
            let isJsonString = false;
            try {
                JSON.parse(data);
                isJsonString = true;
            } catch {
                isJsonString = false;
            }
            
            let cleaned;
            if (isJsonString) {
                // JSON 문자열의 경우 더 조심스럽게 정리
                cleaned = data
                    .replace(/;/g, '') // 세미콜론 제거
                    .replace(/\\/g, '') // 백슬래시 제거 (JSON 이스케이프 제외)
                    .replace(/\n/g, ' ') // 줄바꿈을 공백으로
                    .replace(/\r/g, '') // 캐리지 리턴 제거
                    .trim();
            } else {
                // 일반 문자열의 경우
                cleaned = data
                    .replace(/;/g, '') // 세미콜론 제거
                    .replace(/:/g, '') // 콜론 제거  
                    .replace(/\\/g, '') // 백슬래시 제거
                    .replace(/"/g, '\'') // 큰따옴표를 작은따옴표로 변경
                    .replace(/\n/g, ' ') // 줄바꿈을 공백으로 변경
                    .replace(/\r/g, '') // 캐리지 리턴 제거
                    .trim();
            }
            
            if (data !== cleaned) {
                console.log(`🧹 데이터 정리: "${data.substring(0, 50)}${data.length > 50 ? '...' : ''}" → "${cleaned.substring(0, 50)}${cleaned.length > 50 ? '...' : ''}"`);
            }
            return cleaned;
        }
        
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        
        if (data && typeof data === 'object') {
            const cleanedObj: any = {};
            Object.keys(data).forEach(key => {
                cleanedObj[key] = sanitizeData(data[key]);
            });
            return cleanedObj;
        }
        
        return data;
    };

    // 미리보기 이미지를 Blob으로 생성하는 함수
    const generatePreviewImage = async (): Promise<Blob | null> => {
        try {
            const imageDataUrl = await canvasCapture();
            if (!imageDataUrl) {
                console.error('이미지 캡처 실패');
                return null;
            }

            // DataURL을 Blob으로 변환
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            console.log('미리보기 이미지 생성 완료:', blob.size, 'bytes');
            return blob;
        } catch (error) {
            console.error('미리보기 이미지 생성 실패:', error);
            return null;
        }
    };

    // 템플릿 수정
    const handleUpdateTemplate = async () => {
        try {
            
            if (!isEditMode || !id) {
                alert('수정할 템플릿을 찾을 수 없습니다.');
                return;
            }
            
            // 카테고리를 cateNo로 매핑
            const getCateNo = (category: Category): number => {
                switch (category) {
                    case '업무': return 1;
                    case '생활': return 2;
                    case '여행': return 3;
                    default: return 3; // 기본값은 여행
                }
            };

            // 미리보기 이미지 생성
            const previewImageBlob = await generatePreviewImage();
            
            // 스텝별 데이터 구성 (보안 검증 포함)
            const stepsList = steps.map((step, stepIndex) => {
                // 해당 스텝의 오브젝트 리스트 (그리드 기반)
                const stepObjList = (step.items || []).map(item => {
                    return {
                        objNm: sanitizeData(item.label || '오브젝트'),
                        objX: item.x,
                        objY: item.y,
                        cateNo: item.cateNo || 3 // 카테고리 번호 추가 (기본값: 3=여행)
                    };
                });

                // objectItems에서 해당 스텝의 오브젝트들 추가
                const objectItemsList = objectItems.map(item => ({
                    objNm: sanitizeData(item.label || '오브젝트'),
                    objX: item.x,
                    objY: item.y,
                    cateNo: item.cateNo || 3
                }));

                // 두 리스트 합치기
                const allStepObjList = [...stepObjList, ...objectItemsList];

                // 해당 스텝의 텍스트 리스트 (스텝별로 2개씩)
                const stepStartIndex = stepIndex * 2;
                const stepTextList = textItems
                    .slice(stepStartIndex, stepStartIndex + 2)
                    .filter(textItem => textItem.content.trim() !== '')
                    .map(textItem => ({
                        text: sanitizeData(textItem.content),
                        stepTextX: typeof textItem.x === 'string' ? parseFloat(textItem.x) : textItem.x,
                        stepTextY: typeof textItem.y === 'string' ? parseFloat(textItem.y) : textItem.y
                    }));

                return {
                    stepObjList: allStepObjList,
                    stepTextList: stepTextList
                };
            });
            
            const templateUpdateData = {
                templateNo: Number(id), // 수정할 템플릿 번호
                templateNm: sanitizeData(templateName),
                cateNo: getCateNo(currentCategory),
                step: currentStepCount, // 스텝 선택에 따른 값 (1,2,3,4)
                imgFile: previewImageBlob,
                stepsList: stepsList
            };

            // multipart/form-data로 전송
            const formData = new FormData();
            
            // JSON 데이터 추가
            const stepsListJson = JSON.stringify(templateUpdateData.stepsList);
            
            formData.append('templateNo', templateUpdateData.templateNo.toString());
            formData.append('templateNm', templateUpdateData.templateNm);
            formData.append('cateNo', templateUpdateData.cateNo.toString());
            formData.append('step', templateUpdateData.step.toString());
            formData.append('stepsList', stepsListJson);
            
            // 이미지 파일 추가
            if (previewImageBlob) {
                formData.append('imgFile', previewImageBlob, 'template-preview.jpg');
            }

            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('http://localhost:8080/temp/templateUpdate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 오류 응답:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            
            alert('템플릿이 성공적으로 수정되었습니다!');
            navigate('/dashboard');
            
        } catch (error) {
            console.error('템플릿 수정 실패:', error);
            alert('템플릿 수정에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 템플릿 저장
    const handleSaveTemplate = async () => {
        try {
            
            // 카테고리를 cateNo로 매핑
            const getCateNo = (category: Category): number => {
                switch (category) {
                    case '업무': return 1;
                    case '생활': return 2;
                    case '여행': return 3;
                    default: return 3; // 기본값은 여행
                }
            };

            // 미리보기 이미지 생성
            const previewImageBlob = await generatePreviewImage();
            
            // 스텝별 데이터 구성 (보안 검증 포함)
            const stepsList = steps.map((step, stepIndex) => {
                // 해당 스텝의 오브젝트 리스트
                const stepObjList = (step.items || []).map(item => {
                    return {
                        objNm: sanitizeData(item.label || '오브젝트'),
                        objX: item.x,
                        objY: item.y,
                        cateNo: item.cateNo || 3 // 카테고리 번호 추가 (기본값: 3=여행)
                    };
                });

                // 해당 스텝의 텍스트 리스트 (스텝별로 2개씩)
                const stepStartIndex = stepIndex * 2;
                const stepTextList = textItems
                    .slice(stepStartIndex, stepStartIndex + 2)
                    .filter(textItem => textItem.content.trim() !== '')
                    .map(textItem => ({
                        text: sanitizeData(textItem.content),
                        stepTextX: typeof textItem.x === 'string' ? parseFloat(textItem.x) : textItem.x,
                        stepTextY: typeof textItem.y === 'string' ? parseFloat(textItem.y) : textItem.y
                    }));

                return {
                    stepObjList,
                    stepTextList
                };
            });
            
            const templateSaveData = {
                templateNm: sanitizeData(templateName),
                cateNo: getCateNo(currentCategory),
                step: currentStepCount, // 스텝 선택에 따른 값 (1,2,3,4)
                imgFile: previewImageBlob,
                stepsList: stepsList
            };

            // multipart/form-data로 전송
            const formData = new FormData();
            
            // JSON 문자열을 Base64로 인코딩하여 안전하게 전송
            const stepsListJson = JSON.stringify(templateSaveData.stepsList);
                        
            // 텍스트 데이터 추가
            formData.append('templateNm', templateSaveData.templateNm);
            formData.append('cateNo', templateSaveData.cateNo.toString());
            formData.append('step', templateSaveData.step.toString()); // 스텝 개수 (1,2,3,4)
            formData.append('stepsList', stepsListJson);
            
            // 이미지 파일 추가
            if (previewImageBlob) {
                formData.append('imgFile', previewImageBlob, 'template-preview.jpg');
            }

            const apiUrl = 'http://localhost:8080/temp/templateSave';
            
            // 토큰 가져오기
            const token = localStorage.getItem('token') || '';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 호출 실패:', response.status, response.statusText);
                console.error('❌ 에러 응답:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const responseData = await response.json();
            
            alert('템플릿이 성공적으로 저장되었습니다!');

        } catch (error) {
            console.error('❌ 템플릿 저장 실패:', error);
            
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
                } else if (error.message.includes('413')) {
                    alert('파일 크기가 너무 큽니다. 이미지를 줄여주세요.');
                } else if (error.message.includes('400') || error.message.includes('firewall')) {
                    alert('요청 데이터에 문제가 있습니다. 특수문자를 확인해주세요.');
                } else {
                    alert(`템플릿 저장 중 오류가 발생했습니다: ${error.message}`);
                }
            } else {
                alert('알 수 없는 오류가 발생했습니다.');
            }
        }
    };

    // 아이콘 클릭 시 가운데에 추가
    const handleIconClick = (icon: IconItem) => {
        const rect = dragRef.current?.getBoundingClientRect();
        if (rect) {
            // 캔버스 가운데 위치 계산
            const centerX = 50; // 50% (가운데)
            const centerY = 50; // 50% (가운데)
            
            const newItem: GridItem = {
                id: icon.id + '-' + Date.now(),
                type: 'object',
                content: icon.icon,
                label: icon.label,
                x: centerX,
                y: centerY,
                stepId: selectedStepId || selectedStep,
                sectionId: 'background',
                category: icon.category,
                cateNo: (() => {
                    switch (icon.category) {
                        case '업무': return 1;
                        case '생활': return 2;
                        case '여행': return 3;
                        default: return 3;
                    }
                })()
            };
            
            // 현재 선택된 스텝에 아이템 추가
            if (selectedStepId) {
                setSteps(prev => prev.map(step => 
                    step.id === selectedStepId 
                        ? { ...step, items: [...(step.items || []), newItem] }
                        : step
                ));
            } else {
                // 스텝이 선택되지 않았으면 첫 번째 스텝에 추가
                setSteps(prev => prev.map((step, index) => 
                    index === 0 
                        ? { ...step, items: [...(step.items || []), newItem] }
                        : step
                ));
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    
                    <div 
                        className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg cursor-pointer font-medium"
                        onClick={() => setShowCategoryModal(true)}
                    >
                        {currentCategory} ▼
                    </div>
                    
                    {isEditingName ? (
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            onKeyDown={handleNameKeyPress}
                            onBlur={handleNameSave}
                            className="text-xl font-semibold bg-transparent border-b-2 border-purple-500 outline-none px-1"
                            autoFocus
                        />
                    ) : (
                        <h1 
                            className="text-xl font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={handleNameEdit}
                            title="클릭하여 이름 편집"
                        >
                            {templateName}
                        </h1>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="line" className="px-6 py-2" onClick={handlePreview}>
                        미리보기
                    </Button>
                    <Button 
                        onClick={isEditMode ? handleUpdateTemplate : handleSaveTemplate} 
                        className="px-6 py-2"
                    >
                        {isEditMode ? '템플릿 수정' : '템플릿 저장'}
                    </Button>
                </div>
            </header>

            {/* 서브 메뉴 */}
            <nav className="h-14 bg-white border-b border-gray-100 px-6 flex items-center gap-4">
                <button 
                    onClick={() => setShowStepModal(true)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    스텝 수정
                </button>
                <button 
                    onClick={() => setShowBackgroundModal(true)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    배경 선택
                </button>
            </nav>

            {/* 메인 콘텐츠 */}
            <main className="flex">
                {/* 편집 영역 */}
                <div className="flex-1 p-6">
                    <div 
                        ref={dragRef}
                        className="canvas-container relative w-full h-[800px] bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
                        onClick={handleCanvasClick}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                    >
                        {/* 배경 이미지 */}
                        <img 
                            src={backgroundImage}
                            alt="배경"
                            className="absolute inset-0 w-full h-full object-contain z-0"
                            style={{
                                transform: 'scale(1.0)',
                                transformOrigin: 'center',
                                objectPosition: 'center'
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                        
                        {/* 전체 캔버스 드롭존 - 그리드 없이 자유 배치 */}
                            <div
                            className="absolute inset-0 w-full h-full"
                                style={{
                                    zIndex: 2,
                                cursor: 'default'
                            }}
                            onClick={() => handleStepSelect(selectedStep)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                
                                try {
                                    const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
                                    
                                    // 선택된 스텝에 아이콘 배치
                                    if (selectedStepId === selectedStep) {
                                        // 드롭 위치 계산 (마우스 위치 기준)
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const dropX = e.clientX - rect.left;
                                        const dropY = e.clientY - rect.top;
                                        
                                        // 퍼센트로 변환
                                        const percentX = (dropX / rect.width) * 100;
                                        const percentY = (dropY / rect.height) * 100;
                                        
                                        const newItem: GridItem = {
                                            ...itemData,
                                            x: percentX,
                                            y: percentY,
                                            stepId: selectedStep,
                                            sectionId: 'free-area', // 자유 영역 식별자
                                            cateNo: (() => {
                                                switch (itemData.category) {
                                                    case '업무': return 1;
                                                    case '생활': return 2;
                                                    case '여행': return 3;
                                                    default: return 3;
                                                }
                                            })()
                                        };
                                        
                                        // 스텝에 아이템 추가
                                        setSteps(prev => prev.map(step => 
                                            step.id === selectedStep 
                                                ? { 
                                                    ...step, 
                                                    items: [...(step.items || []), newItem]
                                                }
                                                : step
                                        ));
                                        
                                    } else {
                                        alert('먼저 스텝을 선택해주세요!');
                                    }
                                } catch (error) {
                                    console.error('드롭 처리 오류:', error);
                                }
                            }}
                        >
                            {/* 배치된 아이콘들 - 자유 위치 (모든 아이템 표시) */}
                            {steps.find(step => step.id === selectedStep)?.items?.map((item, index) => (
                                <div
                                    key={`${selectedStep}-free-${index}`}
                                    className={`absolute transition-all ${
                                        isDragging && draggedObject?.id === item.id 
                                            ? 'duration-0 scale-125 shadow-2xl ring-4 ring-blue-400/70 z-50 cursor-grabbing brightness-110' 
                                            : 'duration-200 ease-out cursor-grab hover:cursor-grab'
                                    } ${
                                        selectedObject === item.id ? 'ring-2 ring-blue-500 scale-110 brightness-110' : ''
                                    } ${
                                        hoveredObject === item.id && !isDragging ? 'scale-108 shadow-lg brightness-105' : 'scale-100'
                                    }`}
                                    style={{
                                        left: `${item.x}%`,
                                        top: `${item.y}%`,
                                        width: '60px',
                                        height: '60px',
                                        zIndex: isDragging && draggedObject?.id === item.id ? 1000 : 10,
                                        transform: `translate(-50%, -50%) perspective(800px) rotateY(-12deg) rotateX(3deg)`,
                                        transformOrigin: 'center center',
                                        filter: isDragging && draggedObject?.id === item.id 
                                            ? 'drop-shadow(0 8px 16px rgba(59, 130, 246, 0.4)) blur(0.5px)' 
                                            : selectedObject === item.id 
                                                ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))' 
                                                : 'none',
                                        transition: isDragging && draggedObject?.id === item.id 
                                            ? 'transform 0.1s ease-out, filter 0.1s ease-out' 
                                            : 'all 0.2s ease-out'
                                    }}
                                    draggable
                                    onMouseDown={(e) => handleDragStart(e, item)}
                                    onMouseEnter={() => setHoveredObject(item.id)}
                                    onMouseLeave={() => setHoveredObject(null)}
                                    onClick={() => {
                                        // 오브젝트 클릭 시 속성 > 준비물 탭으로 이동
                                        setSelectedObjectItem(item);
                                        setSelectedTextItem(null); // 텍스트 선택 해제
                                        setActiveTab('attributes');
                                    }}
                                    onContextMenu={(e) => handleObjectRightClick(e, item)}
                                >
                                    {item.type === 'object' ? (
                                        <div className="relative w-full h-full">
                                            <img 
                                                src={item.content} 
                                                alt={item.label || 'object'} 
                                                className="w-full h-full object-contain" 
                                                onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    // 이미지 로드 실패 시 기본 이미지로 대체
                                                    const categoryMap = { 1: '업무', 2: '일상', 3: '여행' };
                                                    const categoryName = categoryMap[item.cateNo as keyof typeof categoryMap] || '업무';
                                                    img.src = `/1. 오브젝트/${categoryName}/100px/간식.png`;
                                                    console.warn(`이미지 로드 실패: ${item.content}, 대체 이미지 사용: ${img.src}`);
                                                }}
                                            />
                                            {/* 아이콘 라벨 - 검은색 배경, 아이소메트릭 각도 */}
                                            <div 
                                                className="absolute -bottom-6 left-1/2 bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-md z-20"
                                                style={{
                                                    transform: 'translateX(-50%) perspective(800px) rotateY(-12deg) rotateX(3deg)',
                                                    transformOrigin: 'center center'
                                                }}
                                            >
                                                {item.label || '아이콘'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-black text-white text-xs p-1 rounded flex items-center justify-center">
                                            {item.content}
                                        </div>
                                    )}
                                </div>
                            )) || []}
                        </div>
                        
                        {/* 텍스트 아이템들 - 배경 이미지보다 뒤에 위치 */}
                        {textItems.map((item, index) => {
                            const dynamicPositions = calculateTextPositions();
                            const position = dynamicPositions[index] || { x: item.x, y: item.y };
                            
                            return (
                            <div
                                key={item.id}
                                className="absolute select-none text-item-container"
                                                    style={{
                                    left: `${position.x}%`,
                                    top: `${position.y}%`,
                                    zIndex: 5, // 배경 이미지보다 뒤에 위치
                                }}
                            >
                                {item.isEditing ? (
                                    <div className="relative">
                                        <textarea
                                            value={item.content}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                // 글자 수 제한 (기본 25자, 확장 시 50자)
                                                const maxLength = item.isExpanded ? 50 : 25;
                                                if (newValue.length <= maxLength) {
                                                    setTextItems(prev => 
                                                        prev.map(textItem => 
                                                            textItem.id === item.id 
                                                                ? { ...textItem, content: newValue }
                                                                : textItem
                                                        )
                                                    );
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    handleTextSave(item.id, item.content);
                                                } else if (e.key === 'Escape') {
                                                    handleTextEdit(item.id);
                                                }
                                            }}
                                            onBlur={() => handleTextSave(item.id, item.content)}
                                            placeholder="텍스트를 입력하세요"
                                            maxLength={item.isExpanded ? 50 : 25}
                                            className="bg-purple-600 text-white border-2 border-purple-500 rounded-lg px-3 py-2 outline-none resize-none placeholder-gray-400 overflow-hidden shadow-lg text-item-isometric"
                                            style={{
                                                width: '220px',
                                                height: '120px',
                                                fontSize: item.fontSize,
                                                lineHeight: '1.4',
                                                wordWrap: 'break-word',
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => {
                                            // 텍스트 클릭 시 속성 > 텍스트 박스 탭으로 이동
                                            setSelectedTextItem(item.id);
                                            setSelectedObjectItem(null); // 오브젝트 선택 해제
                                            setActiveTab('attributes');
                                        }}
                                        onDoubleClick={() => {
                                            // 더블클릭 시 바로 편집 모드로 전환
                                            handleTextEdit(item.id);
                                        }}
                                        className={`border-2 rounded-lg px-3 py-2 shadow-md transition-all cursor-text overflow-hidden text-item-isometric ${
                                            item.content 
                                                ? 'text-item-normal' 
                                                : 'text-item-disabled'
                                        }`}
                                                    style={{
                                            width: '220px',
                                            height: item.isExpanded ? '180px' : '120px',
                                            fontSize: item.fontSize,
                                            lineHeight: '1.4',
                                            wordWrap: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                        title="클릭: 속성 패널 이동 | 더블클릭: 바로 편집"
                                    >

                                        {item.content ? (
                                            <div 
                                                className={`${!item.isExpanded && item.content.length > 20 ? 'line-clamp-3' : ''}`}
                                                style={{
                                                    maxHeight: item.isExpanded ? '160px' : '100px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {item.content}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-center text-gray-400">
                                                텍스트를 입력하세요
                                                        </div>
                                                    )}
                                        
                                        {/* 더보기/접기 버튼 */}
                                        {item.content && item.content.length > 20 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextItems(prev => 
                                                        prev.map(textItem => 
                                                            textItem.id === item.id 
                                                                ? { ...textItem, isExpanded: !textItem.isExpanded }
                                                                : textItem
                                                        )
                                                    );
                                                }}
                                                className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors"
                                            >
                                                {item.isExpanded ? '접기' : '더보기'}
                                            </button>
                                        )}
                            </div>
                                )}
                            </div>
                            );
                        })}
                        
                        {/* 오브젝트 아이템들 - 절대 좌표로 표시 */}
                        {objectItems.map((item, index) => {
                            return (
                                <div
                                    key={item.id}
                                    className={`absolute transition-all ${
                                        isDraggingObjectItem && draggedObjectItem?.id === item.id 
                                            ? 'duration-0 scale-125 shadow-2xl z-50 cursor-grabbing brightness-110' 
                                            : 'duration-200 ease-out cursor-grab hover:cursor-grab hover:scale-108 hover:shadow-lg hover:brightness-105'
                                    }`}
                                    style={{
                                        left: `${item.x}%`,
                                        top: `${item.y}%`,
                                        width: '60px',
                                        height: '60px',
                                        zIndex: 10,
                                        transform: `translate(-50%, -50%) perspective(800px) rotateY(-12deg) rotateX(3deg)`,
                                        transformOrigin: 'center center',
                                    }}
                                    draggable
                                    onMouseDown={(e) => handleObjectDragStart(e, item)}
                                    onMouseEnter={() => setHoveredObject(item.id)}
                                    onMouseLeave={() => setHoveredObject(null)}
                                    onClick={() => {
                                        setSelectedObjectItem(item);
                                        setSelectedTextItem(null);
                                        setActiveTab('attributes');
                                    }}
                                    onContextMenu={(e) => handleObjectItemRightClick(e, item)}
                                >
                                    {item.type === 'object' ? (
                                        <div className="relative w-full h-full">
                                            <img 
                                                src={item.content} 
                                                alt={item.label || 'object'} 
                                                className="w-full h-full object-contain" 
                                                onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    // 이미지 로드 실패 시 기본 이미지로 대체
                                                    const categoryMap = { 1: '업무', 2: '일상', 3: '여행' };
                                                    const categoryName = categoryMap[item.cateNo as keyof typeof categoryMap] || '업무';
                                                    img.src = `/1. 오브젝트/${categoryName}/100px/간식.png`;
                                                    console.warn(`이미지 로드 실패: ${item.content}, 대체 이미지 사용: ${img.src}`);
                                                }}
                                            />
                                            {/* 아이콘 라벨 - 검은색 배경, 아이소메트릭 각도 */}
                                            <div 
                                                className="absolute -bottom-6 left-1/2 bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-md z-20"
                                                style={{
                                                    transform: 'translateX(-50%) perspective(800px) rotateY(-12deg) rotateX(3deg)',
                                                    transformOrigin: 'center center'
                                                }}
                                            >
                                                {item.label || '아이콘'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs">
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* 오른쪽 패널 */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    {/* 탭 메뉴 */}
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 py-3 text-sm font-medium ${
                                activeTab === 'preparations' 
                                    ? 'text-purple-600 border-b-2 border-purple-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('preparations')}
                        >
                            준비물 추가
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium ${
                                activeTab === 'attributes' 
                                    ? 'text-purple-600 border-b-2 border-purple-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('attributes')}
                        >
                            속성
                        </button>
                    </div>
                    
                    {/* 탭 콘텐츠 */}
                    <div className="flex-1 p-4">
                        {activeTab === 'preparations' && (
                            <div className="space-y-4">
                                {/* 카테고리 필터 */}
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1 text-sm rounded-full ${
                                            recommendationTab === 'recommended' 
                                                ? 'bg-purple-100 text-purple-600' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                        onClick={() => setRecommendationTab('recommended')}
                                    >
                                        추천
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm rounded-full ${
                                            recommendationTab === 'all' 
                                                ? 'bg-purple-100 text-purple-600' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                        onClick={() => setRecommendationTab('all')}
                                    >
                                        전체
                                    </button>
                                </div>
                                
                                {/* 검색바 */}
                                <input
                                    type="text"
                                    placeholder="준비물 검색"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                
                                {/* 카테고리 버튼들 */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-700">카테고리</h3>
                                    <div className="flex gap-2">
                                        {recommendationTab === 'recommended' ? (
                                            <button
                                                className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium"
                                                onClick={() => changeObjectCategory(objectCategory)}
                                            >
                                                {objectCategory}
                                            </button>
                                        ) : (
                                            <>
                                                {(['업무', '생활', '여행'] as Category[]).map((category) => (
                                                    <button
                                                        key={category}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                            objectCategory === category
                                                                ? 'bg-purple-100 text-purple-600'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                        onClick={() => changeObjectCategory(category)}
                                                    >
                                                        {category}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* 오브젝트 리스트 */}
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredIconList.map((icon) => (
                                        <div
                                            key={icon.id}
                                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 active:cursor-grabbing"
                                            draggable
                                            onDragStart={(e) => {
                                                const dragItem: GridItem = {
                                                    id: icon.id,
                                                    type: 'object',
                                                    content: icon.icon,
                                                    x: 0,
                                                    y: 0,
                                                    stepId: selectedStep,
                                                    label: icon.label,
                                                    category: icon.category // 카테고리 정보 추가
                                                };
                                                e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            title={`${icon.label} 드래그하여 배치`}
                                            onClick={() => handleIconClick(icon)}
                                        >
                                                <img 
                                                    src={icon.icon} 
                                                    alt={icon.label} 
                                                className="w-12 h-12 object-contain"
                                            />
                                            <span className="text-sm text-gray-700">{icon.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'attributes' && (
                            <div className="h-full flex flex-col">
                                {/* 속성 하위 탭 */}
                                <div className="flex border-b border-gray-200 mb-4">
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium transition-all ${
                                            selectedObjectItem || (!selectedTextItem && !selectedObjectItem)
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                        onClick={() => {
                                            setSelectedTextItem(null);
                                            setSelectedObjectItem(null);
                                        }}
                                    >
                                        준비물
                                    </button>
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium transition-all ${
                                            selectedTextItem
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                        onClick={() => {
                                            // 텍스트박스 탭 클릭 시 첫 번째 텍스트 선택하거나 텍스트 탭으로 전환
                                            setSelectedObjectItem(null);
                                            if (textItems.length > 0) {
                                                setSelectedTextItem(textItems[0].id);
                                            } else {
                                                // 텍스트가 없으면 새로 생성
                                                const { positions } = getTextPositionsAndLimit(currentStepCount);
                                                if (positions.length > 0) {
                                                    const position = positions[0];
                                                    const newTextItem: TextItem = {
                                                        id: `text-${Date.now()}`,
                                                        content: '',
                                                        x: parseFloat(position.x),
                                                        y: parseFloat(position.y),
                                                        fontSize: 16,
                                                        color: '#000000',
                                                        isEditing: false,
                                                        isExpanded: false
                                                    };
                                                    setTextItems([newTextItem]);
                                                    setSelectedTextItem(newTextItem.id);
                                                }
                                            }
                                        }}
                                    >
                                        텍스트 박스
                                    </button>
                                </div>

                                {/* 탭 콘텐츠 */}
                                <div className="flex-1 overflow-y-auto">
                                    {/* 준비물 탭 */}
                                    {!selectedTextItem && (
                            <div className="space-y-4">
                                            {/* 오브젝트 미선택 상태 */}
                                            {!selectedObjectItem && (
                                                <div className="border rounded-lg p-4 bg-gray-50">
                                                    <h3 className="font-medium mb-2">준비물 속성</h3>
                                                    <p className="text-sm text-gray-500">캔버스의 준비물을 클릭하여 속성을 편집하세요.</p>
                                                </div>
                                            )}

                                            {/* 오브젝트 속성 편집 */}
                                            {selectedObjectItem && (
                                                <div className="border rounded-lg p-4 bg-blue-50">
                                                    <h3 className="font-medium mb-3">준비물 속성</h3>
                                                    <div className="space-y-3">
                                <div>
                                                            <label className="block text-sm font-medium mb-1">이름</label>
                                    <input 
                                        type="text" 
                                                                value={selectedObjectItem.label || ''}
                                                                readOnly
                                                                placeholder="준비물명 (수정불가)"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {(selectedObjectItem.label || '').length}/8자
                                                            </p>
                                </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    // 캔버스의 오브젝트 업데이트
                                                                    setSteps(prev => 
                                                                        prev.map(step => ({
                                                                            ...step,
                                                                            items: step.items?.map(item => 
                                                                                item.id === selectedObjectItem.id 
                                                                                    ? { ...item, label: selectedObjectItem.label }
                                                                                    : item
                                                                            ) || []
                                                                        }))
                                                                    );
                                                                    setSelectedObjectItem(null);
                                                                }}
                                                                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                                                            >
                                                                저장
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedObjectItem(null)}
                                                                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                                            >
                                                                취소
                                                            </button>
                                </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 텍스트 박스 탭 */}
                                    {selectedTextItem && (
                                        <div className="space-y-4">
                                            {/* 스텝별 텍스트 박스 관리 */}
                                            {steps.map((step, stepIndex) => (
                                                <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded font-medium">
                                                                스텝 {stepIndex + 1}
                                                            </span>
                                    <input 
                                        type="text" 
                                                            value={step.name}
                                                            onChange={(e) => {
                                                                setSteps(prev => 
                                                                    prev.map(s => 
                                                                        s.id === step.id 
                                                                            ? { ...s, name: e.target.value }
                                                                            : s
                                                                    )
                                                                );
                                                            }}
                                                            className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none px-1 py-0.5"
                                                            placeholder="스텝명 입력"
                                                        />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">
                                                                텍스트박스: {textItems.filter((_, i) => {
                                                                    const stepStartIndex = stepIndex * 2;
                                                                    return i >= stepStartIndex && i < stepStartIndex + 2;
                                                                }).length}/2
                                                            </span>
                                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                                                글로벌: {stepIndex * 2 + 1}~{stepIndex * 2 + 2}
                                                            </span>
                                                        </div>
                                </div>
                                                    
                                                    {/* 해당 스텝의 텍스트 박스들 */}
                                                    <div className="space-y-3">
                                                        {[0, 1].map(textIndex => {
                                                            const globalIndex = stepIndex * 2 + textIndex;
                                                            const textItem = textItems[globalIndex];
                                                            
                                                            return (
                                                                <div key={textIndex} className="border border-gray-200 rounded p-3 bg-white">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium">텍스트박스 {textIndex + 1}</span>
                                                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                                                                글로벌 #{globalIndex + 1}
                                                                            </span>
                                                                        </div>
                                                                        {textItem && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setTextItems(prev => prev.filter((_, i) => i !== globalIndex));
                                                                                }}
                                                                                className="text-red-500 text-xs hover:text-red-700"
                                                                            >
                                                                                삭제
                                                                            </button>
                                                                        )}
                            </div>
                                                                    
                                                                    {textItem ? (
                                                                        <textarea
                                                                            value={textItem.content}
                                                                            onChange={(e) => {
                                                                                const newValue = e.target.value;
                                                                                if (newValue.length <= 25) {
                                                                                    setTextItems(prev => 
                                                                                        prev.map((item, i) => 
                                                                                            i === globalIndex 
                                                                                                ? { ...item, content: newValue }
                                                                                                : item
                                                                                        )
                                                                                    );
                                                                                }
                                                                            }}
                                                                            placeholder="텍스트를 입력하세요 (최대 25자)"
                                                                            maxLength={25}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                                                                            rows={2}
                                                                        />
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => {
                                                                                const { positions } = getTextPositionsAndLimit(currentStepCount);
                                                                                if (globalIndex < positions.length) {
                                                                                    const position = positions[globalIndex];
                                                                                    const newTextItem: TextItem = {
                                                                                        id: `text-${Date.now()}`,
                                                                                        content: '',
                                                                                        x: parseFloat(position.x),
                                                                                        y: parseFloat(position.y),
                                                                                        fontSize: 16,
                                                                                        color: '#000000',
                                                                                        isEditing: false,
                                                                                        isExpanded: false
                                                                                    };
                                                                                    setTextItems(prev => {
                                                                                        const newItems = [...prev];
                                                                                        newItems[globalIndex] = newTextItem;
                                                                                        return newItems;
                                                                                    });
                                                                                    setSelectedTextItem(newTextItem.id);
                                                                                }
                                                                            }}
                                                                            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 text-sm rounded hover:border-purple-400 hover:text-purple-600"
                                                                        >
                                                                            + 추가
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 모달들 */}
            <CategorySelectModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSelectCategory={changeCategory}
                currentCategory={currentCategory}
            />
            
            <StepSelectModal
                isOpen={showStepModal}
                onClose={() => setShowStepModal(false)}
                onSelectStep={changeStep}
                currentCategory={currentCategory}
            />
            
            <BackgroundSelectModal
                isOpen={showBackgroundModal}
                onClose={() => setShowBackgroundModal(false)}
                onSelectBackground={changeBackground}
                currentCategory={currentCategory}
                currentBackground={backgroundImage}
            />

            {/* 미리보기 모달 */}
            {showPreviewModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        // 배경 클릭 시 모달 닫기
                        if (e.target === e.currentTarget) {
                            setShowPreviewModal(false);
                        }
                    }}
                    onKeyDown={(e) => {
                        // ESC 키로 모달 닫기
                        if (e.key === 'Escape') {
                            setShowPreviewModal(false);
                        }
                    }}
                    tabIndex={-1} // 키보드 이벤트를 받기 위해 focusable 설정
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 차단
                    >
                        {/* 헤더 */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">템플릿 미리보기</h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.download = 'template-preview.png';
                                            link.href = previewImage;
                                            link.click();
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        PNG 다운로드
                                    </button>
                                    <button
                                        onClick={() => setShowPreviewModal(false)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M15 5L5 15M5 5L15 15" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 콘텐츠 */}
                        <div className="p-6 flex-1 overflow-auto flex flex-col">
                            <div className="text-center mb-4">
                                <p className="text-gray-600 text-sm">
                                    캔버스 영역의 현재 상태를 고화질 PNG로 캡처했습니다.
                                </p>
                            </div>
                            
                            {/* 미리보기 이미지 - 캔버스와 동일한 비율 유지 */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white max-w-full max-h-full">
                                    <img 
                                        src={previewImage} 
                                        alt="템플릿 미리보기" 
                                        className="block w-auto h-auto max-w-full max-h-full"
                                        style={{ 
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 컨텍스트 메뉴 */}
            {contextMenu.show && contextMenu.item && (
                <div 
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                >
                    <button 
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => duplicateObject(contextMenu.item!)}
                    >
                        복제
                    </button>
                    <button 
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                        onClick={() => deleteObject(contextMenu.item!)}
                    >
                        삭제
                    </button>
                </div>
            )}
            
            {/* 우클릭 컨텍스트 메뉴 */}
            {showContextMenu && contextMenuObject && (
                <div
                    className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
                    style={{
                        left: contextMenuPosition.x,
                        top: contextMenuPosition.y
                    }}
                >
                    <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => {
                            // objectItems인지 GridItem인지 구분
                            if (contextMenuObject && 'content' in contextMenuObject && 'type' in contextMenuObject) {
                                duplicateObjectItem(contextMenuObject);
                            } else {
                                duplicateObject(contextMenuObject);
                            }
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복제
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => {
                            // objectItems인지 GridItem인지 구분
                            if (contextMenuObject && 'content' in contextMenuObject && 'type' in contextMenuObject) {
                                deleteObjectItem(contextMenuObject);
                            } else {
                                deleteObject(contextMenuObject);
                            }
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                    </button>
                </div>
            )}
            
            {/* 컨텍스트 메뉴 외부 클릭 시 닫기 */}
            {showContextMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowContextMenu(false)}
                />
            )}
        </div>
    );
};

export default TemplateEditPage;
