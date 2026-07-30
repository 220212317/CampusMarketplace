import { Image } from 'react-native';

export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Image.prefetch(url)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

export const getValidImageSource = (url: string | null | undefined) => {
  if (!url) return null;
  return { uri: url };
};