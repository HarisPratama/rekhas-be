// src/common/helpers/wa-chat.helper.ts
import axios from 'axios';
import * as process from "node:process";

export const sendWhatsAppMessage = async (to: string, message: string) => {
    try {
        const response = await axios.post(
            process.env.WHATSAPP_API_URL,
            { to, message },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: process.env.WHATSAPP_API_KEY,
                },
            },
        );
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || 'Failed to send WhatsApp message');
    }
};
