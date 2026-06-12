<?php

namespace App\Http\Requests;

use App\Rules\SafeImageMime;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'name')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],
            'price' => ['required', 'numeric', 'min:0.01', 'max:10000000'],
            'current_stock' => ['required', 'integer', 'min:0'],
            'category' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', new SafeImageMime],
        ];
    }
}
