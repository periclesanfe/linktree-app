// src/pages/ProfilePage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { LINK_TYPE_ICONS } from '../components/icons/SocialIcons';

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
        setError('Perfil não encontrado.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  // Monta a URL base do backend para redirecionamento
  const getRedirectUrl = (linkId: string): string => {
    // Em produção, usa URL relativa que o Nginx roteia para o backend
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
    
    // Em navegadores desktop/normais, deixamos o comportamento padrão do <a>
    // O href já está configurado, então o clique funciona naturalmente
  }, []);

  if (loading) return <div className="text-center text-white p-10">Carregando perfil...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  const backgroundStyle = profile?.background_image_url
    ? `url(${profile.background_image_url})`
    : 'linear-gradient(to bottom, #1f2937, #111827)';

  console.log('Background style being applied:', {
    hasBackgroundUrl: !!profile?.background_image_url,
    urlPreview: profile?.background_image_url?.substring(0, 50),
    backgroundStyle: backgroundStyle.substring(0, 50)
  });

  return (
    <div
      className="text-white min-h-screen p-4 sm:p-6 md:p-8 flex flex-col items-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: backgroundStyle
      }}
    >
      {/* Overlay para melhorar a legibilidade do texto sobre a imagem */}
      {/* Temporariamente desabilitado para debug */}
      {/* {profile?.background_image_url && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
      )} */}

      <main className="w-full max-w-2xl mx-auto relative z-10 px-2 sm:px-4">
        {/* Perfil Header */}
        <header className="text-center mt-8 sm:mt-12 mb-6 sm:mb-8">
          <img
            src={profile?.profile_image_url || 'https://via.placeholder.com/150'}
            alt={`Foto de ${profile?.display_name}`}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">@{profile?.username}</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-300 px-4">{profile?.bio}</p>
        </header>
        
        {/* Lista de Links */}
        <section className="space-y-8 sm:space-y-10">
          {profile?.links.map(link => (
            <a
              key={link.id}
              href={getRedirectUrl(link.id)}
              onClick={(e) => handleLinkClick(e, link.id)}
              rel="noopener noreferrer"
              className="block relative pt-12 sm:pt-14"
            >
              {/* Imagem flutuando (metade fora, metade dentro) */}
              {link.cover_image_url ? (
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 z-10">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 shadow-xl bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${link.cover_image_url})`,
                      borderColor: profile.accent_color || '#6366f1'
                    }}
                  />
                </div>
              ) : (
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white shadow-xl border-4"
                       style={{ borderColor: profile.accent_color || '#6366f1' }}>
                    {(() => {
                      const IconComponent = LINK_TYPE_ICONS[link.link_type as keyof typeof LINK_TYPE_ICONS] || LINK_TYPE_ICONS['website'];
                      return IconComponent ? <IconComponent size={40} className="text-gray-600" /> : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Card do Link */}
              <div
                className="p-4 sm:p-5 rounded-2xl text-center font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                style={{
                  backgroundColor: profile.accent_color || '#6366f1',
                  color: '#ffffff'
                }}
              >
                <span className="text-base sm:text-lg block mt-2">{link.title}</span>
              </div>
            </a>
          ))}
        </section>

        {/* Ícones Sociais */}
        <footer className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 mb-8">
          {profile?.socialIcons.map(icon => (
            <a
              key={icon.id}
              href={icon.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition text-sm sm:text-base"
            >
              {/* Idealmente, aqui teríamos SVGs para cada ícone */}
              <span className="capitalize">{icon.platform}</span>
            </a>
          ))}
        </footer>
      </main>
    </div>
  );
};

export default ProfilePage;