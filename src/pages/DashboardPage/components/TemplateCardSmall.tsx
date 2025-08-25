import { useState, useRef, useEffect } from "react";
import type { TemplateListItem } from "../../../stores/templateListStore";
import DropdownMenu from "./DropdownMenu";
import { BookmarkOffIcon, BookmarkOnIcon, MoreIcon } from "../../../assets";

type TemplateCardSmallProps = {
    template: TemplateListItem;
    onRename: (templateNo: number, newName: string) => void;
    onEdit: (templateNo: number) => void;
    onDuplicate: (templateNo: number) => void;
    onDelete: (templateNo: number) => void;
    onBookmarkToggle?: () => void;
};

const TemplateCardSmall: React.FC<TemplateCardSmallProps> = ({
    template,
    onRename,
    onEdit,
    onDuplicate,
    onDelete,
    onBookmarkToggle,
}) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [bookmarked, setBookmarked] = useState(template.isBookmarked ?? false);
    const [isBookmarkLoading, setIsBookmarkLoading] = useState(false); // 로딩 상태 추가
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 인라인 편집
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(template.templateNm);

    const toggleBookmark = async () => {
        if (isBookmarkLoading) return;

        setIsBookmarkLoading(true);
        const newBookmarkState = !bookmarked;
        setBookmarked(newBookmarkState); // 낙관적 UI 업데이트
        
        const requestData = {
            templateNo: template.templateNo,
            isFavorite: newBookmarkState ? 'Y' : 'N'
        };
        console.log("API 요청 데이터:", requestData);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://pack-up-front-end-nu.vercel.app/api/temp/templateStatusUpdate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('즐겨찾기 상태 변경 실패');
            }

            console.log(`템플릿 ${template.templateNo} 즐겨찾기 상태가 ${newBookmarkState ? '추가' : '제거'}되었습니다.`);
            
            // 상위 컴포넌트에 변경 사항 알림 (템플릿 목록 새로고침용)
            if (onBookmarkToggle) {
                onBookmarkToggle();
            }
        } catch (error) {
            // 실패 시 원래대로 복구
            setBookmarked((prev) => !prev);
            console.error("즐겨찾기 상태 변경 실패:", error);
        } finally {
            setIsBookmarkLoading(false);
        }
    };

    // 템플릿 이름 저장
    const handleSaveName = async () => {
        const trimmedName = editedName.trim(); // 앞뒤 공백 제거

        if (!trimmedName) {
            // 이름이 공백이면 원래 이름으로 복구하고 편집 종료
            setEditedName(template.templateNm);
            setIsEditing(false);
            return;
        }

        if (trimmedName === template.templateNm) {
            // 변경사항이 없으면 그냥 편집 종료
            setIsEditing(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const requestData = {
                templateNo: template.templateNo,
                templateNm: trimmedName
            };

            console.log("템플릿명 변경 API 요청 데이터:", requestData);

            const response = await fetch('https://pack-up-front-end-nu.vercel.app/api/temp/templateStatusUpdate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('템플릿명 변경 실패');
            }

            console.log(`템플릿 ${template.templateNo} 이름이 "${trimmedName}"으로 변경되었습니다.`);
            
            onRename(template.templateNo, trimmedName); // 상위 컴포넌트에 알림
            
            // 템플릿 목록 새로고침을 위해 onBookmarkToggle 재사용
            if (onBookmarkToggle) {
                onBookmarkToggle();
            }
        } catch (error) {
            console.error('템플릿명 변경 실패:', error);
            // 실패 시 원래 이름으로 복구
            setEditedName(template.templateNm);
        }
        
        setIsEditing(false);
    };

    // 템플릿 삭제
    const handleDelete = async () => {
        const confirmDelete = window.confirm(`"${template.templateNm}" 템플릿을 삭제하시겠습니까?\n\n삭제된 템플릿은 복구할 수 없습니다.`);
        
        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const requestData = {
                templateNo: template.templateNo
            };

            console.log("템플릿 삭제 API 요청 데이터:", requestData);

            const response = await fetch('https://pack-up-front-end-nu.vercel.app/api/temp/templateDelete', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('템플릿 삭제 실패');
            }

            console.log(`템플릿 ${template.templateNo} "${template.templateNm}"이 삭제되었습니다.`);
            
            onDelete(template.templateNo); // 상위 컴포넌트에 알림
            
            // 템플릿 목록 새로고침을 위해 onBookmarkToggle 재사용
            if (onBookmarkToggle) {
                onBookmarkToggle();
            }
        } catch (error) {
            console.error('템플릿 삭제 실패:', error);
            alert('템플릿 삭제에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSaveName();
        if (e.key === "Escape") {
            setEditedName(template.templateNm); // 원래 이름 복구
            setIsEditing(false);
        }
    };

    // DropdownMenu 바깥을 클릭하면 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className="relative flex p-[16px_16px_32px_16px] flex-col items-start gap-[8px] rounded-[16px] border-[2px] border-[#F0F0F0] bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.02)]">
            {/* 썸네일 */}
            <div className="flex w-[240px] h-[240px] p-[8px_8px_194px_148px] justify-end items-center rounded-[16px] bg-cover bg-center"
            style={{ backgroundImage: `url(${template.thumbnail})` }}>
                <div ref={dropdownRef} className="absolute top-6 right-6 flex items-center gap-2">
                    {/* 북마크 버튼 */}
                    <button onClick={toggleBookmark} disabled={isBookmarkLoading} className="flex w-[38px] h-[38px] p-[7px] justify-center items-center rounded-[12px] bg-[rgba(255,255,255,0.24)]">
                        {bookmarked ? <BookmarkOnIcon className="w-[24px] h-[24px] flex-shrink-0" /> : <BookmarkOffIcon className="w-[24px] h-[24px] flex-shrink-0" />}
                    </button>
                    {/* 옵션 더보기 버튼 */}
                    <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex w-[38px] h-[38px] p-[7px] justify-center items-center rounded-[12px] bg-[rgba(255,255,255,0.24)]">
                        <MoreIcon className="w-[24px] h-[24px] flex-shrink-0 aspect-[1/1]" />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-[38px] right-0 z-50">
                            <DropdownMenu
                                onRename={() => { setIsEditing(true); setDropdownOpen(false); }}
                                onEdit={() => onEdit(template.templateNo)}
                                onDuplicate={() => onDuplicate(template.templateNo)}
                                onDelete={() => { setDropdownOpen(false); handleDelete(); }}
                            />
                        </div>
                    )}
                </div>
            </div>
            {/* 템플릿 이름 + 카테고리 */}
            <div className="flex flex-col items-start gap-[8px] self-stretch">
                {/* 템플릿 이름 */}
                {isEditing ? (
                    <input className="flex w-[240px] h-[38px] px-4 items-center gap-1 flex-shrink-0 rounded-lg border border-[#8D76FF] bg-white text-[rgba(0,0,0,0.9)] font-pretendard text-[18px] font-semibold leading-normal caret-[#775CFF] outline-none"
                    value={editedName} autoFocus onChange={(e) => setEditedName(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleSaveName}></input>
                ) : (
                    <div className="flex w-[240px] h-[38px] items-center gap-[8px] bg-white">
                        <h3 className="text-[rgba(0,0,0,0.9)] font-pretendard text-[18px] font-semibold leading-normal">{template.templateNm}</h3>
                    </div>
                )}
                {/* 카테고리 */}
                {template.categoryNm && (
                    <div className="flex items-center">
                        <div className="flex px-[8px] py-[4px] justify-center items-center gap-[8px] rounded-[2px] bg-[#F6F4FF]">
                            <span className="text-[#775CFF] font-pretendard text-[14px] font-semibold leading-[20px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">{template.categoryNm}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateCardSmall;
