<?php
declare(strict_types=1);

function field_string(array $body, string $key, bool $required = false, int $max = 255): ?string
{
    if (!array_key_exists($key, $body) || $body[$key] === null) {
        if ($required) {
            fail('validation_error', 'Field "' . $key . '" is required.', 422);
        }
        return null;
    }

    $value = $body[$key];
    if (!is_string($value)) {
        fail('validation_error', 'Field "' . $key . '" must be a string.', 422);
    }

    $value = trim($value);
    if ($value === '' && $required) {
        fail('validation_error', 'Field "' . $key . '" is required.', 422);
    }
    if (mb_strlen($value) > $max) {
        fail('validation_error', 'Field "' . $key . '" must be at most ' . $max . ' characters.', 422);
    }
    return $value;
}

function field_int(array $body, string $key, bool $required = false, ?int $min = null, ?int $max = null): ?int
{
    if (!array_key_exists($key, $body) || $body[$key] === null) {
        if ($required) {
            fail('validation_error', 'Field "' . $key . '" is required.', 422);
        }
        return null;
    }

    $value = $body[$key];
    if (is_int($value)) {
        $int = $value;
    } elseif (is_float($value) && floor($value) === $value) {
        $int = (int)$value;
    } elseif (is_string($value) && preg_match('/^-?\d+$/', trim($value)) === 1) {
        $int = (int)trim($value);
    } else {
        fail('validation_error', 'Field "' . $key . '" must be an integer.', 422);
    }

    if ($min !== null && $int < $min) {
        fail('validation_error', 'Field "' . $key . '" must be at least ' . $min . '.', 422);
    }
    if ($max !== null && $int > $max) {
        fail('validation_error', 'Field "' . $key . '" must be at most ' . $max . '.', 422);
    }
    return $int;
}

function field_bool(array $body, string $key, bool $required = false): ?bool
{
    if (!array_key_exists($key, $body) || $body[$key] === null) {
        if ($required) {
            fail('validation_error', 'Field "' . $key . '" is required.', 422);
        }
        return null;
    }

    $value = $body[$key];
    if (is_bool($value)) {
        return $value;
    }
    if (is_int($value) && ($value === 0 || $value === 1)) {
        return $value === 1;
    }
    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
            return false;
        }
    }
    fail('validation_error', 'Field "' . $key . '" must be a boolean.', 422);
}

function field_enum(array $body, string $key, array $allowed, bool $required = false): ?string
{
    $value = field_string($body, $key, $required, 64);
    if ($value === null) {
        return null;
    }
    if (!in_array($value, $allowed, true)) {
        fail('validation_error', 'Field "' . $key . '" must be one of: ' . implode(', ', $allowed) . '.', 422);
    }
    return $value;
}

function field_email(array $body, string $key, bool $required = false): ?string
{
    $value = field_string($body, $key, $required, 190);
    if ($value === null) {
        return null;
    }
    if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
        fail('validation_error', 'Field "' . $key . '" must be a valid email address.', 422);
    }
    return $value;
}

function field_code(array $body, string $key, bool $required = false): ?string
{
    $value = field_string($body, $key, $required, 12);
    if ($value === null) {
        return null;
    }
    $value = strtoupper($value);
    if (preg_match('/^[A-Z0-9]{1,12}$/', $value) !== 1) {
        fail('validation_error', 'Field "' . $key . '" must be 1-12 letters or digits, for example 7A.', 422);
    }
    return $value;
}

function field_int_list(array $body, string $key, bool $required = false, ?int $min = null, ?int $max = null): ?array
{
    if (!array_key_exists($key, $body) || $body[$key] === null) {
        if ($required) {
            fail('validation_error', 'Field "' . $key . '" is required.', 422);
        }
        return null;
    }

    $value = $body[$key];
    if (!is_array($value) || !array_is_list($value)) {
        fail('validation_error', 'Field "' . $key . '" must be a list of integers.', 422);
    }
    if (count($value) > 100) {
        fail('validation_error', 'Field "' . $key . '" has too many items.', 422);
    }

    $ints = [];
    foreach ($value as $item) {
        if (is_int($item)) {
            $int = $item;
        } elseif (is_string($item) && preg_match('/^\d+$/', trim($item)) === 1) {
            $int = (int)trim($item);
        } else {
            fail('validation_error', 'Field "' . $key . '" must contain only integers.', 422);
        }
        if ($min !== null && $int < $min) {
            fail('validation_error', 'Field "' . $key . '" contains a value below ' . $min . '.', 422);
        }
        if ($max !== null && $int > $max) {
            fail('validation_error', 'Field "' . $key . '" contains a value above ' . $max . '.', 422);
        }
        $ints[] = $int;
    }
    return $ints;
}

function route_id(string $value): int
{
    if (preg_match('/^\d+$/', $value) !== 1 || (int)$value < 1) {
        fail('not_found', 'Resource not found.', 404);
    }
    return (int)$value;
}
