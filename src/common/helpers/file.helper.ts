import * as fs from 'fs';
import * as path from 'path';

/**
 * Hapus file dari path yang diberikan jika ada
 * @param relativePath Relative path dari file terhadap root project
 */
export function safeDeleteFile(relativePath: string): void {
    try {
        const filePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Gagal menghapus file: ${relativePath}`, error);
    }
}
