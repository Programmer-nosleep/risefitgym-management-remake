import { describe, it, expect } from 'bun:test';

// 💡 Bun bawaan sudah memiliki test runner yang super cepat. 
// Kamu tidak perlu menginstall Jest, cukup import dari 'bun:test'

describe('Contoh Backend Test', () => {
    it('harus memastikan 1 + 1 = 2', () => {
        expect(1 + 1).toBe(2);
    });

    // Contoh test untuk mengecek sebuah function
    it('harus menyapa dengan benar', () => {
        const sapa = (nama: string) => `Halo ${nama}`;
        expect(sapa('Budi')).toBe('Halo Budi');
    });

    /*
    // 💡 Contoh kalau kamu ingin mengetes Endpoint di Elysia:
    // import { app } from '../src/server'; // Sesuaikan file utama aplikasimu
    //
    // it('harus merespon dari endpoint utama', async () => {
    //   const request = new Request('http://localhost/');
    //   const response = await app.handle(request);
    //   
    //   expect(response.status).toBe(200);
    //   expect(await response.text()).toBe('Hello World'); // Sesuaikan dengan response aplikasimu
    // });
    */
});
