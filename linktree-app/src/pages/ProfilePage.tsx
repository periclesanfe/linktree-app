// src/pages/ProfilePage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { LINK_TYPE_ICONS, SOCIAL_PLATFORM_ICONS } from '../components/icons/SocialIcons';

// Detecta se estamos em um WebView in-app (Instagram, TikTok, Facebook, etc.)
const isInAppWebView = (): boolean => {
  const ua = navigator.userAgent || navigator.vendor || '';
  
  // Detecta WebViews específicos de apps sociais
  const inAppPatterns = [
    /FBAN|FBAV/i,        // Facebook App
    /Instagram/i,         // Instagram
    /Twitter/i,           // Twitter/X
    /Line\//i,            // Line
    /KAKAOTALK/i,         // KakaoTalk
    /Snapchat/i,          // Snapchat
    /TikTok/i,            // TikTok
    /musical_ly/i,        // TikTok (antigo)
    /BytedanceWebview/i,  // TikTok WebView
    /LinkedIn/i,          // LinkedIn
    /Pinterest/i,         // Pinterest
    /Telegram/i,          // Telegram
    /WhatsApp/i,          // WhatsApp (geralmente abre no Safari, mas verificamos)
  ];
  
  return inAppPatterns.some(pattern => pattern.test(ua));
};

// Detecta iOS (iPhone, iPad, iPod)
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
};

// Tipagens para os dados que esperamos da API
interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
  color_hash?: string | null;
  background_color?: string | null;
  border_color?: string | null;
  link_type?: string;
  metadata?: Record<string, string>;
}

interface SocialIcon {
  id: string;
  platform: string;
  url: string;
}

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_image_url: string | null;
  background_image_url: string | null;
  accent_color: string | null;
  links: Link[];
  socialIcons: SocialIcon[];
}

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/profile/${username}`);
        console.log('Profile data received:', {
          username: response.data.username,
          hasBackgroundImage: !!response.data.background_image_url,
          backgroundImageLength: response.data.background_image_url?.length || 0,
          accentColor: response.data.accent_color
        });
        setProfile(response.data);
      } catch (err) {
        setError('Perfil nao encontrado.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  // Monta a URL base do backend para redirecionamento
  const getRedirectUrl = (linkId: string): string => {
    // Em producao, usa URL relativa que o Nginx roteia para o backend
    // Em desenvolvimento, usa a URL do backend diretamente
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    return `${backendUrl}/r/${linkId}`;
  };

  // Handler de clique otimizado para iOS WebViews
  // IMPORTANT: Must be declared before early returns to follow React Hook rules
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, linkId: string) => {
    const redirectUrl = getRedirectUrl(linkId);
    
    // Em WebViews in-app ou iOS, target="_blank" frequentemente falha
    // Usamos window.location.href para garantir o redirecionamento
    if (isInAppWebView() || isIOS()) {
      e.preventDefault();
      window.location.href = redirectUrl;
      return;
    }
    
    // Em navegadores desktop/normais, deixamos o comportamento padrao do <a>
    // O href ja esta configurado, entao o clique funciona naturalmente
  }, []);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-meuhub-cream via-meuhub-peach to-meuhub-coral-light flex flex-col items-center p-4">
        <div className="w-full max-w-md mx-auto mt-12 animate-pulse">
          {/* Profile skeleton */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/50 mb-4" />
            <div className="h-6 w-32 bg-white/50 rounded mb-2" />
            <div className="h-4 w-48 bg-white/50 rounded" />
          </div>
          {/* Links skeleton */}
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/30 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-meuhub-cream via-meuhub-peach to-meuhub-coral-light flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg">
          <div className="text-6xl mb-4">:(</div>
          <p className="text-meuhub-text text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Determine background style
  const hasCustomBackground = !!profile?.background_image_url;
  const accentColor = profile?.accent_color || '#E8A87C'; // Default to MeuHub primary

  return (
    <div
      className="min-h-screen flex flex-col items-center relative"
      style={{
        backgroundImage: hasCustomBackground
          ? `url(${profile.background_image_url})`
          : 'linear-gradient(135deg, #FDF8F5 0%, #FCEEE6 25%, #F5D5C3 50%, #E8A87C 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for custom backgrounds to improve readability */}
      {hasCustomBackground && (
        <div className="absolute inset-0 bg-black/30 z-0" />
      )}

      <main className="w-full max-w-md mx-auto relative z-10 px-4 py-8 sm:py-12">
        {/* Profile Header */}
        <header 
          className="text-center mb-8 opacity-0 animate-fade-in-up"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="relative inline-block mb-4">
            <img
              src={profile?.profile_image_url || 'https://via.placeholder.com/150'}
              alt={`Foto de ${profile?.display_name}`}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto border-4 border-white shadow-xl object-cover"
            />
          </div>
          <h1 
            className={`text-2xl sm:text-3xl font-bold ${hasCustomBackground ? 'text-white' : 'text-meuhub-text'}`}
          >
            @{profile?.username}
          </h1>
          {profile?.bio && (
            <p 
              className={`mt-2 text-sm sm:text-base max-w-xs mx-auto ${hasCustomBackground ? 'text-white/90' : 'text-meuhub-text/70'}`}
            >
              {profile.bio}
            </p>
          )}
        </header>
        
        {/* Links List */}
        <section className="space-y-4">
          {profile?.links.map((link, index) => {
            const IconComponent = LINK_TYPE_ICONS[link.link_type as keyof typeof LINK_TYPE_ICONS] || LINK_TYPE_ICONS['website'];
            
            return (
              <a
                key={link.id}
                href={getRedirectUrl(link.id)}
                onClick={(e) => handleLinkClick(e, link.id)}
                rel="noopener noreferrer"
                className="block opacity-0 animate-fade-in-up"
                style={{ 
                  animationDelay: `${(index + 1) * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2"
                  style={{ borderColor: accentColor }}
                >
                  {/* Icon or Cover Image */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: link.cover_image_url ? 'transparent' : `${accentColor}20` }}
                  >
                    {link.cover_image_url ? (
                      <img 
                        src={link.cover_image_url} 
                        alt="" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      IconComponent && <IconComponent size={24} className="text-meuhub-accent" />
                    )}
                  </div>
                  
                  {/* Title */}
                  <span className="flex-1 font-semibold text-meuhub-text text-base sm:text-lg">
                    {link.title}
                  </span>
                  
                  {/* Arrow */}
                  <svg 
                    className="w-5 h-5 text-meuhub-text/40" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            );
          })}
        </section>

        {/* Social Icons */}
        {profile?.socialIcons && profile.socialIcons.length > 0 && (
          <footer 
            className="flex flex-wrap justify-center gap-4 mt-8 opacity-0 animate-fade-in-up"
            style={{ 
              animationDelay: `${((profile?.links?.length || 0) + 2) * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {profile.socialIcons.map(icon => {
              const SocialIcon = SOCIAL_PLATFORM_ICONS[icon.platform.toLowerCase()];
              
              return (
                <a
                  key={icon.id}
                  href={icon.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    hasCustomBackground 
                      ? 'bg-white/20 hover:bg-white/40 text-white' 
                      : 'bg-white shadow-md hover:shadow-lg text-meuhub-text'
                  }`}
                  title={icon.platform}
                >
                  {SocialIcon ? (
                    <SocialIcon size={20} />
                  ) : (
                    <span className="text-xs font-medium uppercase">{icon.platform.slice(0, 2)}</span>
                  )}
                </a>
              );
            })}
          </footer>
        )}

        {/* Powered by MeuHub */}
        <div 
          className={`text-center mt-12 opacity-0 animate-fade-in-up ${hasCustomBackground ? 'text-white/60' : 'text-meuhub-text/40'}`}
          style={{ 
            animationDelay: `${((profile?.links?.length || 0) + 3) * 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <a 
            href="https://meuhub.app.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs hover:opacity-100 transition-opacity"
          >
            Powered by MeuHub
          </a>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
