import { useEffect, useRef } from 'react';
import { TextField } from 'material/react';
import type { TextFieldElement } from 'material/elements';

export function RangeField({
  label,
  value,
  error,
  supportingText,
  onChange,
}: {
  label: string;
  value: string;
  error: string;
  supportingText: string;
  onChange: (value: string) => void;
}) {
  const field = useRef<TextFieldElement>(null);
  useEffect(() => {
    // The React adapter does not forward these attributes to its native input.
    const input = field.current?.component?.input;
    if (!input) return;
    input.inputMode = 'numeric';
    input.setAttribute('aria-invalid', String(Boolean(error)));
  }, [error]);
  return (
    <TextField
      ref={field}
      label={label}
      variant="outlined"
      autocomplete="off"
      value={value}
      error={Boolean(error)}
      supportingText={error || supportingText}
      onInput={(event) => onChange(event.detail.value)}
    />
  );
}
