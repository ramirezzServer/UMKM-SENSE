<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PredictionClient
{
    private string $baseUrl;

    private string $internalKey;

    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.predict.url', 'http://localhost:8001'), '/');
        $this->internalKey = (string) config('services.predict.key', '');
        $this->timeout = (int) config('services.predict.timeout', 30);
    }

    /**
     * Call POST /predict on the FastAPI microservice.
     *
     * @throws RuntimeException when the service is unavailable or returns an error
     */
    public function predict(array $payload): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders(['X-Internal-Key' => $this->internalKey])
                ->post("{$this->baseUrl}/predict", $payload);

            if ($response->failed()) {
                throw new RuntimeException(
                    "Layanan prediksi mengembalikan error {$response->status()}."
                );
            }

            return $response->json();
        } catch (ConnectionException $e) {
            throw new RuntimeException(
                'Layanan prediksi tidak dapat dihubungi. Pastikan service berjalan.', 0, $e
            );
        }
    }

    /**
     * Quick health check — returns false without throwing.
     */
    public function isHealthy(): bool
    {
        try {
            return Http::timeout(5)
                ->get("{$this->baseUrl}/health")
                ->ok();
        } catch (\Throwable) {
            return false;
        }
    }
}
