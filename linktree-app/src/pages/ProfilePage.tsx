// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipagens para os dados que esperamos da API
interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
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
    <div className="bg-gray-800 text-white min-h-screen p-4 flex flex-col items-center">
      <main className="w-full max-w-2xl mx-auto">
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
              href={`${backendBaseUrl}/r/${link.id}`} // Aponta para nossa rota de redirecionamento
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-700 p-4 rounded-lg text-center font-semibold hover:bg-gray-600 transition-transform transform hover:scale-105"
            >
              {link.title}
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