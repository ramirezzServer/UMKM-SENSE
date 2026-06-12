<?php

namespace App\Enums;

enum BusinessCategory: string
{
    case Kuliner = 'Kuliner';
    case Ritel = 'Ritel';
    case Jasa = 'Jasa';
    case Lainnya = 'Lainnya';
}
