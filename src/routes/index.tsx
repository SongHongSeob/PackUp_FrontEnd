import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import SnsCallback from '../pages/AuthPage/components/SnsCallback';
import TemplateViewPage from '../pages/TemplateViewPage';
import TemplateEditPage from '../pages/TemplateEditPage';
import TemplateDetailPage from '../pages/TemplateDetailPage';
import AgreementDetail from '../pages/Agreements';

export const routes = [
    { path: '/', element: <LandingPage /> },
    { path: 'auth', element: <AuthPage /> },
    { path: 'auth/sns-callback', element: <SnsCallback /> }, // SNS 콜백 라우트 추가
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'template/:id', element: <TemplateViewPage /> },
    { path: 'template/:id/detail', element: <TemplateDetailPage /> }, // 상세보기 페이지
    { path: 'template/:id/edit', element: <TemplateEditPage /> },
    { path: 'template/new/edit', element: <TemplateEditPage /> }, // 새 템플릿 생성 라우트
    { path: 'template/preset-:presetId/edit', element: <TemplateEditPage /> }, // 프리셋 템플릿 생성 라우트
    { path: 'agreements/:id', element: <AgreementDetail /> },
];
