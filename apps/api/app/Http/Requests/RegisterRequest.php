<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'business_name' => ['required', 'string', 'max:100'],
            'business_category' => ['required', 'string', 'in:Kuliner,Ritel,Jasa,Lainnya'],
            'district' => ['required', 'string', 'max:100', 'exists:districts,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max' => 'Nama maksimal 100 karakter.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.max' => 'Email maksimal 150 karakter.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'business_name.required' => 'Nama usaha wajib diisi.',
            'business_name.max' => 'Nama usaha maksimal 100 karakter.',
            'business_category.required' => 'Kategori usaha wajib dipilih.',
            'business_category.in' => 'Kategori usaha tidak valid. Pilih: Kuliner, Ritel, Jasa, atau Lainnya.',
            'district.required' => 'Kecamatan wajib dipilih.',
            'district.exists' => 'Kecamatan tidak ditemukan dalam daftar.',
        ];
    }
}
