<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class StorePredictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ownership checked in withValidator
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'prediction_start' => ['required', 'date_format:Y-m-d'],
            'prediction_end' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:prediction_start',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $startRaw = $this->input('prediction_start');
                    if ($startRaw && $value) {
                        $days = Carbon::parse($startRaw)->diffInDays(Carbon::parse($value));
                        if ($days > 14) {
                            $fail('Horizon prediksi maksimal 14 hari.');
                        }
                    }
                },
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $product = Product::find($this->input('product_id'));
            if ($product && $product->user_id !== $this->user()->id) {
                $v->errors()->add('product_id', 'Produk tidak ditemukan atau bukan milik Anda.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Produk wajib dipilih.',
            'product_id.exists' => 'Produk tidak ditemukan.',
            'prediction_start.required' => 'Tanggal mulai prediksi wajib diisi.',
            'prediction_start.date_format' => 'Format tanggal mulai harus YYYY-MM-DD.',
            'prediction_end.required' => 'Tanggal akhir prediksi wajib diisi.',
            'prediction_end.date_format' => 'Format tanggal akhir harus YYYY-MM-DD.',
            'prediction_end.after_or_equal' => 'Tanggal akhir harus sama dengan atau setelah tanggal mulai.',
        ];
    }
}
