<?php

namespace App\Http\Requests;

use App\Rules\SafeImportMime;
use Illuminate\Foundation\Http\FormRequest;

class ImportPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120', new SafeImportMime],
        ];
    }

    public function messages(): array
    {
        return [
            'file.max' => 'Ukuran file maksimal 5 MB.',
        ];
    }
}
