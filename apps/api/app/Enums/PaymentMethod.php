<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Transfer = 'Transfer';
    case Cash = 'Cash';
    case QRIS = 'QRIS';
}
