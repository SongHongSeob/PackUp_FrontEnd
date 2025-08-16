import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

type Section = { title: string; blocks: Block[] };

const LABEL: Record<string, string> = {
  terms: '이용약관 동의',
  privacy: '개인정보 수집 및 이용 동의',
  marketing: '마케팅 정보 수신 동의',
};

const AgreementsPage = () => {
  const { id } = useParams();
  const key = useMemo(() => {
    return id === 'terms' || id === 'privacy' || id === 'marketing' ? id : '';
  }, [id]);

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JSON
  useEffect(() => {
    if (!key) {
      setSections([]);
      return;
    }
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL || '/';
    const url = `${base}agreements/${key}.json`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Section[]) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setError('콘텐츠를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [key]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB]">
      <Header pageType="landing"/>

      <div className="h-[68px] sm:h-[76px]" aria-hidden />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-[30%]">
          <div className="rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.08)] border border-[#F2F2F2]">
            <div className="px-6 sm:px-8 pt-7 pb-4">
              <h2 className="text-center text-[20px] sm:text-[22px] font-pretendard">
                {LABEL[key] ?? '약관 상세'}
              </h2>
            </div>

            <div className="px-6 sm:px-8 pb-7">
              <div
                className="h-[360px] sm:h-[450px] overflow-auto bg-[#FAFAFA]
                           rounded-xl border border-[#EAEAEA] p-4 sm:p-5
                           text-[14px] leading-7 text-[#4D4D4D]"
              >
                {loading ? (
                  <p className="font-pretendard">불러오는 중…</p>
                ) : error ? (
                  <p className="font-pretendard">{error}</p>
                ) : sections.length === 0 ? (
                  <p className="font-pretendard">콘텐츠가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {sections.map((sec, i) => (
                      <section
                        key={i}
                        className="rounded-md border border-[#E3E3E3] bg-white font-pretendard"
                      >
                        <header className="px-4 py-3 border-b text-[15px] font-pretendard text-[#141414]">
                          {i + 1}. {sec.title}
                        </header>
                        <div className="p-4 space-y-2">
                          {sec.blocks.map((b, j) => {
                            if (b.type === 'p') return <p key={j}>{b.text}</p>;
                            if (b.type === 'ul')
                              return (
                                <ul key={j} className="list-disc pl-5 space-y-1">
                                  {b.items.map((it, k) => (
                                    <li key={k}>{it}</li>
                                  ))}
                                </ul>
                              );
                            if (b.type === 'ol')
                              return (
                                <ol key={j} className="list-decimal pl-5 space-y-1">
                                  {b.items.map((it, k) => (
                                    <li key={k}>{it}</li>
                                  ))}
                                </ol>
                              );
                            return null;
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  className="px-6 h-[44px] w-[60%] rounded-lg bg-[#4F46E5] text-white font-pretendard"
                  onClick={() => history.back()}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgreementsPage;