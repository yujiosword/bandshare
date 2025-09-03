// URL Preview Service - fetches metadata from URLs
export const fetchUrlPreview = async (url) => {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Use CORS proxy for fetching external content
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));
    
    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }
    
    const html = await response.text();
    
    // Parse HTML for Open Graph and meta tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract metadata
    const getMetaContent = (name) => {
      const meta = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };
    
    const title = getMetaContent('og:title') || 
                 getMetaContent('twitter:title') || 
                 doc.querySelector('title')?.textContent ||
                 urlObj.hostname;
    
    const description = getMetaContent('og:description') || 
                       getMetaContent('twitter:description') ||
                       getMetaContent('description') ||
                       '';
    
    const image = getMetaContent('og:image') || 
                 getMetaContent('twitter:image') ||
                 '';
    
    const siteName = getMetaContent('og:site_name') || urlObj.hostname;
    
    // Special handling for YouTube URLs
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return {
          title: title,
          description: description,
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          siteName: 'YouTube',
          url: url,
          type: 'video',
          domain: urlObj.hostname
        };
      }
    }
    
    // Special handling for common music platforms
    if (url.includes('spotify.com')) {
      return {
        title: title,
        description: description,
        image: image,
        siteName: 'Spotify',
        url: url,
        type: 'music',
        domain: urlObj.hostname
      };
    }
    
    if (url.includes('soundcloud.com')) {
      return {
        title: title,
        description: description,
        image: image,
        siteName: 'SoundCloud',
        url: url,
        type: 'music',
        domain: urlObj.hostname
      };
    }
    
    return {
      title: title || 'Shared Link',
      description: description,
      image: image,
      siteName: siteName,
      url: url,
      type: 'link',
      domain: urlObj.hostname
    };
    
  } catch (error) {
    console.error('URL preview fetch error:', error);
    
    // Fallback to basic URL info
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname,
        description: '',
        image: '',
        siteName: urlObj.hostname,
        url: url,
        type: 'link',
        domain: urlObj.hostname
      };
    } catch {
      return null;
    }
  }
};

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Check if URL is an image
export const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
};

// Check if URL is a video
export const isVideoUrl = (url) => {
  return /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i.test(url) ||
         url.includes('youtube.com') || 
         url.includes('youtu.be') ||
         url.includes('vimeo.com');
};