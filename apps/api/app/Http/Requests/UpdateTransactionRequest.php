<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $transaction = $this->route('transaction');

        return $transaction && $this->user()->id === $transaction->user_id;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['nullable', 'string', 'max:100'],
            'transaction_date' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'payment_method' => ['sometimes', 'required', 'string', 'in:Transfer,Cash,QRIS'],
            'status' => ['sometimes', 'required', 'string', 'in:success,pending,failed'],

            'items' => ['sometimes', 'required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required_with:items',
                'integer',
                Rule::exists('products', 'id')
                    ->where('user_id', $this->user()->id)
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],
            'items.*.qty' => ['required_with:items', 'integer', 'min:1', 'max:9999'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.*.product_id.exists' => 'Produk tidak ditemukan atau bukan milik Anda.',
            'transaction_date.before_or_equal' => 'Tanggal transaksi tidak boleh di masa depan.',
        ];
    }
}
