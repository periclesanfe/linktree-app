// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipagens para os dados que esperamos da API
interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
  color_hash?: string | null;
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

  if (loading) return <div className="text-center text-white p-10">Carregando perfil...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  return (
    <div
      className="text-white min-h-screen p-4 flex flex-col items-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: profile?.background_image_url
          ? `url(${profile.background_image_url})`
          : 'linear-gradient(to bottom, #1f2937, #111827)'
      }}
    >
      {/* Overlay para melhorar a legibilidade do texto sobre a imagem */}
      {profile?.background_image_url && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
      )}

      <main className="w-full max-w-2xl mx-auto relative z-10">
        {/* Perfil Header */}
        <header className="text-center mt-12 mb-8">
          <img 
            src={profile?.profile_image_url || 'https://via.placeholder.com/150'}
            alt={`Foto de ${profile?.display_name}`}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white"
          />
          <h1 className="text-2xl font-bold">@{profile?.username}</h1>
          <p className="mt-2 text-gray-300">{profile?.bio}</p>
        </header>
        
        {/* Lista de Links */}
        <section className="space-y-4">
          {profile?.links.map(link => (
            <a
              key={link.id}
              href={`${backendBaseUrl}/r/${link.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg text-center font-semibold transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
              style={{
                backgroundColor: link.color_hash || '#374151',
                color: '#ffffff'
              }}
            >
              {link.cover_image_url && (
                <img
                  src={link.cover_image_url}
                  alt={link.title}
                  className="w-12 h-12 object-cover rounded-md"
                />
              )}
              <span>{link.title}</span>
            </a>
          ))}
        </section>

        {/* Ícones Sociais */}
        <footer className="flex justify-center space-x-6 mt-8">
          {profile?.socialIcons.map(icon => (
            <a key={icon.id} href={icon.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
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