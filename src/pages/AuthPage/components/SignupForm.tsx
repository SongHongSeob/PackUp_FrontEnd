import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import FormInput from '../../../components/FormInput';
import Checkbox from './Checkbox';
import { GoogleIcon, KakaoIcon, NaverIcon } from '../../../assets';

type SignupFormData = {
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
    agreeMarketing: boolean;
};

const SignupForm = () => {
    const navigate = useNavigate();
    const { control, handleSubmit } = useForm<SignupFormData>({
        defaultValues: {
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false,
            agreePrivacy: false,
            agreeMarketing: false
        }
    });

    type AgreementsState = {
        terms: boolean;
        privacy: boolean;
        marketing: boolean;
    };

    const [agreements, setAgreements] = useState<AgreementsState>({
        terms: false,
        privacy: false,
        marketing: false,
    });

    const handleAgreementChange = (key: keyof AgreementsState, value: boolean) => {
        setAgreements(prev => ({ ...prev, [key]: value }));
    };

    const onSubmit = async (data: SignupFormData) => {
        if (!agreements.terms || !agreements.privacy) {
            alert('필수 항목에 동의해야 합니다.');
            return;
        }

        try {
            const signupData = {
                userId: data.email,
                phoneNum: data.phone,
                userPw: data.password,
                infoAcq: agreements.terms,
                personalInfoAcq: agreements.privacy,
                mktAgree: agreements.marketing
            };

            const response = await fetch('http://packup-api.kro.kr/register/userRegister', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });

            if (!response.ok) {
                throw new Error('회원가입 실패');
            }

            alert('회원가입이 완료되었습니다.');
            navigate('/auth');
        } catch (error) {
            console.error('회원가입 실패: ', error);
            alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // const password = watch('password');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-center gap-8'>
            {/* 문구 */}
            <h2 className='h-[26px] self-stretch text-[#141414] text-center font-pretendard text-[26px] font-bold leading-none'>새로운 계정 생성</h2>
            {/* form */}
            <div className='flex flex-col justify-center items-start gap-8'>
                {/* input */}
                <div className='flex flex-col items-start gap-4'>
                    <div className='flex flex-col items-end gap-3'>
                        <div className='flex flex-col items-start gap-[25px] self-stretch'>
                            {/* 이메일 */}
                            <Controller name='email' control={control} render={({ field }) => (
                                <FormInput label='이메일' variant='email' placeholder='이메일을 입력하세요' value={field.value} onChange={field.onChange} />
                            )} />
                            {/* 연락처 */}
                            <Controller name='phone' control={control} render={({ field }) => (
                                <FormInput label='연락처' variant='phone' placeholder='연락처를 입력하세요' value={field.value} onChange={field.onChange} />
                            )} />
                            {/* 비밀번호 */}
                            <Controller name='password' control={control} render={({ field }) => (
                                <FormInput label='비밀번호' variant='password' placeholder='비밀번호를 입력하세요' value={field.value} onChange={field.onChange} />
                            )} />
                            {/* 비밀번호 확인 */}
                            <Controller name='confirmPassword' control={control} render={({ field }) => (
                                <FormInput label='비밀번호 확인' variant='password' placeholder='비밀번호를 다시 입력하세요' value={field.value} onChange={field.onChange} />
                            )} />
                        </div>
                    </div>
                    {/* 체크박스들 */}
                    <div className='flex flex-col items-start gap-[10px] self-stretch'>
                        {/* 임시 onViewClick */}
                        <Checkbox label='이용약관 동의(필수)' onChange={(checked) => handleAgreementChange('terms', checked)} onViewClick={() => console.log('이용약관 보기')} />
                        <Checkbox label='개인정보 수집 및 이용 동의(필수)' onChange={(checked) => handleAgreementChange('privacy', checked)} onViewClick={() => console.log('개인정보 보기')} />
                        <Checkbox label='마케팅 정보 수신 동의(선택)' onChange={(checked) => handleAgreementChange('marketing', checked)} onViewClick={() => console.log('마케팅 보기')} />
                    </div>
                </div>
                {/* actions */}
                <div className='flex flex-col items-center gap-8'>
                    <Button type='submit' className='w-[343px] h-[50px]'>계정 만들기</Button>
                    <div className='flex flex-col items-start gap-6'>
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
                        {/* buttons */}
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex flex-col items-start gap-4'>
                                <Button variant='line' className='w-[343px] h-[50px]'>
                                    <GoogleIcon className='w-[18px] h-[18px]' />
                                    Google로 시작하기
                                </Button>
                                <Button variant='line' className='w-[343px] h-[50px]'>
                                    <KakaoIcon className='w-[18px] h-[18px]' />
                                    카카오로 시작하기
                                </Button>
                                <Button variant='line' className='w-[343px] h-[50px]'>
                                    <NaverIcon className='w-[18px] h-[18px]' />
                                    네이버로 시작하기
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SignupForm;