import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../../components/Header";
import Button from "../../components/Button";
import './TemplateDetailPage.css';
import dayjs from 'dayjs';

// 기본 타입 정의들 (TemplateEditPage에서 복사)
type Category = '업무' | '생활' | '여행';

interface GridItem {
    id: string;
    type: 'icon' | 'object';
    content: string;
    label: string;
    x: number;
    y: number;
    category: number;
    cateNo: number;
    stepId: string;
}

interface TextItem {
    id: string;
    content: string;
    x: number;
    y: number;
    isEditing: boolean;
    fontSize: number;
    color: string;
    isExpanded?: boolean;
}

interface Step {
    id: string;
    name: string;
    grid: (GridItem | null)[][];
    sections: Record<string, unknown>[];
    items?: GridItem[];
}

const TemplateDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // 상태 정의
    const [templateName, setTemplateName] = useState<string>('템플릿명');
    const [currentCategory, setCurrentCategory] = useState<Category>('여행');
    const [currentStepCount, setCurrentStepCount] = useState<number>(1);
    const [backgroundImage, setBackgroundImage] = useState('/cate-1-step-1.svg');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [steps, setSteps] = useState<Step[]>([]);
    const [textItems, setTextItems] = useState<TextItem[]>([]);
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
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedStep, setSelectedStep] = useState<string>('step1');
    const [selectedStepId, setSelectedStepId] = useState<string>('step1');
    
    // 모달 상태
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    
    // 알림 설정 상태
    const [selectedTime, setSelectedTime] = useState({ hour: 0, minute: 0, meridiem: '오전' });
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [repeatDays, setRepeatDays] = useState<string[]>([]);
    const [repeatEnabled, setRepeatEnabled] = useState<boolean>(false);
    const [specificDate, setSpecificDate] = useState<string | null>(null);
    const [memo, setMemo] = useState<string>('');
    const [showTimeSelect, setShowTimeSelect] = useState<boolean>(false);
    const [showChannelSelect, setShowChannelSelect] = useState<boolean>(false);
    const [tempTime, setTempTime] = useState({ hour: 0, minute: 0, meridiem: '오전' as '오전' | '오후' });
    
    const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));

    // 삭제 기능
    const handleDeleteTemplate = async () => {
        if (!id || id === 'new') return;
        
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('http://localhost:8080/temp/templateDelete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ templateNo: Number(id) })
            });

            if (!response.ok) {
                throw new Error('템플릿 삭제 실패');
            }

            alert('템플릿이 삭제되었습니다.');
            navigate('/dashboard');
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('템플릿 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // PNG 다운로드 기능
    const handleDownloadPNG = async () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const canvasElement = document.querySelector('.canvas-container') as HTMLElement;
            if (!canvasElement) return;

            // 캔버스 크기 설정
            canvas.width = 800;
            canvas.height = 800;

            // 배경 그리기
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 배경 이미지 로드 및 그리기
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                bgImage.onload = () => {
                    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
                    resolve(void 0);
                };
                bgImage.onerror = reject;
                bgImage.src = backgroundImage;
            });

            // 오브젝트 그리기
            for (const item of objectItems) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve) => {
                    img.onload = () => {
                        const x = (item.x / 100) * canvas.width - 30;
                        const y = (item.y / 100) * canvas.height - 30;
                        ctx.drawImage(img, x, y, 60, 60);
                        resolve(void 0);
                    };
                    img.onerror = () => resolve(void 0);
                    img.src = item.content;
                });
            }

            // 텍스트 그리기
            textItems.forEach(item => {
                const x = (item.x / 100) * canvas.width;
                const y = (item.y / 100) * canvas.height;
                
                ctx.font = `${item.fontSize}px Arial`;
                ctx.fillStyle = item.color;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                const lines = item.content.split('\n');
                lines.forEach((line, index) => {
                    ctx.fillText(line, x, y + (index * item.fontSize * 1.4));
                });
            });

            // 다운로드
            const link = document.createElement('a');
            link.download = `${templateName}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('PNG 다운로드 오류:', error);
            alert('PNG 다운로드 중 오류가 발생했습니다.');
        }
    };

    // 알림 설정 기능
    const handleNotificationSettings = async () => {
        if (!specificDate) {
            const today = dayjs().format("YYYY-MM-DD");
            setSpecificDate(today);
        }
        setShowNotificationModal(true);
    };

    // 날짜 관련 함수들
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    
    const startDay = currentMonth.startOf("week");
    const endDay = currentMonth.endOf("month").endOf("week");
    
    const dateList: dayjs.Dayjs[] = [];
    let date = startDay;
    
    while (date.isSame(endDay, "day") || date.isBefore(endDay, "day")) {
        dateList.push(date);
        date = date.add(1, "day");
    }
    
    const isSameDay = (a: dayjs.Dayjs, b: string | null) => {
        return b !== null && a.format("YYYY-MM-DD") === b;
    };
    
    const handleDateClick = (date: dayjs.Dayjs) => {
        const dateStr = date.format("YYYY-MM-DD");
        setSpecificDate(specificDate === dateStr ? null : dateStr);
    };
    
    const toggleRepeatDay = (day: string) => {
        setRepeatDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };
    
    const selectAllDays = () => {
        if (repeatDays.length === 7) {
            setRepeatDays([]);
        } else {
            setRepeatDays([...days]);
        }
    };
    
    const toggleChannel = (channel: string) => {
        setSelectedChannels(prev => 
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };
    
    const isTimeSet = selectedTime.hour !== 0 || selectedTime.minute !== 0 || (selectedTime.hour === 0 && selectedTime.meridiem === '오전');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formattedTime = isTimeSet
        ? `${selectedTime.meridiem} ${selectedTime.hour === 0 ? 12 : selectedTime.hour}:${selectedTime.minute.toString().padStart(2, "0")}`
        : "없음";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formattedChannels = selectedChannels.length > 0 ? selectedChannels.join(", ") : "없음";
    
    const handleSaveNotification = async () => {
        try {
            // 반복요일 체크가 되어 있는데 선택된 요일이 없는 경우 검증
            if (repeatEnabled && repeatDays.length === 0) {
                alert('선택된 요일이 없습니다');
                return;
            }

            // 요일 매핑
            const dayMapping = {
                '월': 'MON',
                '화': 'TUE', 
                '수': 'WED',
                '목': 'THU',
                '금': 'FRI',
                '토': 'SAT',
                '일': 'SUN'
            };

            // repeatType 설정
            const repeatType = repeatEnabled ? 'true' : 'false';

            // alarmRepeatDay 설정 (반복요일이 체크되어 있고 선택된 요일이 있는 경우)
            const alarmRepeatDay = repeatEnabled && repeatDays.length > 0 
                ? repeatDays.map(day => dayMapping[day]).join(',')
                : null;

            // 알림채널 설정
            const slackYn = selectedChannels.includes('슬랙') ? 'Y' : 'N';
            const googleCalendarYn = selectedChannels.includes('구글 캘린더') ? 'Y' : 'N';

            // 12시간 형식을 24시간 형식으로 변환
            let hour24 = selectedTime.hour;
            if (selectedTime.meridiem === '오후' && selectedTime.hour !== 12) {
                hour24 = selectedTime.hour + 12;
            } else if (selectedTime.meridiem === '오전' && selectedTime.hour === 12) {
                hour24 = 0;
            }

            // 시간 포맷팅 (MySQL time 형식: HH:MM:SS)
            const timeValue = `${hour24.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}:00`;

            // alarmTime과 alarmDt 설정
            let alarmTime = null;
            let alarmDt = null;

            if (repeatType === 'true') {
                // 반복인 경우 alarmTime에 시간값 설정 (문자열 보장)
                alarmTime = String(timeValue);
            } else {
                // 반복이 아닌 경우 alarmDt에 날짜+시간 설정 (MySQL datetime 형식)
                if (specificDate) {
                    // specificDate는 'YYYY-MM-DD' 형식이므로 시간을 추가
                    alarmDt = `${specificDate} ${timeValue}`;
                }
            }

            const payload = {
                templateNo: Number(id),
                repeatType,
                alarmRepeatDay,
                slackYn,
                googleCalendarYn,
                alarmTime,
                alarmDt,
                alarmText: memo || null
            };

            console.log('알림 설정 저장 payload:', payload);
            console.log('alarmTime 타입과 값:', typeof alarmTime, alarmTime);
            console.log('timeValue 타입과 값:', typeof timeValue, timeValue);

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/temp/templateAlarmSave', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('알림 설정 저장 실패');
            }

            alert('알림 설정이 저장되었습니다.');
            setShowNotificationModal(false);

        } catch (error) {
            console.error('알림 설정 저장 에러:', error);
            alert('알림 설정 저장에 실패했습니다.');
        }
    };

    // 데이터 로딩
    useEffect(() => {
        let isCancelled = false;
        
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
                
                if (isCancelled) return;

                console.log("data.templateData : "+data.templateData);
                console.log("data.templateData.alarmDt : "+data.templateData.alarmDt);
                console.log("data.templateData.repeatType : "+data.templateData.repeatType);
                console.log("data.templateData.alarmRepeatDay : "+data.templateData.alarmRepeatDay);
                console.log("data.templateData.alarmTime : "+data.templateData.alarmTime);
                console.log("data.templateData.alarmText : "+data.templateData.alarmText);
                
                if (data.templateData) {
                    const templateData = data.templateData;
                    
                    // 기본 정보 설정
                    setTemplateName(templateData.templateNm || '템플릿명');
                    setCurrentStepCount(templateData.stepCount || 1);
                    
                    // 카테고리 설정
                    const categoryMap: { [key: number]: Category } = {
                        1: '업무',
                        2: '생활', 
                        3: '여행'
                    };
                    setCurrentCategory(categoryMap[templateData.cateNo] || '여행');
                    
                    // 배경 이미지 설정
                    const bgImage = `/cate-${templateData.cateNo}-step-1.svg`;
                    setBackgroundImage(bgImage);

                    // stepsList 처리
                    if (templateData.stepsList && Array.isArray(templateData.stepsList)) {
                        const finalSteps: Step[] = [];
                        const finalTextItems: TextItem[] = [];
                        const finalObjectItems: Record<string, unknown>[] = [];

                        templateData.stepsList.forEach((stepData: Record<string, unknown>, stepIndex: number) => {
                            // 스텝 생성
                            const newStep: Step = {
                                id: `step${stepIndex + 1}`,
                                name: `스텝 ${stepIndex + 1} 구성`,
                                grid: Array(8).fill(null).map(() => Array(8).fill(null)),
                                sections: [],
                                items: []
                            };

                            // 오브젝트 처리
                            if (stepData.stepObjList && Array.isArray(stepData.stepObjList)) {
                                stepData.stepObjList.forEach((obj: Record<string, unknown>, objIndex: number) => {
                                    const objX = obj.objX || 0;
                                    const objY = obj.objY || 0;
                                    const objNm = obj.objNm || `오브젝트${objIndex}`;
                                    const cateNo = obj.cateNo || 1;
                                    
                                    // 카테고리별 이미지 매핑
                                    const getCategoryImage = (cateNo: number, label: string) => {
                                        const categoryMap = {
                                            1: '업무',
                                            2: '일상', 
                                            3: '여행'
                                        };
                                        
                                        const categoryName = categoryMap[cateNo as keyof typeof categoryMap] || '업무';
                                        return `/1. 오브젝트/${categoryName}/100px/${label}.png`;
                                    };

                                    const objectItem = {
                                        id: `obj_${stepIndex}_${objIndex}`,
                                        label: objNm,
                                        x: objX,
                                        y: objY,
                                        category: cateNo,
                                        cateNo: cateNo,
                                        type: 'object',
                                        content: getCategoryImage(cateNo, objNm)
                                    };
                                    
                                    finalObjectItems.push(objectItem);
                                });
                            }

                            // 텍스트 처리
                            if (stepData.stepTextList && Array.isArray(stepData.stepTextList)) {
                                stepData.stepTextList.forEach((textData: Record<string, unknown>, textIndex: number) => {
                                    const textItem: TextItem = {
                                        id: `text_${stepIndex}_${textIndex}`,
                                        content: textData.text || textData.stepTextContent || '',
                                        x: textData.stepTextX || textData.x || 0,
                                        y: textData.stepTextY || textData.y || 0,
                                        isEditing: false,
                                        fontSize: textData.stepTextSize || 16,
                                        color: textData.stepTextColor || '#000000',
                                        isExpanded: false
                                    };
                                    finalTextItems.push(textItem);
                                });
                            }

                            finalSteps.push(newStep);
                        });
                        
                        setSteps(finalSteps);
                        setTextItems(finalTextItems);
                        setObjectItems(finalObjectItems);
                        setSelectedStep('step1');
                        setSelectedStepId('step1');
                    }

                    // 알림설정 데이터 처리
                    if (templateData.alarmDt || templateData.alarmTime || templateData.repeatType) {
                        // repeatType 처리
                        const isRepeatEnabled = templateData.repeatType === 'true' || templateData.repeatType === true;
                        setRepeatEnabled(isRepeatEnabled);

                        if (isRepeatEnabled) {
                            // 반복요일인 경우
                            if (templateData.alarmTime) {
                                // alarmTime에서 시간 추출 (HH:MM:SS 형식)
                                const timeStr = templateData.alarmTime;
                                const [hourStr, minuteStr] = timeStr.split(':');
                                const hour24 = parseInt(hourStr);
                                
                                // 24시간 형식을 12시간 형식으로 변환
                                let hour12, meridiem;
                                if (hour24 === 0) {
                                    hour12 = 12;
                                    meridiem = '오전';
                                } else if (hour24 < 12) {
                                    hour12 = hour24;
                                    meridiem = '오전';
                                } else if (hour24 === 12) {
                                    hour12 = 12;
                                    meridiem = '오후';
                                } else {
                                    hour12 = hour24 - 12;
                                    meridiem = '오후';
                                }

                                setSelectedTime({
                                    hour: hour12,
                                    minute: parseInt(minuteStr),
                                    meridiem: meridiem as '오전' | '오후'
                                });
                                
                                setTempTime({
                                    hour: hour12,
                                    minute: parseInt(minuteStr),
                                    meridiem: meridiem as '오전' | '오후'
                                });
                            }

                            // alarmRepeatDay 처리 (예: "MON,TUE,WED")
                            if (templateData.alarmRepeatDay) {
                                const dayMapping = {
                                    'MON': '월',
                                    'TUE': '화', 
                                    'WED': '수',
                                    'THU': '목',
                                    'FRI': '금',
                                    'SAT': '토',
                                    'SUN': '일'
                                };
                                
                                const repeatDaysList = templateData.alarmRepeatDay.split(',')
                                    .map((day: string) => dayMapping[day.trim() as keyof typeof dayMapping])
                                    .filter((day: string) => day);
                                
                                setRepeatDays(repeatDaysList);
                            }
                        } else {
                            // 특정 날짜인 경우 (repeatType이 false)
                            setRepeatDays([]); // 반복요일 체크 해제
                            
                            if (templateData.alarmDt) {
                                // alarmDt에서 날짜와 시간 추출 (YYYY-MM-DD HH:MM:SS 형식)
                                const dateTimeStr = templateData.alarmDt;
                                const [dateStr, timeStr] = dateTimeStr.split(' ');
                                
                                // 날짜 설정 - 달력에서 해당 날짜가 체크되도록
                                setSpecificDate(dateStr);
                                
                                // 달력의 월을 해당 날짜의 월로 설정
                                const targetDate = dayjs(dateStr);
                                setCurrentMonth(targetDate.startOf('month'));
                                
                                // 시간 설정
                                const [hourStr, minuteStr] = timeStr.split(':');
                                const hour24 = parseInt(hourStr);
                                
                                // 24시간 형식을 12시간 형식으로 변환
                                let hour12, meridiem;
                                if (hour24 === 0) {
                                    hour12 = 12;
                                    meridiem = '오전';
                                } else if (hour24 < 12) {
                                    hour12 = hour24;
                                    meridiem = '오전';
                                } else if (hour24 === 12) {
                                    hour12 = 12;
                                    meridiem = '오후';
                                } else {
                                    hour12 = hour24 - 12;
                                    meridiem = '오후';
                                }

                                setSelectedTime({
                                    hour: hour12,
                                    minute: parseInt(minuteStr),
                                    meridiem: meridiem as '오전' | '오후'
                                });
                                
                                setTempTime({
                                    hour: hour12,
                                    minute: parseInt(minuteStr),
                                    meridiem: meridiem as '오전' | '오후'
                                });
                            }
                        }

                        // 알림 메시지 설정
                        if (templateData.alarmText) {
                            setMemo(templateData.alarmText);
                        }

                        // 알림 채널 설정
                        const channels: string[] = [];
                        if (templateData.slackYn === 'Y') {
                            channels.push('슬랙');
                        }
                        if (templateData.googleCalendarYn === 'Y') {
                            channels.push('구글 캘린더');
                        }
                        setSelectedChannels(channels);
                    } else {
                        // 알림 설정이 없는 경우 기본값으로 초기화
                        setRepeatEnabled(false);
                        setRepeatDays([]);
                        setSelectedTime({ hour: 0, minute: 0, meridiem: '오전' });
                        setTempTime({ hour: 0, minute: 0, meridiem: '오전' });
                        setSpecificDate(null);
                        setMemo('');
                        setSelectedChannels([]);
                    }
                }
            } catch (error) {
                console.error('템플릿 데이터 로드 오류:', error);
            }
        };

        if (id && id !== 'new' && !isNaN(Number(id))) {
            loadTemplateData(Number(id));
        }
        
        return () => {
            isCancelled = true;
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            {/* 메인 헤더 */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* 템플릿명 (읽기 전용) */}
                        <h1 className="text-2xl font-bold text-gray-900">
                            {templateName}
                        </h1>
                        
                        {/* 카테고리 표시 (읽기 전용) */}
                        <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                            {currentCategory}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="line" className="px-6 py-2" onClick={() => navigate('/dashboard')}>
                            목록으로
                        </Button>
                        <Button onClick={() => navigate(`/template/${id}/edit`)} className="px-6 py-2">
                            편집하기
                        </Button>
                    </div>
                </div>
            </header>

            {/* 서브 메뉴 - 스텝 표시 (읽기 전용) */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* 뒤로가기 버튼 */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            뒤로가기
                        </button>
                        
                        <span className="text-sm font-medium text-gray-700">스텝:</span>
                        <div className="flex gap-2">
                            {Array.from({ length: currentStepCount }, (_, index) => (
                                <button
                                    key={index + 1}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        selectedStepId === `step${index + 1}`
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                    onClick={() => {
                                        setSelectedStep(`step${index + 1}`);
                                        setSelectedStepId(`step${index + 1}`);
                                    }}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 우측 액션 버튼들 */}
                    <div className="flex items-center gap-2">
                        {/* PNG 다운로드 버튼 */}
                        <button
                            onClick={handleDownloadPNG}
                            className="action-button action-button-download"
                        >
                            PNG 다운
                        </button>
                        
                        {/* 삭제 버튼 */}
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="action-button action-button-delete"
                        >
                            삭제
                        </button>
                        
                        {/* 알림설정 버튼 */}
                        <button
                            onClick={handleNotificationSettings}
                            className="action-button action-button-notification"
                        >
                            알림설정
                        </button>
                        
                        {/* 템플릿 편집 버튼 (edit 페이지의 저장 버튼 스타일) */}
                        <Button
                            onClick={() => navigate(`/template/${id}/edit`)}
                            className="px-6 py-2"
                        >
                            템플릿 편집
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-180px)]">
                {/* 편집 영역 */}
                <div className="flex-1 p-6">
                    <div className="canvas-container relative w-full h-[800px] bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        {/* 배경 이미지 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img 
                                src={backgroundImage} 
                                alt="배경" 
                                className="w-full h-full object-contain"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                        </div>

                        {/* 텍스트 아이템들 (읽기 전용) */}
                        {textItems.map((item) => (
                            <div
                                key={item.id}
                                className="absolute select-none text-item-container"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                    zIndex: 20,
                                }}
                            >
                                <div
                                    className="border-2 rounded-lg px-3 py-2 shadow-md text-item-isometric text-item-normal"
                                    style={{
                                        width: '220px',
                                        height: item.isExpanded ? '180px' : '120px',
                                        fontSize: item.fontSize,
                                        lineHeight: '1.4',
                                        wordWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        pointerEvents: 'none' // 클릭 비활성화
                                    }}
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
                                </div>
                            </div>
                        ))}

                        {/* 오브젝트 아이템들 (읽기 전용) */}
                        {objectItems.map((item) => (
                            <div
                                key={item.id}
                                className="absolute"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                    width: '60px',
                                    height: '60px',
                                    zIndex: 10,
                                    transform: `translate(-50%, -50%) perspective(800px) rotateY(-12deg) rotateX(3deg)`,
                                    transformOrigin: 'center center',
                                    pointerEvents: 'none' // 클릭 비활성화
                                }}
                            >
                                {item.type === 'object' ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={item.content} 
                                            alt={item.label || 'object'} 
                                            className="w-full h-full object-contain" 
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                const categoryMap = { 1: '업무', 2: '일상', 3: '여행' };
                                                const categoryName = categoryMap[item.cateNo as keyof typeof categoryMap] || '업무';
                                                img.src = `/1. 오브젝트/${categoryName}/100px/간식.png`;
                                            }}
                                        />
                                        {/* 아이콘 라벨 */}
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
                        ))}
                    </div>
                </div>

                {/* 우측 정보 패널 */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">템플릿 정보</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">템플릿명</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {templateName}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {currentCategory}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">스텝 수</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {currentStepCount}개
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">텍스트 박스</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {textItems.length}개
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">오브젝트</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {objectItems.length}개
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">템플릿 삭제</h3>
                        <p className="modal-text">
                            정말로 이 템플릿을 삭제하시겠습니까?<br />
                            삭제된 템플릿은 복구할 수 없습니다.
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="modal-button modal-button-cancel"
                                disabled={isDeleting}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteTemplate}
                                className="modal-button modal-button-confirm"
                                disabled={isDeleting}
                            >
                                {isDeleting ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 알림 설정 모달 */}
            {showNotificationModal && !showTimeSelect && !showChannelSelect && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50" onClick={() => setShowNotificationModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="flex w-[464px] px-[24px] pt-[16px] pb-[24px] flex-col justify-center items-center gap-4 rounded-[12px] bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex h-[44px] justify-between items-center self-stretch">
                            <div className="w-11 h-11"></div>
                            <h2 className="text-[#141414] text-center font-pretendard text-[20px] font-semibold leading-normal">알림설정</h2>
                            <div className="flex h-[44px] p-[10px_0_10px_20px] justify-end items-center">
                                <button onClick={() => setShowNotificationModal(false)} className="cursor-pointer w-6 h-6">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-8 self-stretch">
                            <div className="flex flex-col items-start gap-4 self-stretch">
                                {/* 날짜 선택 - 반복요일이 체크되지 않았을 때만 표시 */}
                                {!repeatEnabled && (
                                    <div className="flex flex-col items-start gap-2 self-stretch">
                                        <p className="flex h-[32px] flex-col justify-center self-stretch text-[#141414] font-pretendard text-[18px] font-semibold leading-none">날짜</p>
                                        <div className="flex flex-col items-start gap-2 self-stretch">
                                            <div className="flex justify-between items-start self-stretch">
                                                <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>
                                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <p className="text-[#4D4D4D] font-pretendard text-[16px] font-medium leading-none">{currentMonth.format("YYYY년 M월")}</p>
                                                <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>
                                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="flex flex-col items-start self-stretch">
                                                {/* 요일 헤더 */}
                                                <div className="flex justify-between items-start self-stretch">
                                                    {weekdays.map((day) => (
                                                        <div key={day} className="flex w-[38px] h-[38px] flex-col justify-center items-center text-[#B8B8B8] font-pretendard text-[15px] font-medium leading-none">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* 날짜 리스트 */}
                                                {Array.from({ length: Math.ceil(dateList.length / 7) }, (_, i) => dateList.slice(i * 7, i * 7 + 7)).map((week, idx) => (
                                                    <div key={idx} className="flex justify-between items-start self-stretch">
                                                        {week.map((d) => {
                                                            const isCurrentMonth = d.month() === currentMonth.month();
                                                            const selected = isSameDay(d, specificDate);

                                                            return (
                                                                <button
                                                                key={d.format("YYYY-MM-DD")} onClick={() => handleDateClick(d)} disabled={!isCurrentMonth}
                                                                className={`rounded-lg flex w-[38px] h-[38px] flex-col justify-center items-center font-pretendard text-[15px] font-medium leading-none
                                                                ${!isCurrentMonth ? "text-[#B8B8B8]" : selected ? "bg-[#5736FF] text-white" : "text-[#141414] hover:bg-[#F0F0F0]"}`}>
                                                                    {d.date()}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* 시간 설정 */}
                                <div className="flex h-[32px] justify-between items-center self-stretch">
                                    <span className="text-[#141414] font-pretendard text-[18px] font-semibold leading-none">시간</span>
                                    <div onClick={() => {
                                        setTempTime({ 
                                            ...selectedTime, 
                                            hour: selectedTime.hour === 0 ? 1 : selectedTime.hour 
                                        });
                                        setShowTimeSelect(true);
                                    }} className="cursor-pointer flex items-center gap-2">
                                        <span className={`font-pretendard text-[16px] font-medium leading-none ${selectedTime.hour === 0 && selectedTime.minute === 0 ? "text-[#949494]" : "text-[#5736FF]"}`}>
                                            {(() => {
                                                console.log("현재 selectedTime:", selectedTime);
                                                return selectedTime.hour === 0 && selectedTime.minute === 0 ? "없음" : `${selectedTime.meridiem} ${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, "0")}`;
                                            })()}
                                        </span>
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {/* 반복 요일 설정 */}
                                <div className="flex flex-col items-start gap-4 self-stretch">
                                    <div className="flex h-[32px] justify-between items-center self-stretch">
                                        <span className="text-[#141414] font-pretendard text-[18px] font-semibold leading-normal">반복요일</span>
                                        <button onClick={() => setRepeatEnabled(!repeatEnabled)}>
                                            <div className={`w-14 h-8 rounded-full ${repeatEnabled ? 'bg-[#5736FF]' : 'bg-gray-300'} relative transition-colors`}>
                                                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${repeatEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                            </div>
                                        </button>
                                    </div>
                                    {repeatEnabled && (
                                        <div className="flex flex-col items-start gap-4 self-stretch">
                                            <div className="flex pb-6 justify-center items-center gap-3 self-stretch">
                                                <button onClick={selectAllDays} className={`flex w-[56px] h-[38px] flex-col justify-center items-center rounded-lg font-pretendard text-[15px] font-medium leading-none ${repeatDays.length === 7 ? "bg-[#5736FF] text-white" : "bg-[#F0F0F0] text-[#141414]"}`}>매일</button>
                                                <div className="w-px h-[38px] bg-[#E0E0E0]"></div>
                                                {days.map((day) => (
                                                    <button key={day} onClick={() => toggleRepeatDay(day)} className={`flex w-[38px] h-[38px] flex-col justify-center items-center rounded-lg font-pretendard text-[15px] font-medium leading-none ${repeatDays.includes(day) ? "bg-[#5736FF] text-white" : "bg-[#F0F0F0] text-[#141414]"}`}>{day}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* 알림 채널 */}
                                <div className="flex h-[32px] justify-between items-center self-stretch">
                                    <span className="text-[#141414] font-pretendard text-[18px] font-semibold leading-none">알림채널</span>
                                    <div onClick={() => setShowChannelSelect(true)} className="cursor-pointer flex items-center gap-2">
                                        <span className={`font-pretendard text-[16px] font-medium leading-none ${selectedChannels.length === 0 ? "text-[#949494]" : "text-[#5736FF]"}`}>
                                            {selectedChannels.length === 0 ? "없음" : selectedChannels.join(", ")}
                                        </span>
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {/* 알림 메시지 */}
                                <div className="flex flex-col items-start gap-2 self-stretch">
                                    <span className="flex h-[32px] items-center self-stretch text-[#141414] font-pretendard text-[18px] font-semibold leading-none">알림 메시지</span>
                                    <textarea className="resize-none flex h-[80px] p-[16px] items-start gap-2 self-stretch rounded-lg border border-[#CCC]
                                    placeholder-[#949494] placeholder-pretendard placeholder-text-[16px] placeholder-font-medium placeholder-leading-none"
                                    placeholder="알림 시 표시될 내용을 작성하세요 (선택)" value={memo} maxLength={50} onChange={(e) => setMemo(e.target.value)}></textarea>
                                    <p className="flex justify-end items-center self-stretch
                                    text-[#949494] text-right font-pretendard text-[16px] font-medium leading-none">{memo.length}/50</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-8 self-stretch">
                                <div className="flex items-center gap-4 self-stretch">
                                    <Button onClick={() => setShowNotificationModal(false)} variant="line" className="flex-1 basis-0 h-[50px]">취소</Button>
                                    <Button onClick={handleSaveNotification} className="flex-1 basis-0 h-[50px]">저장</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 시간 선택 모달 */}
            {showTimeSelect && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50" onClick={() => setShowTimeSelect(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="flex w-[464px] px-[24px] pt-[16px] pb-[24px] flex-col justify-center items-center gap-4 rounded-[12px] bg-white">
                        <div className="flex h-[44px] justify-between items-center self-stretch">
                            <div className="w-11 h-11"></div>
                            <h2 className="text-[#141414] text-center font-pretendard text-[20px] font-semibold leading-normal">시간 선택</h2>
                            <div className="flex h-[44px] p-[10px_0_10px_20px] justify-end items-center">
                                <button onClick={() => setShowTimeSelect(false)} className="cursor-pointer w-6 h-6">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 self-stretch">
                            <div className="flex items-center gap-4">
                                <select 
                                    value={tempTime.meridiem} 
                                    onChange={(e) => setTempTime({...tempTime, meridiem: e.target.value as '오전' | '오후'})}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="오전">오전</option>
                                    <option value="오후">오후</option>
                                </select>
                                <select 
                                    value={tempTime.hour} 
                                    onChange={(e) => setTempTime({...tempTime, hour: Number(e.target.value)})}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                                        <option key={hour} value={hour}>{hour}</option>
                                    ))}
                                </select>
                                <span>:</span>
                                <select 
                                    value={tempTime.minute} 
                                    onChange={(e) => setTempTime({...tempTime, minute: Number(e.target.value)})}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {Array.from({length: 60}, (_, i) => i).map(minute => (
                                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-4 self-stretch">
                                <Button onClick={() => setShowTimeSelect(false)} variant="line" className="flex-1 basis-0 h-[50px]">취소</Button>
                                <Button onClick={() => {
                                    console.log("확인 버튼 클릭, tempTime:", tempTime);
                                    setSelectedTime({ ...tempTime });
                                    setShowTimeSelect(false);
                                }} className="flex-1 basis-0 h-[50px]">확인</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 채널 선택 모달 */}
            {showChannelSelect && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50" onClick={() => setShowChannelSelect(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="flex w-[464px] px-[24px] pt-[16px] pb-[24px] flex-col justify-center items-center gap-4 rounded-[12px] bg-white">
                        <div className="flex h-[44px] justify-between items-center self-stretch">
                            <div className="w-11 h-11"></div>
                            <h2 className="text-[#141414] text-center font-pretendard text-[20px] font-semibold leading-normal">알림 채널 선택</h2>
                            <div className="flex h-[44px] p-[10px_0_10px_20px] justify-end items-center">
                                <button onClick={() => setShowChannelSelect(false)} className="cursor-pointer w-6 h-6">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-4 self-stretch">
                            {['슬랙', '구글 캘린더'].map(channel => (
                                <div key={channel} className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedChannels.includes(channel)}
                                        onChange={() => toggleChannel(channel)}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-[#141414] font-pretendard text-[16px] font-medium">{channel}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 self-stretch mt-4">
                                <Button onClick={() => setShowChannelSelect(false)} variant="line" className="flex-1 basis-0 h-[50px]">취소</Button>
                                <Button onClick={() => setShowChannelSelect(false)} className="flex-1 basis-0 h-[50px]">확인</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateDetailPage;