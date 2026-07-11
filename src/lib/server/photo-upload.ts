import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const uploadDir = join(tmpdir(), 'site-foto-photo-uploads');
const maxAgeMs = 2 * 60 * 60 * 1000;

type UploadMetadata = {
    userId: number;
    filename: string;
    mimeType: string;
    createdAt: number;
};

function safeToken(token: string): string {
    if (!/^[a-f0-9-]{36}$/i.test(token)) throw new Error('UPLOAD_INVALIDO');
    return token;
}

async function cleanupExpiredUploads(): Promise<void> {
    await mkdir(uploadDir, { recursive: true });
    const entries = await readdir(uploadDir).catch(() => []);
    const now = Date.now();

    await Promise.all(entries.map(async entry => {
        const path = join(uploadDir, entry);
        const info = await stat(path).catch(() => null);
        if (info && now - info.mtimeMs > maxAgeMs) await rm(path, { force: true });
    }));
}

export async function stagePhotoUpload(input: {
    userId: number;
    filename: string;
    mimeType: string;
    image: Buffer;
}): Promise<string> {
    await cleanupExpiredUploads();
    const token = randomUUID();
    const metadata: UploadMetadata = {
        userId: input.userId,
        filename: input.filename,
        mimeType: input.mimeType,
        createdAt: Date.now(),
    };

    await Promise.all([
        writeFile(join(uploadDir, `${token}.bin`), input.image),
        writeFile(join(uploadDir, `${token}.json`), JSON.stringify(metadata), 'utf8'),
    ]);

    return token;
}

export async function readStagedPhoto(tokenValue: string, userId: number): Promise<{
    filename: string;
    mimeType: string;
    image: Buffer;
} | null> {
    await cleanupExpiredUploads();
    const token = safeToken(tokenValue);
    const metadataPath = join(uploadDir, `${token}.json`);
    const imagePath = join(uploadDir, `${token}.bin`);

    try {
        const metadata = JSON.parse(await readFile(metadataPath, 'utf8')) as UploadMetadata;
        if (metadata.userId !== userId || Date.now() - metadata.createdAt > maxAgeMs) return null;

        return {
            filename: metadata.filename,
            mimeType: metadata.mimeType,
            image: await readFile(imagePath),
        };
    } catch {
        return null;
    }
}

export async function removeStagedPhoto(tokenValue: string): Promise<void> {
    const token = safeToken(tokenValue);
    await Promise.all([
        rm(join(uploadDir, `${token}.bin`), { force: true }),
        rm(join(uploadDir, `${token}.json`), { force: true }),
    ]);
}
