<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by policy in controller
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'in:Kuliner,Ritel,Jasa,Lainnya'],
            'district' => ['sometimes', 'string', 'max:100', 'exists:districts,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'Nama usaha maksimal 100 karakter.',
            'category.in' => 'Kategori usaha tidak valid. Pilih: Kuliner, Ritel, Jasa, atau Lainnya.',
            'district.exists' => 'Kecamatan tidak ditemukan dalam daftar.',
        ];
    }
}
