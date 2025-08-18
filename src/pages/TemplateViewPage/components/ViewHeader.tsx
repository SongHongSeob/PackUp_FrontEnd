import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTemplateDetailStore } from "../../../stores/templateDetailStore";
import AlertSettingModal from "./AlertSettingModal";
import { ViewBackIcon, ViewDeleteIcon, ViewExportIcon, ViewAlertOffIcon, ViewAlertOnIcon } from "../../../assets";
import Button from "../../../components/Button";

type ViewHeaderProps = {
    onClickDownload: () => void;
};

const ViewHeader = ({ onClickDownload }: ViewHeaderProps) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // URL에서 id 가져오기
    const { templateData } = useTemplateDetailStore();

    const handleEditClick = () => {
        if (!id) return; // id가 없으면 동작 안 함
        navigate(`/templates/${id}/edit`);
    };

    const deleteTemplate = async (templateNo: number) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://3.35.147.68:8080/temp/templateDelete", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ templateNo }),
            });
    
            if (!response.ok) throw new Error("템플릿 삭제 실패");

            navigate('/dashboard');
        } catch (err) {
            console.error("템플릿 삭제 실패: ", err);
            alert("템플릿 삭제에 실패했습니다.");
        }
    };

    const handleDeleteClick = () => {
        if (!id) return; // id가 없으면 동작 안 함
        deleteTemplate(Number(id));
    };

    const [isAlertActive, setIsAlertActive] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);

    useEffect(() => {
        if (!templateData) return;

        const { alarmDt, repeatType, alarmRepeatDay, alarmTime } = templateData;
        const hasAlert = !!(alarmDt || repeatType || alarmRepeatDay || alarmTime);
        setIsAlertActive(hasAlert);
    }, [templateData]);

    const handleAlertClick = () => {
        if (!isAlertActive) {
            // 알림이 꺼져있으면 모달 오픈
            setShowAlertModal(true);
        } else {
            // 알림이 켜져있으면 해제
            const confirmDelete = confirm("알림을 해제하시겠습니까?");
            if (confirmDelete) {
                setIsAlertActive(false);
            } else {
                // 취소 시 아무 동작 없음
            }
        }
    };

    const handleSaveAlert = () => {
        setIsAlertActive(true); // 저장 시 알림 활성
        setShowAlertModal(false);
    };

    return (
        <>
            <header className="fixed top-0 left-0 z-20 w-full flex px-[24px] py-[16px] justify-between items-center self-stretch rounded-[2px] border-b-2 border-[#F0F0F0] bg-white">
                <div className="flex items-center">
                    <button onClick={() => window.history.back()} className="cursor-pointer w-11 h-11">
                        <ViewBackIcon className="w-11 h-11" />
                    </button>
                    <h2 className="flex w-[240px] h-[44px] px-[16px] items-center gap-2 text-black/90 font-inter text-[20px] font-semibold leading-none">{templateData ? templateData.templateNm : "제목 없음"}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleDeleteClick} variant="line" className="!p-0 w-[120px] h-[44px]">
                        <ViewDeleteIcon className="w-[18px] h-[18px]" />
                        <span>삭제</span>
                    </Button>
                    <Button onClick={onClickDownload} variant="line" className="!p-0 w-[120px] h-[44px]">
                        <ViewExportIcon className="w-[18px] h-[18px]" />
                        <span>PNG 다운</span>
                    </Button>
                    <Button onClick={handleAlertClick} variant="line" className="!p-0 w-[120px] h-[44px]">
                        {isAlertActive ? (
                            <ViewAlertOnIcon className="w-[18px] h-[18px]" />
                        ) : (
                            <ViewAlertOffIcon className="w-[18px] h-[18px]" />
                        )}
                        <span>알림설정</span>
                    </Button>
                    <Button onClick={handleEditClick} className="w-[200px] h-[44px]">템플릿 편집</Button>
                </div>
            </header>
            {showAlertModal && (
                <AlertSettingModal
                    onClose={() => setShowAlertModal(false)}
                    onSave={handleSaveAlert}
                />
            )}
        </>
    );
};

export default ViewHeader;
