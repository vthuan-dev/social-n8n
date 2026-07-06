import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

// Thin wrapper quanh axios để dễ mock trong test và tập trung cấu hình chung.
// Tự đính kèm shared secret header khi gọi sang n8n (nếu có cấu hình).
@Injectable()
export class HttpService {
  private withSecret(config?: AxiosRequestConfig): AxiosRequestConfig {
    const secret = process.env.WEBHOOK_SECRET;
    return {
      timeout: 15000,
      ...config,
      headers: {
        ...(secret ? { 'x-webhook-secret': secret } : {}),
        ...(config?.headers ?? {}),
      },
    };
  }

  async post<T = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await axios.post<T>(url, data, this.withSecret(config));
    return res.data;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await axios.get<T>(url, this.withSecret(config));
    return res.data;
  }
}
