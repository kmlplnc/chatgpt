import React, { useState, useEffect } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  // Track mouse position relative to the SVG center (ekranın her yerinden)
  type MousePos = { x: number; y: number };
  const [mouse, setMouse] = React.useState<MousePos>({ x: 110, y: 135 });
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [expression, setExpression] = React.useState<'normal' | 'happy' | 'surprised' | 'giggly'>('normal');
  const [isPremium, setIsPremium] = React.useState(false);

  // SVG'nin ekrandaki merkezi (ilk renderda ve resize'da güncellenir)
  const [svgCenter, setSvgCenter] = React.useState<MousePos>({ x: 0, y: 0 });

  const [isSad, setIsSad] = useState(false);

  // Rastgele yüz ifadeleri için useEffect
  React.useEffect(() => {
    const expressions: ('normal' | 'happy' | 'surprised' | 'giggly')[] = ['normal', 'happy', 'surprised', 'giggly'];
    
    const changeExpression = () => {
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(randomExpression);
      
      // Rastgele süre (1.5 saniye ile 4 saniye arası)
      const randomInterval = Math.random() * (4000 - 1500) + 1500;
      setTimeout(changeExpression, randomInterval);
    };

    // İlk değişimi başlat
    changeExpression();

    // Cleanup
    return () => {
      // Tüm timeout'ları temizle
      const highestTimeoutId = window.setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i);
      }
    };
  }, []);

  React.useEffect(() => {
    function updateSvgCenter() {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    }
    updateSvgCenter();
    window.addEventListener('resize', updateSvgCenter);
    return () => window.removeEventListener('resize', updateSvgCenter);
  }, []);

  // Mouse'u tüm ekrandan takip et
  React.useEffect(() => {
    function handleWindowMouseMove(e: MouseEvent) {
      setMouse({ x: e.clientX, y: e.clientY });
      // Çıkış Yap butonuna yakınlık kontrolü
      const logoutButtonRef = (window as any).__logoutButtonRef;
      if (logoutButtonRef && logoutButtonRef.current) {
        const rect = logoutButtonRef.current.getBoundingClientRect();
        const mx = e.clientX, my = e.clientY;
        const bx = rect.left + rect.width / 2;
        const by = rect.top + rect.height / 2;
        const dist = Math.sqrt((mx - bx) ** 2 + (my - by) ** 2);
        setIsSad(dist < 120); // 120px yakınlıkta üzgün olsun
      } else {
        setIsSad(false);
      }
    }
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, []);

  // Premium durumunu kontrol et
  React.useEffect(() => {
    // Burada gerçek premium kontrolü yapılacak
    const checkPremium = async () => {
      try {
        const response = await fetch('/api/user/premium-status');
        const data = await response.json();
        setIsPremium(data.isPremium);
      } catch (error) {
        console.error('Premium durumu kontrol edilemedi:', error);
      }
    };
    checkPremium();
  }, []);

  return (
    <div className="flex-1">
      <div className="w-full min-h-screen bg-background dark:bg-neutral-900">
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-up">
          {/* Left: Headline & Description */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <h1 className="font-serif font-bold text-4xl md:text-6xl tracking-tight text-neutral-900 dark:text-white mb-4 animate-fade-up">
              DietKEM: Akıllı Beslenme ve Danışan Takip Platformu
            </h1>
            <p className="text-xl text-muted-foreground font-light mb-8 max-w-xl animate-fade-up-delay-1">
              Diyetisyenler için modern, hızlı ve akıllı danışan yönetimi. Tüm süreçlerinizi tek bir yerde kolayca yönetin.
            </p>
            <div className="flex gap-4 animate-fade-up-delay-2">
              <Link href="/clients">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-base shadow transition-all">
                  Hemen Başla
                </button>
              </Link>
              <Link href="/contact">
                <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-6 py-3 rounded-lg text-base shadow transition-all">
                  Demo Talep Et
                </button>
              </Link>
            </div>
          </div>
          {/* Right: Animated Avocado SVG */}
          <div className="animate-fade-up-delay-3">
            <AvocadoSVG 
              mouse={mouse} 
              svgRef={svgRef} 
              svgCenter={svgCenter} 
              width={320} 
              height={320} 
              isSad={isSad} 
              expression={expression}
              isPremium={isPremium}
            />
          </div>
        </section>
        {/* Özellik Kartları */}
        <section className="mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Danışanlar"
              description="Tüm danışanlarını kolayca yönet, takip et, notlar ekle ve geçmişe hızlıca göz at. Her danışan için detaylı profil ve iletişim imkanı."
              href="/clients"
              className="animate-fade-up-delay-1"
            />
            <FeatureCard
              title="Diyet Planları"
              description="Kişiye özel diyet planları oluştur, düzenle, PDF olarak paylaş ve geçmiş planlara kolayca ulaş."
              href="/diet-plans"
              className="animate-fade-up-delay-2"
            />
            <FeatureCard
              title="Mesajlar"
              description="Danışanlarınla güvenli, hızlı ve arşivlenebilir şekilde iletişim kur. Tüm mesaj geçmişine tek tıkla ulaş."
              href="/messages"
              className="animate-fade-up-delay-3"
            />
            <FeatureCard
              title="Sağlık Hesaplayıcı"
              description="Vücut kitle indeksi, günlük kalori ihtiyacı, makro dağılımı gibi sağlık hesaplamalarını kolayca yap."
              href="/health-calculator"
              className="animate-fade-up-delay-4"
            />
            <FeatureCard
              title="Vitamin & Mineral Bilgileri"
              description="Besinlerin vitamin ve mineral içeriklerini detaylıca incele, eksiklik risklerini ve önerileri öğren."
              href="/vitamin-mineral"
              className="animate-fade-up-delay-4"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// Animated Avocado SVG Component with interactive eyes
type MousePos = { x: number; y: number };
function AvocadoSVG({ mouse, svgRef, svgCenter, width = 220, height = 220, isSad = false, expression = 'normal', isPremium = false }: { mouse: MousePos; svgRef: React.RefObject<SVGSVGElement>; svgCenter: MousePos; width?: number; height?: number; isSad?: boolean; expression?: 'normal' | 'happy' | 'surprised' | 'giggly'; isPremium?: boolean }) {
  // Eye centers (biraz daha yukarı ve aralıklı yapalım)
  const leftEye = { x: 92, y: 132 };
  const rightEye = { x: 128, y: 132 };
  // Gözler daha büyük, pupil de daha büyük
  const eyeRx = 7;
  const eyeRy = 9;
  const pupilRadius = 3.5;
  const pupilRx = 3;
  const pupilRy = 3.5;

  // Gözler koordineli bakacak: SVG'nin merkezinden mouse'a vektör alınır, her iki göz için aynı offset uygulanır
  function getPupilOffset(eye: { x: number; y: number }) {
    // SVG içindeki gözün merkezi (SVG'nin sol üstü 0,0)
    // Mouse'un SVG merkezine göre vektörü
    const dx = mouse.x - svgCenter.x;
    const dy = mouse.y - svgCenter.y;
    // Gözün bakış yönü (aynı vektör, her iki göz için)
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { dx: 0, dy: 0 };
    const maxDist = pupilRadius;
    const scale = Math.min(maxDist, dist) / dist;
    return { dx: dx * scale, dy: dy * scale };
  }
  const pupilOffset = getPupilOffset({ x: 110, y: 135 }); // SVG'nin ortası referans
  const leftPupil = pupilOffset;
  const rightPupil = pupilOffset;

  // Yüz ifadesine göre ağız şekli
  const getMouthPath = () => {
    switch (expression) {
      case 'happy':
        return <path d="M95 172 Q110 190 125 172" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 1px 2px #F8717133)' }} />;
      case 'surprised':
        return <ellipse cx="110" cy="175" rx="8" ry="8" stroke="#333" strokeWidth="4" fill="none" />;
      case 'giggly':
        return <path d="M95 172 Q110 185 125 172 Q110 178 95 172" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 1px 2px #F8717133)' }} />;
      default:
        return <path d="M100 172 Q110 185 120 172" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 1px 2px #F8717133)' }} />;
    }
  };

  // Yüz ifadesine göre kaş şekli
  const getEyebrows = () => {
    switch (expression) {
      case 'surprised':
        return (
          <>
            <path d="M85 122 Q92 118 99 122" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M121 122 Q128 118 135 122" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
      case 'happy':
        return (
          <>
            <path d="M85 122 Q92 126 99 122" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M121 122 Q128 126 135 122" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
      default:
        return (
          <>
            <path d="M85 122 Q92 120 99 124" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M121 124 Q128 120 135 122" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
    }
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-bounce-slow"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.08))' }}
    >
      {/* Premium Crown */}
      {isPremium && (
        <g transform="translate(110, 38) scale(1.5)">
          {/* Alt gölge */}
          <ellipse cx="0" cy="18" rx="38" ry="10" fill="#000" fillOpacity="0.10"/>
          {/* Taç gövdesi */}
          <path
            d="M-40 10 Q-38 -30 -20 -10 Q0 -40 20 -10 Q38 -30 40 10 Q30 0 0 0 Q-30 0 -40 10 Z"
            fill="#FFD700"
            stroke="#B8860B"
            strokeWidth="4"
          />
          {/* Kırmızı iç kısımlar */}
          <path
            d="M-28 0 Q-25 -20 0 -10 Q25 -20 28 0 Q15 -5 0 -5 Q-15 -5 -28 0 Z"
            fill="#E63946"
            stroke="#B8860B"
            strokeWidth="2"
          />
          {/* Orta yuvarlak taş */}
          <ellipse cx="0" cy="-8" rx="7" ry="7" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
          <ellipse cx="0" cy="-8" rx="3" ry="3" fill="#F59E42" />
          {/* Yan taşlar */}
          <circle cx="-20" cy="0" r="4" fill="#F59E42" stroke="#B8860B" strokeWidth="2"/>
          <circle cx="20" cy="0" r="4" fill="#F59E42" stroke="#B8860B" strokeWidth="2"/>
          {/* Tepe topu */}
          <ellipse cx="0" cy="-22" rx="6" ry="6" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
          <ellipse cx="0" cy="-22" rx="2.5" ry="2.5" fill="#E63946"/>
          {/* Küçük yan toplar */}
          <circle cx="-30" cy="5" r="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
          <circle cx="30" cy="5" r="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
          {/* Parlaklık efekti */}
          <ellipse cx="-10" cy="-15" rx="2" ry="1" fill="#fff" fillOpacity="0.7"/>
          <ellipse cx="10" cy="-15" rx="2" ry="1" fill="#fff" fillOpacity="0.7"/>
        </g>
      )}
      <ellipse cx="110" cy="120" rx="80" ry="100" fill="#A3E635" />
      <ellipse cx="110" cy="140" rx="55" ry="70" fill="#65A30D" />
      <ellipse cx="110" cy="150" rx="32" ry="38" fill="#F59E42" />
      <ellipse cx="110" cy="150" rx="15" ry="17" fill="#B45309" />
      {/* Kaşlar */}
      {getEyebrows()}
      {/* Eller */}
      <path d="M45 170 Q55 180 65 170" stroke="#B45309" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M175 170 Q165 180 155 170" stroke="#B45309" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Ağız */}
      {isSad ? (
        // Tatlı, büzülmüş üzgün ağız
        <path d="M98 178 Q110 168 122 178 Q110 172 98 178" stroke="#333" strokeWidth="4" fill="#fff" fillOpacity="0.7" style={{ filter: 'drop-shadow(0 1px 2px #60A5FA33)' }} />
      ) : (
        getMouthPath()
      )}
      {/* Eyes (outer) */}
      <ellipse cx={leftEye.x} cy={leftEye.y} rx={eyeRx} ry={eyeRy} fill="#222" />
      <ellipse cx={rightEye.x} cy={rightEye.y} rx={eyeRx} ry={eyeRy} fill="#222" />
      {/* Pupils (moveable) */}
      <ellipse cx={leftEye.x + leftPupil.dx} cy={leftEye.y + leftPupil.dy} rx={pupilRx} ry={pupilRy} fill="#fff" />
      <ellipse cx={rightEye.x + rightPupil.dx} cy={rightEye.y + rightPupil.dy} rx={pupilRx} ry={pupilRy} fill="#fff" />
      {/* Göz highlightları */}
      <ellipse cx={leftEye.x + leftPupil.dx - 1.5} cy={leftEye.y + leftPupil.dy - 2} rx="0.8" ry="1.2" fill="#fff" fillOpacity="0.7" />
      <ellipse cx={rightEye.x + rightPupil.dx - 1.5} cy={rightEye.y + rightPupil.dy - 2} rx="0.8" ry="1.2" fill="#fff" fillOpacity="0.7" />
      {/* Göz dolma efekti (bebek gibi, gözün içinde mavi oval) */}
      {isSad && (
        <>
          <ellipse cx={leftEye.x + leftPupil.dx} cy={leftEye.y + leftPupil.dy + 3} rx={pupilRx + 2.2} ry={pupilRy + 2.5} fill="#60A5FA" fillOpacity="0.35" style={{ transition: 'fill-opacity 0.4s' }} />
          <ellipse cx={rightEye.x + rightPupil.dx} cy={rightEye.y + rightPupil.dy + 3} rx={pupilRx + 2.2} ry={pupilRy + 2.5} fill="#60A5FA" fillOpacity="0.35" style={{ transition: 'fill-opacity 0.4s' }} />
          {/* Parlaklık efekti */}
          <ellipse cx={leftEye.x + leftPupil.dx + 1.2} cy={leftEye.y + leftPupil.dy + 4.5} rx="1.1" ry="1.7" fill="#fff" fillOpacity="0.5" />
          <ellipse cx={rightEye.x + rightPupil.dx + 1.2} cy={rightEye.y + rightPupil.dy + 4.5} rx="1.1" ry="1.7" fill="#fff" fillOpacity="0.5" />
        </>
      )}
      {/* Blush (daha belirgin ve pembe) */}
      <ellipse cx="82" cy="146" rx="7" ry="3.5" fill="#FB7185" fillOpacity="0.7" />
      <ellipse cx="138" cy="146" rx="7" ry="3.5" fill="#FB7185" fillOpacity="0.7" />
      {/* Gözyaşı için gradient tanımı */}
      <defs>
        <linearGradient id="tearGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Tailwind animation (add to global CSS if not present):
// .animate-bounce-slow { animation: bounce 2.2s infinite cubic-bezier(.68,-0.55,.27,1.55); }
// @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }

// Özellik Kartı Bileşeni
function FeatureCard({ title, description, href, className }: { title: string; description: string; href: string; className?: string }) {
  // Get the correct route based on title
  const getRoute = (title: string) => {
    switch (title) {
      case "Danışanlar":
        return "/clients";
      case "Diyet Planları":
        return "/diet-plans";
      case "Mesajlar":
        return "/messages";
      case "Sağlık Hesaplayıcı":
        return "/health-calculator";
      case "Vitamin & Mineral Bilgileri":
        return "/vitamin-mineral";
      case "Besin Veritabanı":
        return "/food-database";
      default:
        return "/";
    }
  };

  return (
    <Link href={getRoute(title)} className={`block bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-200 p-6 border border-neutral-200 dark:border-neutral-700 cursor-pointer transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-96 flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center gap-4 mb-3 justify-center">
          <span className="text-3xl">{getFeatureIcon(title)}</span>
          <span className="font-serif text-xl font-bold text-neutral-900 dark:text-white">{title}</span>
        </div>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm font-medium text-center mb-4">{description}</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {getFeatureMockup(title)}
      </div>
    </Link>
  );
}

// Modern SVG mockups for each feature
function getFeatureMockup(title: string) {
  switch (title) {
    case "Danışanlar":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 animate-gradient">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-pulse">
                <span className="text-blue-600 dark:text-blue-400">👤</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Ayşe Yılmaz</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Son görüşme: 2 gün önce</div>
              </div>
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">Aktif</div>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center animate-pulse">
                <span className="text-purple-600 dark:text-purple-400">👤</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Mehmet Demir</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Son görüşme: 1 hafta önce</div>
              </div>
              <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">Beklemede</div>
            </div>
          </div>
        </div>
      );
    case "Diyet Planları":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 animate-gradient">
          <div className="flex flex-col gap-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">🥗</div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Glutensiz Plan</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">• Kahvaltı: Yulaf ezmesi, meyve</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">• Öğle: Quinoa salata</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">• Akşam: Izgara balık</div>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">🥗</div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Vejetaryen Plan</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">• Kahvaltı: Smoothie bowl</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">• Öğle: Mercimek çorbası</div>
              </div>
            </div>
          </div>
        </div>
      );
    case "Mesajlar":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 animate-gradient">
          <div className="flex flex-col gap-2">
            <div className="self-start bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm max-w-[80%] hover:scale-105 transition-transform duration-300">
              <div className="text-xs text-neutral-800 dark:text-neutral-200">Merhaba hocam, bugün görüşme var mı?</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">10:30</div>
            </div>
            <div className="self-end bg-purple-500 rounded-lg p-2 shadow-sm max-w-[80%] hover:scale-105 transition-transform duration-300">
              <div className="text-xs text-white">Evet, saat 14:00'te görüşelim.</div>
              <div className="text-[10px] text-purple-200 mt-1">10:32</div>
            </div>
            <div className="self-start bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm max-w-[80%] hover:scale-105 transition-transform duration-300">
              <div className="text-xs text-neutral-800 dark:text-neutral-200">Tamam, teşekkürler. Görüşmek üzere!</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">10:33</div>
            </div>
          </div>
        </div>
      );
    case "Sağlık Hesaplayıcı":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 animate-gradient">
          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Vücut Kitle İndeksi</div>
                <div className="text-sm font-medium text-green-600 dark:text-green-400">22.5</div>
              </div>
              <div className="h-8 bg-red-50 dark:bg-red-800 rounded-lg flex items-center px-3">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Normal Kilolu</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Günlük Kalori</div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">1850 kcal</div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Su İhtiyacı</div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">2.5 L</div>
              </div>
            </div>
          </div>
        </div>
      );
    case "Vitamin & Mineral Bilgileri":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 animate-gradient">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "D Vitamini", value: "15 mcg", color: "text-amber-600" },
              { name: "B12", value: "2.4 mcg", color: "text-blue-600" },
              { name: "Demir", value: "18 mg", color: "text-red-600" },
              { name: "Kalsiyum", value: "1000 mg", color: "text-green-600" }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 mx-auto mb-2 flex items-center justify-center">
                  <span className={`text-lg ${item.color}`}>💊</span>
                </div>
                <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 text-center mb-1">{item.name}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "Besin Veritabanı":
      return (
        <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 animate-gradient">
          <div className="flex flex-col gap-2">
            {[
              { name: "Tavuk Göğsü", macro: "31g protein" },
              { name: "Mercimek", macro: "9g protein" },
              { name: "Yulaf Ezmesi", macro: "13g karbonhidrat" }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    🍎
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{item.macro}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

// Başlık ile eşleşen emoji döndürür
function getFeatureIcon(title: string) {
  switch (title) {
    case "Danışanlar":
      return "👩‍⚕️";
    case "Diyet Planları":
      return "🥗";
    case "Mesajlar":
      return "💬";
    case "Sağlık Hesaplayıcı":
      return "🧮";
    case "Vitamin & Mineral Bilgileri":
      return "💊";
    case "Besin Veritabanı":
      return "🍎";
    default:
      return "✨";
  }
}

// Her kart için: üstte sabit mockup, altında fade/slide ile değişen tek içerik
function getFeaturePreview(title: string) {
  // Her kart için: üstte sabit mockup, altında fade/slide ile değişen tek içerik
  const items = getFeaturePreviewAnimatedItems(title);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (!items || items.length < 2) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [items]);
  return (
    <div className="w-full max-w-xs h-32 flex flex-col">
      {getFeaturePreviewStatic(title)}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
        {items && items.map((item, i) => (
          <div
            key={i}
            className={`absolute left-0 top-0 w-full transition-all duration-700 ${i === active ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-4 z-0'} pointer-events-none`}
            style={{ transitionProperty: 'opacity, transform' }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// Her kart için alt içeriklerin dizisi (her biri bir React node)
function getFeaturePreviewAnimatedItems(title: string) {
  switch (title) {
    case "Danışanlar":
      return [
        <div className="flex justify-between items-center bg-white dark:bg-neutral-800 rounded px-2 py-1">
          <span className="font-semibold">Mehmet Demir</span>
          <span className="text-yellow-500 text-xs font-bold">Beklemede</span>
        </div>,
        <div className="flex justify-between items-center bg-white dark:bg-neutral-800 rounded px-2 py-1">
          <span className="font-semibold">Zeynep Kaya</span>
          <span className="text-red-500 text-xs font-bold">Pasif</span>
        </div>,
        <div className="flex justify-between items-center bg-white dark:bg-neutral-800 rounded px-2 py-1">
          <span className="font-semibold">Ali Can</span>
          <span className="text-green-500 text-xs font-bold">Aktif</span>
        </div>,
      ];
    case "Diyet Planları":
      return [
        <div className="bg-white dark:bg-neutral-800 rounded px-3 py-2 flex flex-col">
          <span className="font-bold text-sm">Glutensiz Plan</span>
          <span className="text-xs text-neutral-500">1500 kcal • 4 öğün</span>
        </div>,
        <div className="bg-white dark:bg-neutral-800 rounded px-3 py-2 flex flex-col">
          <span className="font-bold text-sm">Vejetaryen Plan</span>
          <span className="text-xs text-neutral-500">1400 kcal • 3 öğün</span>
        </div>,
      ];
    case "Mesajlar":
      return [
        <div className="self-start bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg px-3 py-1 text-xs max-w-[70%] mb-1">Merhaba, nasılsınız?</div>,
        <div className="self-end bg-blue-500 text-white rounded-lg px-3 py-1 text-xs max-w-[70%]">İyiyim, teşekkürler!</div>,
        <div className="self-start bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg px-3 py-1 text-xs max-w-[70%] mb-1">Bugün görüşme var mı?</div>,
      ];
    case "Sağlık Hesaplayıcı":
      return [
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-500">Kilo:</span>
          <span className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs">65 kg</span>
        </div>,
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-500">VKİ:</span>
          <span className="bg-green-100 text-green-700 rounded px-2 py-1 text-xs font-bold">22.5</span>
        </div>,
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-500">Yağ Oranı:</span>
          <span className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs">%18</span>
        </div>,
      ];
    case "Vitamin & Mineral Bilgileri":
      return [
        <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 flex flex-col items-center">
          <span className="text-xs font-bold text-green-600">Demir</span>
          <span className="text-xs text-neutral-500">8 mg</span>
        </div>,
        <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 flex flex-col items-center">
          <span className="text-xs font-bold text-pink-600">B12</span>
          <span className="text-xs text-neutral-500">2.4 mcg</span>
        </div>,
        <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 flex flex-col items-center">
          <span className="text-xs font-bold text-blue-600">Kalsiyum</span>
          <span className="text-xs text-neutral-500">500 mg</span>
        </div>,
      ];
    case "Besin Veritabanı":
      return [
        <div className="flex gap-2">
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Tavuk</div>
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Mercimek</div>
        </div>,
        <div className="flex gap-2">
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Elma</div>
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Yoğurt</div>
        </div>,
      ];
    default:
      return [];
  }
}

// Sabit üst mockup
function getFeaturePreviewStatic(title: string) {
  switch (title) {
    case "Danışanlar":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-2 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>Ad Soyad</span><span>Durum</span>
          </div>
          <div className="flex justify-between items-center bg-white dark:bg-neutral-800 rounded px-2 py-1">
            <span className="font-semibold">Ayşe Yılmaz</span>
            <span className="text-green-500 text-xs font-bold">Aktif</span>
          </div>
        </div>
      );
    case "Diyet Planları":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-2 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner">
          <div className="bg-white dark:bg-neutral-800 rounded px-3 py-2 flex flex-col">
            <span className="font-bold text-sm">Haftalık Plan</span>
            <span className="text-xs text-neutral-500">1200 kcal • 3 öğün</span>
          </div>
        </div>
      );
    case "Mesajlar":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-2 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner">
          <div className="self-end bg-blue-500 text-white rounded-lg px-3 py-1 text-xs max-w-[70%]">Merhaba hocam!</div>
        </div>
      );
    case "Sağlık Hesaplayıcı":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-3 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-neutral-500">Boy:</span>
            <span className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs">170 cm</span>
          </div>
        </div>
      );
    case "Vitamin & Mineral Bilgileri":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-2 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 flex flex-col items-center">
            <span className="text-xs font-bold text-amber-600">C Vitamini</span>
            <span className="text-xs text-neutral-500">60 mg</span>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 flex flex-col items-center">
            <span className="text-xs font-bold text-blue-600">Kalsiyum</span>
            <span className="text-xs text-neutral-500">500 mg</span>
          </div>
        </div>
      );
    case "Besin Veritabanı":
      return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-t-lg p-2 border border-b-0 border-neutral-200 dark:border-neutral-700 shadow-inner">
          <div className="flex gap-2 mb-2">
            <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Elma</div>
            <div className="bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs flex-1">Yoğurt</div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// Add these styles to your global CSS file
const styles = `
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 15s ease infinite;
}
`;
