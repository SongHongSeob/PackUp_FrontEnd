import { useState } from "react";
import { useAlertSettingStore } from "../../../../stores/alertSettingStore";
import Button from "../../../../components/Button";

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = [0, 10, 20, 30, 40, 50];
const meridiemTabs: ("오전" | "오후")[] = ["오전", "오후"];

const baseButtonClass = "flex w-[38px] h-[38px] flex-col justify-center items-center rounded-lg font-pretendard text-[15px] font-medium leading-none";
const getButtonClass = (selected: boolean) => `${baseButtonClass} ${selected ? "bg-[#5736FF] text-white" : "bg-[#F0F0F0] text-[#141414]"}`;

const TimeSelectModal = () => {
    const {
        selectedTime,
        setSelectedTime,
        setShowTimeSelect
    } = useAlertSettingStore();

    const [localMeridiem, setLocalMeridiem] = useState<"오전" | "오후">(selectedTime.meridiem);
    const [localHour, setLocalHour] = useState<number>(selectedTime.hour);
    const [localMinute, setLocalMinute] = useState<number>(selectedTime.minute);

    const updateTime = (meridiem: "오전" | "오후", hour: number, minute: number) => {
        setSelectedTime({
            meridiem,
            hour,
            minute
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMeridiemChange = (meridiem: "오전" | "오후") => {
        setLocalMeridiem(meridiem);
        updateTime(meridiem, localHour, localMinute);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleHourChange = (hour: number) => {
        setLocalHour(hour);
        updateTime(localMeridiem, hour, localMinute);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMinuteChange = (minute: number) => {
        setLocalMinute(minute);
        updateTime(localMeridiem, localHour, minute);
    };

    const handleComplete = () => {
        setShowTimeSelect(false);
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50" onClick={() => setShowTimeSelect(false)}>
            <div onClick={(e) => e.stopPropagation()} className="flex w-[464px] p-[16px_24px_24px_24px] flex-col justify-center items-center gap-4 rounded-[12px] bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.02)]">
                <div className="flex h-[44px] justify-center items-center self-stretch">
                    <h3 className="text-[#141414] text-center font-pretendard text-[20px] font-semibold leading-none">시간선택</h3>
                </div>
                <div className="flex flex-col items-start gap-8 self-stretch">
                    <div className="flex flex-col items-start gap-4 self-stretch">
                        <div className="flex items-center self-stretch">
                            {meridiemTabs.map((tab) => (
                                <button key={tab} onClick={() => setLocalMeridiem(tab)}
                                className={`flex h-[50px] px-0 py-4 justify-center items-center gap-2 flex-[1_0_0] text-center font-pretendard text-[18px] font-semibold leading-normal
                                ${tab === localMeridiem ? "border-b-[3px] border-[#775CFF] text-[#141414]" : "text-[#949494]"}`}>{tab}</button>
                            ))}
                        </div>
                        <p className="self-stretch text-[#141414] font-pretendard text-[18px] font-semibold leading-normal">시</p>
                        <div className="flex h-[112px] pb-6 flex-col justify-between items-start self-stretch">
                            <div className="flex px-4 items-center gap-3 self-stretch">
                                {hours.slice(0, 8).map((h) => (
                                    <button key={h} onClick={() => setLocalHour(h)} className={getButtonClass(h === localHour)}>{h}</button>
                                ))}
                            </div>
                            <div className="flex px-4 items-center gap-3">
                                {hours.slice(8).map((h) => (
                                    <button key={h} onClick={() => setLocalHour(h)} className={getButtonClass(h === localHour)}>{h}</button>
                                ))}
                            </div>
                        </div>
                        <p className="self-stretch text-[#141414] font-pretendard text-[18px] font-semibold leading-normal">분</p>
                        <div className="flex flex-col items-start pb-6 gap-3 self-stretch">
                            <div className="flex px-4 items-center gap-3 self-stretch">
                                {minutes.map((m) => (
                                    <button key={m} onClick={() => setLocalMinute(m)} className={getButtonClass(m === localMinute)}>{m.toString().padStart(2, "0")}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-8 self-stretch">
                        <Button onClick={handleComplete} variant="line" className="!max-w-none !w-[416px] !h-[50px]">완료</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeSelectModal;
