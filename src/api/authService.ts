import axiosInstance from './axiosInstance';

// 타입 정의 (SNS 관련만)
export interface SnsUserInfo {
  userId: string;
  userNm: string;
  email?: string;
  needsAdditionalInfo: boolean;
  loginType?: string;
}

export interface AdditionalInfoRequest {
  userId: string;
  phoneNum: string;
  password: string;
}

export interface PhoneValidationRequest {
  phoneNum: string;
  userId: string;
}

export interface ApiResponse<T=string> {
  success: boolean;
  message: string;
  data?: T;
  available?: boolean;
}

// Auth Service 클래스 (SNS 관련 기능만)
class AuthService {
  /**
   * SNS 추가 정보 입력
   */
  async submitAdditionalInfo(data: AdditionalInfoRequest): Promise<ApiResponse> {
    const response = await axiosInstance.post<ApiResponse>('/api/sns/additional-info', data);
    return response.data;
  }

  /**
   * 핸드폰번호 실시간 검증
   */
  async validatePhoneNumber(data: PhoneValidationRequest): Promise<ApiResponse> {
    const response = await axiosInstance.post<ApiResponse>('/api/sns/validate-phone', data);
    return response.data;
  }

  /**
   * JWT 토큰으로 사용자 정보 조회
   */
  async getUserInfo(): Promise<ApiResponse<SnsUserInfo>> {
    const response = await axiosInstance.get<ApiResponse<SnsUserInfo>>('/api/sns/user-info');
    return response.data;
  }

  /**
   * 추가 정보 입력 필요 여부 확인
   */
  async checkAdditionalInfoNeeded(userId: string): Promise<ApiResponse> {
    const response = await axiosInstance.get<ApiResponse>(`/api/sns/check-additional-info/${userId}`);
    return response.data;
  }

  /**
   * SNS 로그인 시작 (OAuth2 리다이렉트)
   */
  startSnsLogin(provider: 'google' | 'kakao' | 'naver'): void {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://3.35.147.68:8080';
    window.location.href = `${baseUrl}/oauth2/authorization/${provider}`;
  }

  /**
   * 자동 로그인 체크 (SNS 사용자용)
   */
  async checkAutoLogin(): Promise<boolean> {
    try {
      const response = await this.getUserInfo();
      return response.success;
    } catch (error) {
      console.error('자동 로그인 체크 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 export
export const authService = new AuthService();
export default authService;
