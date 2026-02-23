import { useState } from 'react';
import axios from 'axios';

declare global {
    interface Window {
        snap: any;
    }
}

const Payment = () => {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            // 1. Fetch token from backend
            const response = await axios.post('http://localhost:3000/payment/token', {
                order_id: `ORDER-${Date.now()}`,
                amount: 100000, // Example amount
            });

            const { token } = response.data;

            // 2. Open Snap Popup
            window.snap.pay(token, {
                onSuccess: function (result: any) {
                    console.log('success', result);
                    alert('Payment Success!');
                },
                onPending: function (result: any) {
                    console.log('pending', result);
                    alert('Waiting for your payment!');
                },
                onError: function (result: any) {
                    console.log('error', result);
                    alert('Payment Failed!');
                },
                onClose: function () {
                    console.log('customer closed the popup without finishing the payment');
                    alert('You closed the popup without finishing the payment');
                },
            });
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-xl bg-white shadow-sm">
            <h2 className="text-xl font-bold mb-4">Integrasi Midtrans</h2>
            <p className="mb-4">Klik tombol di bawah untuk mencoba pembayaran sandbox.</p>
            <button
                onClick={handlePay}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
                {loading ? 'Processing...' : 'Bayar Sekarang'}
            </button>
        </div>
    );
};

export default Payment;
