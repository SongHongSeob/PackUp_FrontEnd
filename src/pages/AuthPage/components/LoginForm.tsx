import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import FormInput from '../../../components/FormInput';
import { GoogleIcon, KakaoIcon, NaverIcon } from '../../../assets';

type LoginFormData = {
    email: string;
    password: string;
};

interface LoginRequest {
    userId: string;
    userPw: string;
}

interface LoginResponse {
    token: string;
    userId: string;
    username: string;
}

const LoginForm = () => {
    const navigate = useNavigate();
    const { control, handleSubmit } = useForm<LoginFormData>({
        defaultValues: { email: '', password: '' },
        mode: 'onChange', // 실시간 validation
    });

    // 일반 로그인 처리 (원본 코드 유지)
    const onSubmit = async (data: LoginFormData) => {
        try {
            const loginData: LoginRequest = {
                userId: data.email,
                userPw: data.password
            };
    
            const response = await fetch('https://pack-up-front-end-nu.vercel.app/api/lgn/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });
    
            if (!response.ok) {
                throw new Error('로그인 실패');
            }

            const result: LoginResponse = await response.json();
            localStorage.setItem('token', result.token);

            navigate('/dashboard');
        } catch (error) {
            console.error('로그인 실패: ', error);
            alert('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
    };

    // SNS 로그인 처리 (새로 추가된 부분)
    const handleSnsLogin = (provider: 'google' | 'kakao' | 'naver') => {
        try {
            // 사용자에게 SNS 선택 확인
            const confirmed = confirm(
                `${provider.toUpperCase()} 계정으로 로그인하시겠습니까?\n\n` +
                `⚠️ 주의사항:\n` +
                `• 한 번 선택한 SNS는 변경할 수 없습니다\n` +
                `• 다른 SNS와 중복 가입이 불가능합니다\n` +
                `• 이미 다른 SNS로 가입된 경우 로그인이 차단됩니다`
            );
            
            if (confirmed) {
                console.log(`${provider.toUpperCase()} 로그인 시작`);
                window.location.href = `https://pack-up-front-end-nu.vercel.app/api/oauth2/authorization/${provider}`;
            }
        } catch (error) {
            console.error(`${provider} 로그인 오류:`, error);
            alert('SNS 로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-center gap-8'>
            {/* 문구 */}
            <div className='flex flex-col items-center gap-4 self-stretch'>
                <h2 className='h-[26px] self-stretch text-[#141414] text-center font-pretendard text-[26px] font-bold leading-none'>어서오세요!</h2>
                <p className='h-[26px] self-stretch text-[#707070] text-center font-pretendard text-[16px] font-medium leading-[140%]'>로그인하고 나만의 할일 템플릿을 관리하세요.</p>
            </div>
            {/* form */}
            <div className='flex flex-col items-end gap-8'>
                {/* input */}
                <div className='flex flex-col items-end gap-3'>
                    <div className='flex flex-col items-start gap-[25px]'>
                        {/* 이메일 */}
                        <Controller
                            name='email'
                            control={control}
                            rules={{
                                required: '이메일을 입력해주세요',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: '올바른 이메일 형식을 입력해주세요'
                                }
                            }}
                            render={({ field, fieldState }) => (
                                <FormInput 
                                    label='이메일' 
                                    variant='email' 
                                    placeholder='이메일을 입력하세요' 
                                    value={field.value} 
                                    onChange={field.onChange}
                                    state={fieldState.error ? 'error' : 'default'} // 에러일 때 border 색 변경
                                    errorMessage={fieldState.error?.message} // 에러 메시지 표시
                                />
                            )} 
                        />
                        {/* 비밀번호 */}
                        <Controller name='password' control={control} render={({ field }) => (
                            <FormInput label='비밀번호' variant='password' placeholder='비밀번호를 입력하세요' value={field.value} onChange={field.onChange} />
                        )} />
                    </div>
                    {/* 비밀번호 찾기 with 임시 링크 */}
                    <a href='#' className='flex h-[40px] justify-center items-center gap-2 text-[#4D4D4D] text-center font-pretendard text-[16px] font-medium leading-none'>비밀번호 찾기</a>
                </div>
                {/* actions */}
                <div className='flex flex-col items-center gap-8'>
                    <Button type='submit' className='w-[343px] h-[50px]'>이메일 로그인</Button>
                    <div className='flex flex-col items-start gap-6 self-stretch'>
                        {/* 구분선 */}
                        <div className='flex w-[343px] items-center gap-3'>
                            {/* 왼쪽 선 */}
                            <div className='flex-1 h-0'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="146" height="2" viewBox="0 0 146 2" fill="none">
                                    <path d="M0.21875 1.01172H145.719" stroke="#E6E6E6" strokeWidth="1" />
                                </svg>
                            </div>
                            <span className='whitespace-nowrap text-[#949494] text-center font-pretendard text-[16px] font-medium leading-none'>또는</span>
                            {/* 오른쪽 선 */}
                            <div className='flex-1 h-0'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="146" height="2" viewBox="0 0 146 2" fill="none">
                                    <path d="M0.21875 1.01172H145.719" stroke="#E6E6E6" strokeWidth="1" />
                                </svg>
                            </div>
                        </div>
                        {/* SNS 로그인 버튼들 (새로 추가된 부분) */}
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex flex-col items-start gap-4'>
                                <Button 
                                    variant='line' 
                                    className='w-[343px] h-[50px]'
                                    type='button'
                                    onClick={() => handleSnsLogin('google')}
                                >
                                    <GoogleIcon className='w-[18px] h-[18px]' />
                                    Google 로그인
                                </Button>
                                <Button 
                                    variant='line' 
                                    className='w-[343px] h-[50px]'
                                    type='button'
                                    onClick={() => handleSnsLogin('kakao')}
                                >
                                    <KakaoIcon className='w-[18px] h-[18px]' />
                                    카카오 로그인
                                </Button>
                                <Button 
                                    variant='line' 
                                    className='w-[343px] h-[50px]'
                                    type='button'
                                    onClick={() => handleSnsLogin('naver')}
                                >
                                    <NaverIcon className='w-[18px] h-[18px]' />
                                    네이버 로그인
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default LoginForm;