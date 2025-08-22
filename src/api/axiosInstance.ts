import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://3.35.147.68:8080';

const instance = axios.create({
    baseURL,
    withCredentials: true, // JWT 쿠키 전송을 위해 필수
    timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 요청 로깅
instance.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 에러 처리
instance.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error);
        
        // 401 에러 시 로그인 페이지로 리다이렉트
        if (error.response?.status === 401) {
            console.log('인증이 만료되었습니다. 로그인 페이지로 이동합니다.');
            // window.location.href = '/auth?mode=login';
        }
        
        return Promise.reject(error);
    }
);

export default instance;
