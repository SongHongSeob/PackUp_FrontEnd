import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../assets';
import NotificationDropdown from './components/NotificationDropdown';
import ProfileDropdown from './components/ProfileDropdown';
import type { Notification } from './components/NotificationDropdown';

interface HeaderProps {
    pageType?: 'auth' | 'landing' | 'default';
}

const Header = ({ pageType = 'default' }: HeaderProps) => {
    const navigate = useNavigate();
    const isLandingPage = pageType === 'landing';
    const isDefaultPage = pageType === 'default';

    // 모든 알림 읽음 처리
    const handleMarkAllRead = async  () => {
        if (!userId) return;

        try {
            const res = await fetch('https://pack-up-front-end-nu.vercel.app/api/notifications/readAll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error('모두 읽음 처리 실패');

            setUnreadCount(0);

            // 1) 목록의 모든 항목을 read=true로
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true})));

        } catch (err) {
            console.error('모두 읽음 처리 에러:', err);
        }
    };

    // onClickNotification: (id: number) => void;
    const handleClickNotification = (id: number) => {
        // TODO: 알림 클릭 시 상세 페이지 이동 또는 상태 업데이트 로직을 구현하세요
        console.log(`알림 ${id}번 클릭됨`);
        // 예시: navigate(`/notification/${id}`);
    };

    const [username, setUsername] = useState<string>("심심한알파카59223");
    const [userId, setUserId] = useState<string>("");
    // 사용자 정보 불러오기(JWT 토큰으로 인증)
    useEffect(() => {
        if (!isDefaultPage) return;

        const abortController = new AbortController();
        
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');

                const response = await fetch("https://pack-up-front-end-nu.vercel.app/user/getCurrentUser", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error('사용자 정보 불러오기 실패');
                }

                const userInfo = await response.json();

                console.log("userInfo : "+userInfo)
    
                // 다양한 키 중 첫 번째 존재하는 것 사용
                setUsername(userInfo.username || userInfo.userName || userInfo.userId || userInfo.email || "심심한알파카59223");
                setUserId(userInfo.userId);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error("사용자 정보 불러오기 실패: ", err);
                setUsername("심심한알파카59223");
                setUserId("");
            }
        };

        fetchUserInfo();

        return () => {
            abortController.abort();
        };
    }, [isDefaultPage]);

    // 자료형 선언
    interface NotificationPayload {
        templateNo: number;
        templateNm: string;
        message: string;
        sentAt: string;
        readYn: boolean;
        thumbnail: string;
    }

    // 실시간 알림 SSE 구독요청
    useEffect(() => {
        if (!userId) return;

        const url = `https://pack-up-front-end-nu.vercel.app/api/notifications/subscribe?userId=${encodeURIComponent(userId)}`;

        const es = new EventSource(url);

        // 연결 이벤트 (브라우저 레벨)
        es.onopen = () => console.log('[SSE] onopen');
        es.onerror = (e) => console.warn('[SSE] onerror', e);

        // 서버에서 보낸 커스텀 이벤트들
        es.addEventListener('connect', (e: MessageEvent) => {
            console.log('[SSE] event:connect =>', e.data);
        });

        // 실제 알림
        const handlePayload = (e: MessageEvent) => {
            let it: NotificationPayload;
            try { it = JSON.parse(e.data); } catch { it = e.data; }

            const n: Notification = {
                id: it.templateNo,
                title: it.templateNm,
                memo: it.message,
                timestamp: it.sentAt,
                timeAgo: getTimeAgo(it.sentAt),
                dateGroup: getDateGroup(it.sentAt),
                read: Boolean(it.readYn),
                thumbnail: it.thumbnail ?? undefined,
            };

            setNotifications(prev => {
                const exists = prev.some(p => p.id === n.id);
                const next = exists ? prev.map(p => (p.id === n.id ? n : p)) : [n, ...prev];
                next.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                return next;
            });
            if (!n.read) setUnreadCount(c => c + 1);
        };

        es.addEventListener('alarm', handlePayload);

        return () => {
            console.log('[SSE] closed');
            es.close();
        };
    }, [userId]);

    // 안읽은 알림 갯수 조회
    const [unreadCount, setUnreadCount] = useState<number>(0);
    useEffect(() => {
        if (!userId) return; // userId 없으면 실행 안 함

        const controller = new AbortController();

        const fetchUnreadCount  = async () => {
            try {
                const response = await fetch(
                    `https://pack-up-front-end-nu.vercel.app/api/notifications/unread_count?userId=${encodeURIComponent(userId)}`,
                    {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error('안 읽은 알림 개수 불러오기 실패');
                }

                const data = await response.json(); // { count: number }
                setUnreadCount(Number(data.count ?? 0));
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('안 읽은 알림 개수 조회 실패:', err);
                setUnreadCount(0);
            }
        };

        fetchUnreadCount ();
    }, [userId]);

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const getTimeAgo = (iso: string) => {
        const t = new Date(iso).getTime(), d = Date.now() - t;
        const s = Math.floor(d/1000); if (s < 60) return '방금 전';
        const m = Math.floor(s/60); if (m < 60) return `${m}분 전`;
        const h = Math.floor(m/60); if (h < 24) return `${h}시간 전`;
        const day = Math.floor(h/24); return `${day}일 전`;
    };

    const getDateGroup = (iso: string): Notification['dateGroup'] => {
        const d = new Date(iso), now = new Date();
        const start = (x:Date)=> new Date(x.getFullYear(), x.getMonth(), x.getDate());
        const one = 86400000;
        const today = +start(now), target = +start(d);
        if (target === today) return '오늘';
        if (target === today - one) return '어제';
        const dayIdx = (n:Date)=>(n.getDay()+6)%7; // 월=0
        const sow = (()=>{ const s=start(now); s.setDate(s.getDate()-dayIdx(now)); return +s; })();
        if (target >= sow) return '이번 주';
        if (target >= sow - 7*one) return '지난 주';
        return '지난 주';
    };

    // 알림 목록 조회
    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `https://pack-up-front-end-nu.vercel.app/api/notifications/list?userId=${encodeURIComponent(userId)}`,
                    { method: 'GET', credentials: 'include', signal: controller.signal }
                );
                if (!res.ok) throw new Error('알림 목록 불러오기 실패');

                // 서버 응답 예시 가정: [{ id, title, memo, timestamp, read, thumbnail }]
                const raw: NotificationPayload[] = await res.json();

                const mapped: Notification[] = raw.map((it) => ({
                    id: Number(it.templateNo),
                    title: String(it.templateNm ?? ''),
                    memo: it.message ?? '',
                    timestamp: it.sentAt, // 정렬용
                    timeAgo: getTimeAgo(it.sentAt),
                    dateGroup: getDateGroup(it.sentAt),
                    read: Boolean(it.readYn),
                    thumbnail: it.thumbnail ?? undefined,
                }));

                // 최신순 정렬
                mapped.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                setNotifications(mapped);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('알림 목록 조회 실패:', err);
                setNotifications([]);
            }
        })();

        return () => controller.abort();
    }, [userId]);

    // onLogout: () => void;
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch('https://pack-up-front-end-nu.vercel.app/api/lgn/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) console.warn('서버 로그아웃 실패');
        } catch (error) {
            console.error('로그아웃 에러:', error);
        } finally {
            localStorage.removeItem('token');
            navigate('/');
        }
    };
    // onMyPage: () => void;
    const handleMyPage = () => {
        // TODO: 마이페이지로 이동하는 기능을 구현하세요
        console.log("마이페이지로 이동합니다.");
        // 예시: navigate('/mypage');
    };

    return (
        <header className='fixed top-0 left-0 z-20 w-full flex h-[76px] px-4 py-2 justify-between items-center flex-shrink-0 border-b border-[#F0F0F0] bg-white tablet:h-[84px] tablet:px-[60px] web:px-[120px]'>
            <div className='w-full max-w-[1200px] mx-auto flex justify-between items-center flex-shrink-0'>
                {/* 로고 */}
                <Link to={userId ? '/dashboard' : '/'} className='flex items-center gap-2'>
                    <LogoIcon className='w-6 h-6 aspect-square' />
                    <span className='text-black font-montserrat text-[18px] font-semibold uppercase'>Pack up</span>
                </Link>

                {/* landing */}
                {isLandingPage && (
                    <div className='flex items-center gap-2'>
                        <nav className='flex items-center'>
                            <Link to='/auth?mode=login' className='flex h-11 px-6 justify-center items-center gap-2 text-[rgba(0,0,0,0.72)] font-pretendard text-base font-medium leading-[140%] hover:text-[#411BFF]'>로그인</Link>
                            <Link to='/auth?mode=signup' className='flex h-11 px-6 justify-center items-center gap-2 text-[rgba(0,0,0,0.72)] font-pretendard text-base font-medium leading-[140%] hover:text-[#411BFF]'>회원가입</Link>
                        </nav>
                    </div>
                )}

                {/* default */}
                {isDefaultPage && (
                    <div className='flex items-center gap-2'>
                        <NotificationDropdown notifications={notifications} onMarkAllRead={handleMarkAllRead} onClickNotification={handleClickNotification} unreadCount={unreadCount} />
                        <ProfileDropdown username={username} onLogout={handleLogout} onMyPage={handleMyPage} />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;