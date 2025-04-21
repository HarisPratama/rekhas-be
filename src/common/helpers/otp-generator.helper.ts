import { createHmac } from 'crypto';
import {BadRequestException} from "@nestjs/common";

export const generateOtp = (phoneNumber: string) => {
    const otp = Math.floor(Math.random() * 9000 + 1000); // 4 digit
    const ttl = 10 * 60 * 1000; // 10 menit
    const expires = Date.now() + ttl;
    const data = `${otp}.${phoneNumber}.${expires}`;

    const hash = createHmac('sha256', process.env.SECRET_KEY || 'default-secret')
        .update(data)
        .digest('hex');

    return { otp, hash, expires };
};

export function normalizeInternationalPhoneNumber(phone: string): string {
    // Hapus semua karakter selain angka
    const cleaned = phone.replace(/\D/g, '');

    // Validasi sederhana: minimal 8 digit (supaya gak kosong atau aneh)
    if (cleaned.length < 8) {
        throw new BadRequestException('Invalid phone number format');
    }

    return cleaned;
}

