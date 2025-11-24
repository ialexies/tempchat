export interface User {
  username: string;
  passwordHash: string;
}

export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  attachments?: Attachment[];
  gifUrl?: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
}

export interface GiphyResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

