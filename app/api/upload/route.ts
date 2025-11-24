import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUploadsDir, getUploadPath } from '@/lib/storage';
import { promises as fs } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = path.extname(file.name);
    const filename = `${generateId()}${fileExt}`;
    const filepath = getUploadPath(filename);

    await fs.writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        filename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        url: `/api/files/${filename}`,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

